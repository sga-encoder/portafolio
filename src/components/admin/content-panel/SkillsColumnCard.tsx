import EditableImage from "../content-editor/EditableImage";
import type { Skill, SkillsColumn, SkillsColumnType } from "../../../data/skillsPages";
import SkillRow from "./SkillRow";

function newSkill(defaultCategory: string): Skill {
  return { name: "", percentage: 50, imageKey: "", category: defaultCategory };
}

function emptyColumnOf(type: SkillsColumnType): SkillsColumn {
  return type === "skills" ? { type: "skills", skills: [] } : { type: "image", imageKey: "" };
}

function hasData(column: SkillsColumn): boolean {
  return column.type === "skills" ? (column.skills?.length ?? 0) > 0 : Boolean(column.imageKey);
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
 * Columna dentro de una página de Habilidades (073): tipo ("skills"/"image"), reordenar
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
  function handleTypeChange(nextType: SkillsColumnType) {
    if (nextType === column.type) return;
    if (hasData(column)) {
      const discarded = column.type === "skills" ? "las habilidades cargadas" : "la imagen cargada";
      if (!confirm(`Cambiar el tipo de columna descarta ${discarded}. ¿Continuar?`)) return;
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
          value={column.type}
          onChange={(event) => handleTypeChange(event.target.value as SkillsColumnType)}
          className="rounded-lg border border-ink-muted/30 bg-transparent px-2 py-0.5 text-xs"
        >
          <option value="skills">Habilidades</option>
          <option value="image">Imagen</option>
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

      {column.type === "skills" ? (
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
        <div className="flex flex-1 items-center justify-center">
          <EditableImage
            value={column.imageKey ?? ""}
            onChange={(imageKey) => onChange({ ...column, imageKey })}
            alt="Imagen de la columna"
            className="aspect-square w-[clamp(6rem,22vh,12rem)]"
          />
        </div>
      )}
    </div>
  );
}
