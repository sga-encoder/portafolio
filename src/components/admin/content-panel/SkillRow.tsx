import EditableImage from "../content-editor/EditableImage";
import type { Skill } from "../../../data/skillsPages";

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

const RADIUS = 42;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

interface Props {
  skill: Skill;
  /** Color del anillo — mismo criterio que `--sphere-left/right-color` del sitio público, pero
   * fijo a `--color-brand`/`--color-accent-2` porque `/admin` no tiene escena 3D. */
  color: string;
  /** Lista editable de categorías (073, paso 2) — ver `skillCategories.ts`/`SkillCategoriesPanel.tsx`.
   * Si `skill.category` ya no está en esta lista (categoría borrada/renombrada), el `<select>`
   * simplemente no la muestra seleccionada hasta que se elija una — el dato no se pierde. */
  categories: string[];
  onChange: (next: Skill) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}

/**
 * Fila editable de una skill (073): mismo look que `SkillCard`/`SkillRing` del sitio público
 * (anillo de progreso + ícono + porcentaje + nombre) pero con los tres campos editables in-place
 * y sin el escalonado en chevron (decorativo, no aplica en el editor). La categoría pasa a ser un
 * `<select>` compacto al lado en vez del bloque con label debajo que tenía `065`/`069`.
 */
export default function SkillRow({
  skill,
  color,
  categories,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
}: Props) {
  const clamped = Math.min(Math.max(skill.percentage, 0), 100);
  const offset = CIRCUMFERENCE * (1 - clamped / 100);

  return (
    <div className="flex items-center gap-2">
      <div className="flex flex-col items-center gap-1">
        <div
          className="relative flex shrink-0 items-center justify-center"
          style={{ width: "clamp(2.5rem, 7vh, 4.25rem)", aspectRatio: "1 / 1" }}
        >
          <svg
            viewBox="0 0 100 100"
            className="pointer-events-none absolute inset-0 h-full w-full"
            style={{ transform: "rotate(-90deg)" }}
            aria-hidden="true"
          >
            <circle
              cx="50"
              cy="50"
              r={RADIUS}
              fill="none"
              stroke={color}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={offset}
            />
          </svg>
          <EditableImage
            value={skill.imageKey}
            onChange={(imageKey) => onChange({ ...skill, imageKey })}
            alt={skill.name || "Ícono de la habilidad"}
            className="h-[70%] w-[70%] overflow-hidden rounded-full"
          />
        </div>

        <input
          type="number"
          min={0}
          max={100}
          value={skill.percentage}
          onChange={(event) => onChange({ ...skill, percentage: Number(event.target.value) })}
          aria-label="Porcentaje"
          className="w-12 rounded border border-ink-muted/30 bg-transparent px-1 py-0.5 text-center text-xs font-display font-bold"
          style={{ color }}
        />
        <input
          type="text"
          value={skill.name}
          onChange={(event) => onChange({ ...skill, name: event.target.value })}
          placeholder="Nombre"
          aria-label="Nombre"
          className="w-24 rounded border border-ink-muted/30 bg-transparent px-1 py-0.5 text-center text-[0.7rem] text-ink-muted"
        />
      </div>

      <select
        value={skill.category}
        onChange={(event) => onChange({ ...skill, category: event.target.value })}
        aria-label="Categoría"
        title={capitalize(skill.category || "Sin categoría")}
        className="w-20 shrink-0 truncate rounded-lg border border-ink-muted/30 bg-transparent px-1.5 py-1 text-[0.7rem]"
      >
        {!categories.includes(skill.category) && (
          <option value={skill.category} disabled>
            {capitalize(skill.category || "Sin categoría")}
          </option>
        )}
        {categories.map((category) => (
          <option key={category} value={category}>
            {capitalize(category)}
          </option>
        ))}
      </select>

      <div className="flex shrink-0 flex-col gap-0.5">
        <button
          type="button"
          onClick={onMoveUp}
          disabled={!canMoveUp}
          aria-label="Subir"
          title="Subir"
          className="flex h-5 w-5 items-center justify-center rounded-full bg-surface-muted text-[0.65rem] disabled:opacity-30"
        >
          ↑
        </button>
        <button
          type="button"
          onClick={onMoveDown}
          disabled={!canMoveDown}
          aria-label="Bajar"
          title="Bajar"
          className="flex h-5 w-5 items-center justify-center rounded-full bg-surface-muted text-[0.65rem] disabled:opacity-30"
        >
          ↓
        </button>
        <button
          type="button"
          onClick={onRemove}
          aria-label="Quitar habilidad"
          title="Quitar habilidad"
          className="flex h-5 w-5 items-center justify-center rounded-full bg-surface-muted text-[0.65rem] text-red-500"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
