import EditableImage from "../content-editor/EditableImage";
import type { Skill, SkillsColumn, SkillsColumnType } from "../../../data/skillsPages";
import SkillRow from "./SkillRow";

function newSkill(): Skill {
  return { name: "", percentage: 50, imageKey: "", category: "lenguajes" };
}

function emptyColumnOf(type: SkillsColumnType): SkillsColumn {
  return type === "skills" ? { type: "skills", skills: [] } : { type: "image", imageKey: "" };
}

function hasData(column: SkillsColumn): boolean {
  return column.type === "skills" ? (column.skills?.length ?? 0) > 0 : Boolean(column.imageKey);
}

interface Props {
  column: SkillsColumn;
  onChange: (next: SkillsColumn) => void;
  onRemove: () => void;
  onMoveLeft: () => void;
  onMoveRight: () => void;
  canMoveLeft: boolean;
  canMoveRight: boolean;
}

/**
 * Tarjeta de una columna dentro de una página de Habilidades (069): tipo ("skills"/"image"),
 * reordenar izquierda/derecha dentro de la página, quitar, y contenido según tipo. Cambiar el
 * tipo con datos cargados pide confirmación antes de descartarlos.
 */
export default function SkillsColumnCard({
  column,
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
    onChange({ ...column, skills: [...(column.skills ?? []), newSkill()] });
  }

  const skills = column.skills ?? [];

  return (
    <div className="flex flex-col gap-3 rounded-xl bg-surface p-3">
      <div className="flex items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-sm">
          <span className="text-ink-muted">Tipo</span>
          <select
            value={column.type}
            onChange={(event) => handleTypeChange(event.target.value as SkillsColumnType)}
            className="rounded-lg border border-ink-muted/30 bg-transparent px-3 py-2"
          >
            <option value="skills">Habilidades</option>
            <option value="image">Imagen</option>
          </select>
        </label>

        <div className="flex shrink-0 gap-1">
          <button
            type="button"
            onClick={onMoveLeft}
            disabled={!canMoveLeft}
            aria-label="Mover columna a la izquierda"
            title="Mover columna a la izquierda"
            className="flex h-7 w-7 items-center justify-center rounded-full bg-surface-muted text-sm disabled:opacity-30"
          >
            ←
          </button>
          <button
            type="button"
            onClick={onMoveRight}
            disabled={!canMoveRight}
            aria-label="Mover columna a la derecha"
            title="Mover columna a la derecha"
            className="flex h-7 w-7 items-center justify-center rounded-full bg-surface-muted text-sm disabled:opacity-30"
          >
            →
          </button>
          <button
            type="button"
            onClick={onRemove}
            aria-label="Quitar columna"
            title="Quitar columna"
            className="flex h-7 w-7 items-center justify-center rounded-full bg-surface-muted text-sm text-red-500"
          >
            ✕
          </button>
        </div>
      </div>

      {column.type === "skills" ? (
        <div className="flex flex-col gap-3">
          {skills.map((skill, index) => (
            <SkillRow
              key={index}
              skill={skill}
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
            className="rounded-lg border-2 border-dashed border-ink-muted/30 px-4 py-2 text-sm text-ink-muted hover:border-ink-muted hover:text-ink"
          >
            + Agregar habilidad
          </button>
        </div>
      ) : (
        <EditableImage
          value={column.imageKey ?? ""}
          onChange={(imageKey) => onChange({ ...column, imageKey })}
          alt="Imagen de la columna"
          className="h-40 w-40"
        />
      )}
    </div>
  );
}
