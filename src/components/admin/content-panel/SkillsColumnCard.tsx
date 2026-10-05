import type { Skill, SkillsColumn, SkillsColumnType } from "../../../data/skillsPages";
import SkillRow from "./SkillRow";

function newSkill(defaultCategory: string): Skill {
  return { name: "", percentage: 50, imageKey: "", category: defaultCategory };
}

function emptyColumnOf(type: SkillsColumnType): SkillsColumn {
  return type === "skills" ? { type: "skills", skills: [] } : { type: "slash" };
}

/** Borradores viejos pueden traer `type: "image"` (antes de 101): todo lo que no sea "skills" se
 * trata como "slash". */
function normalizedType(column: SkillsColumn): SkillsColumnType {
  return column.type === "skills" ? "skills" : "slash";
}

/** La columna "slash" (101) es pura decoración, sin datos que descartar. */
function hasData(column: SkillsColumn): boolean {
  return normalizedType(column) === "skills" && (column.skills?.length ?? 0) > 0;
}

interface Props {
  column: SkillsColumn;
  color: string;
  categories: string[];
  onChange: (next: SkillsColumn) => void;
  onRemove: () => void;
  onMoveLeft: () => void;
  onMoveRight: () => void;
  canMoveLeft: boolean;
  canMoveRight: boolean;
}

/**
 * Columna dentro de una página de Habilidades (073): tipo ("skills"/"slash" — caja inclinada `\`
 * que reemplaza a la vieja "image", 101), reordenar
 * izquierda/derecha, quitar, y contenido según tipo — mismo tamaño `clamp()`/`vh` que el resto del
 * editor para que la página completa quepa en el viewport sin scroll. Cambiar el tipo con datos
 * cargados pide confirmación antes de descartarlos.
 */
export default function SkillsColumnCard({
  column,
  color,
  categories,
  onChange,
  onRemove,
  onMoveLeft,
  onMoveRight,
  canMoveLeft,
  canMoveRight,
}: Props) {
  const type = normalizedType(column);

  function handleTypeChange(nextType: SkillsColumnType) {
    if (nextType === type) return;
    if (hasData(column) && !confirm("Cambiar el tipo de columna descarta las habilidades cargadas. ¿Continuar?")) {
      return;
    }
    onChange(emptyColumnOf(nextType));
  }

  function updateSkillAt(index: number, next: Skill) {
    const skills = column.skills ?? [];
    onChange({ ...column, skills: skills.map((skill, i) => (i === index ? next : skill)) });
  }

  function removeSkillAt(index: number) {
    onChange({ ...column, skills: (column.skills ?? []).filter((_, i) => i !== index) });
  }

  function moveSkillBy(index: number, delta: number) {
    const skills = column.skills ?? [];
    const target = index + delta;
    if (target < 0 || target >= skills.length) return;
    const next = [...skills];
    [next[index], next[target]] = [next[target], next[index]];
    onChange({ ...column, skills: next });
  }

  function addSkill() {
    onChange({ ...column, skills: [...(column.skills ?? []), newSkill(categories[0] ?? "")] });
  }

  const skills = column.skills ?? [];

  return (
    <div className="flex h-full flex-col items-center gap-1.5">
      <div className="flex shrink-0 items-center gap-1">
        <select
          value={type}
          onChange={(event) => handleTypeChange(event.target.value as SkillsColumnType)}
          className="rounded-lg border border-ink-muted/30 bg-transparent px-2 py-0.5 text-xs"
        >
          <option value="skills">Habilidades</option>
          <option value="slash">Caja inclinada \</option>
        </select>
        <button
          type="button"
          onClick={onMoveLeft}
          disabled={!canMoveLeft}
          aria-label="Mover columna a la izquierda"
          title="Mover columna a la izquierda"
          className="flex h-5 w-5 items-center justify-center rounded-full bg-surface-muted text-[0.65rem] disabled:opacity-30"
        >
          ←
        </button>
        <button
          type="button"
          onClick={onMoveRight}
          disabled={!canMoveRight}
          aria-label="Mover columna a la derecha"
          title="Mover columna a la derecha"
          className="flex h-5 w-5 items-center justify-center rounded-full bg-surface-muted text-[0.65rem] disabled:opacity-30"
        >
          →
        </button>
        <button
          type="button"
          onClick={onRemove}
          aria-label="Quitar columna"
          title="Quitar columna"
          className="flex h-5 w-5 items-center justify-center rounded-full bg-surface-muted text-[0.65rem] text-red-500"
        >
          ✕
        </button>
      </div>

      {type === "skills" ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-[1vh]">
          {skills.map((skill, index) => (
            <SkillRow
              key={index}
              skill={skill}
              color={color}
              categories={categories}
              onChange={(next) => updateSkillAt(index, next)}
              onRemove={() => removeSkillAt(index)}
              onMoveUp={() => moveSkillBy(index, -1)}
              onMoveDown={() => moveSkillBy(index, 1)}
              canMoveUp={index > 0}
              canMoveDown={index < skills.length - 1}
            />
          ))}
          <button
            type="button"
            onClick={addSkill}
            className="rounded-lg border-2 border-dashed border-ink-muted/30 px-2 py-1 text-[0.7rem] text-ink-muted hover:border-ink-muted hover:text-ink"
          >
            + Agregar habilidad
          </button>
        </div>
      ) : (
        // Vista previa de la caja inclinada (`SkillsSlashColumn.astro`): sin datos que editar.
        <div className="flex flex-1 items-center justify-center px-[clamp(1rem,3vh,2rem)]" aria-hidden="true">
          <div
            className="h-[clamp(8rem,40vh,20rem)] w-[clamp(1.5rem,4vw,3.5rem)] border-[6px] border-solid"
            style={{
              transform: "skewX(12deg)",
              borderImage:
                "conic-gradient(from 315deg at 50% 50%, var(--sphere-left-color, var(--color-brand)) 0%, var(--sphere-right-color, var(--color-accent-2)) 50%, var(--sphere-left-color, var(--color-brand)) 100%) 1",
              background: "color-mix(in srgb, var(--color-surface) 55%, transparent)",
              backgroundClip: "padding-box",
            }}
          />
        </div>
      )}
    </div>
  );
}
