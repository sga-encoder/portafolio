import EditableImage from "../content-editor/EditableImage";
import type { Skill, SkillCategory } from "../../../data/skillsPages";

const CATEGORY_OPTIONS: { value: SkillCategory; label: string }[] = [
  { value: "lenguajes", label: "Lenguajes" },
  { value: "herramientas", label: "Herramientas" },
  { value: "diseño", label: "Diseño" },
  { value: "frameworks", label: "Frameworks" },
];

interface Props {
  skill: Skill;
  onChange: (next: Skill) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}

/** Fila editable de una skill (065, sin `side` desde 069): imagen a la izquierda, campos a la derecha, reordenar/quitar. */
export default function SkillRow({ skill, onChange, onRemove, onMoveUp, onMoveDown, canMoveUp, canMoveDown }: Props) {
  return (
    <div className="flex items-start gap-4 rounded-xl bg-surface p-3">
      <EditableImage
        value={skill.imageKey}
        onChange={(imageKey) => onChange({ ...skill, imageKey })}
        alt={skill.name || "Ícono de la habilidad"}
        className="h-16 w-16 shrink-0"
      />

      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-ink-muted">Nombre</span>
          <input
            type="text"
            value={skill.name}
            onChange={(event) => onChange({ ...skill, name: event.target.value })}
            className="w-full rounded-lg border border-ink-muted/30 bg-transparent px-3 py-2"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-ink-muted">Porcentaje</span>
          <input
            type="number"
            min={0}
            max={100}
            value={skill.percentage}
            onChange={(event) => onChange({ ...skill, percentage: Number(event.target.value) })}
            className="w-full rounded-lg border border-ink-muted/30 bg-transparent px-3 py-2"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-ink-muted">Categoría</span>
          <select
            value={skill.category}
            onChange={(event) => onChange({ ...skill, category: event.target.value as SkillCategory })}
            className="w-full rounded-lg border border-ink-muted/30 bg-transparent px-3 py-2"
          >
            {CATEGORY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex shrink-0 flex-col gap-1">
        <button
          type="button"
          onClick={onMoveUp}
          disabled={!canMoveUp}
          aria-label="Subir"
          title="Subir"
          className="flex h-7 w-7 items-center justify-center rounded-full bg-surface-muted text-sm disabled:opacity-30"
        >
          ↑
        </button>
        <button
          type="button"
          onClick={onMoveDown}
          disabled={!canMoveDown}
          aria-label="Bajar"
          title="Bajar"
          className="flex h-7 w-7 items-center justify-center rounded-full bg-surface-muted text-sm disabled:opacity-30"
        >
          ↓
        </button>
        <button
          type="button"
          onClick={onRemove}
          aria-label="Quitar habilidad"
          title="Quitar habilidad"
          className="flex h-7 w-7 items-center justify-center rounded-full bg-surface-muted text-sm text-red-500"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
