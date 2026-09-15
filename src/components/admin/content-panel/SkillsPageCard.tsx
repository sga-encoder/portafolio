import type { SkillsColumn, SkillsColumnType, SkillsPage } from "../../../data/skillsPages";
import SkillsColumnCard from "./SkillsColumnCard";

function newColumn(type: SkillsColumnType): SkillsColumn {
  return type === "skills" ? { type: "skills", skills: [] } : { type: "image", imageKey: "" };
}

interface Props {
  page: SkillsPage;
  index: number;
  onChange: (next: SkillsPage) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}

/**
 * Tarjeta de una página del carrusel de Habilidades (069): header con reordenar/quitar página,
 * y debajo la lista de sus columnas (1 a 3, orden = orden visual izquierda→derecha en desktop).
 */
export default function SkillsPageCard({
  page,
  index,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
}: Props) {
  function updateColumnAt(colIndex: number, next: SkillsColumn) {
    onChange({ ...page, columns: page.columns.map((column, i) => (i === colIndex ? next : column)) });
  }

  function removeColumnAt(colIndex: number) {
    onChange({ ...page, columns: page.columns.filter((_, i) => i !== colIndex) });
  }

  function moveColumnBy(colIndex: number, delta: number) {
    const target = colIndex + delta;
    if (target < 0 || target >= page.columns.length) return;
    const next = [...page.columns];
    [next[colIndex], next[target]] = [next[target], next[colIndex]];
    onChange({ ...page, columns: next });
  }

  function addColumn(type: SkillsColumnType) {
    if (page.columns.length >= 3) return;
    onChange({ ...page, columns: [...page.columns, newColumn(type)] });
  }

  return (
    <div className="flex flex-col gap-4 rounded-2xl bg-surface-muted p-4">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-ink-muted">Página {index + 1}</span>
        <div className="flex shrink-0 gap-1">
          <button
            type="button"
            onClick={onMoveUp}
            disabled={!canMoveUp}
            aria-label="Subir página"
            title="Subir página"
            className="flex h-7 w-7 items-center justify-center rounded-full bg-surface text-sm disabled:opacity-30"
          >
            ↑
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={!canMoveDown}
            aria-label="Bajar página"
            title="Bajar página"
            className="flex h-7 w-7 items-center justify-center rounded-full bg-surface text-sm disabled:opacity-30"
          >
            ↓
          </button>
          <button
            type="button"
            onClick={onRemove}
            aria-label="Quitar página"
            title="Quitar página"
            className="flex h-7 w-7 items-center justify-center rounded-full bg-surface text-sm text-red-500"
          >
            ✕
          </button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {page.columns.map((column, colIndex) => (
          <SkillsColumnCard
            key={colIndex}
            column={column}
            onChange={(next) => updateColumnAt(colIndex, next)}
            onRemove={() => removeColumnAt(colIndex)}
            onMoveLeft={() => moveColumnBy(colIndex, -1)}
            onMoveRight={() => moveColumnBy(colIndex, 1)}
            canMoveLeft={colIndex > 0}
            canMoveRight={colIndex < page.columns.length - 1}
          />
        ))}
      </div>

      {page.columns.length < 3 && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => addColumn("skills")}
            className="rounded-lg border-2 border-dashed border-ink-muted/30 px-4 py-2 text-sm text-ink-muted hover:border-ink-muted hover:text-ink"
          >
            + Columna de habilidades
          </button>
          <button
            type="button"
            onClick={() => addColumn("image")}
            className="rounded-lg border-2 border-dashed border-ink-muted/30 px-4 py-2 text-sm text-ink-muted hover:border-ink-muted hover:text-ink"
          >
            + Columna de imagen
          </button>
        </div>
      )}
    </div>
  );
}
