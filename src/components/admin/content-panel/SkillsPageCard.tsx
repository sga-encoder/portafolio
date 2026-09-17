import type { SkillsColumn, SkillsColumnType, SkillsPage } from "../../../data/skillsPages";
import SkillsColumnCard from "./SkillsColumnCard";

function newColumn(type: SkillsColumnType): SkillsColumn {
  return type === "skills" ? { type: "skills", skills: [] } : { type: "image", imageKey: "" };
}

/** Mismo criterio que `SkillsPage.astro` del sitio público: mitad izquierda del array de
 * columnas queda "left", la mitad derecha "right" — define el color del anillo de cada skill. */
function sideFor(index: number, total: number): "left" | "right" {
  return index < total / 2 ? "left" : "right";
}

interface Props {
  page: SkillsPage;
  categories: string[];
  onChange: (next: SkillsPage) => void;
}

/**
 * Editor de columnas de una página de Habilidades (073): columnas lado a lado igual que
 * `SkillsPage.astro` del sitio público. Sin chrome de página propio — la navegación entre páginas
 * y su reordenamiento viven en `SkillsPagesTab.tsx` (carrusel, mismo patrón que
 * `SkillsCarousel.tsx`), acá solo se edita el contenido de la página actual.
 */
export default function SkillsPageCard({ page, categories, onChange }: Props) {
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
    <div className="flex flex-col items-center gap-3">
      <div className="flex flex-col items-stretch gap-3 md:flex-row md:justify-center md:gap-[2vw]">
        {page.columns.map((column, colIndex) => (
          <SkillsColumnCard
            key={colIndex}
            column={column}
            color={sideFor(colIndex, page.columns.length) === "left" ? "var(--color-brand)" : "var(--color-accent-2)"}
            categories={categories}
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
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => addColumn("skills")}
            className="rounded-lg border-2 border-dashed border-ink-muted/30 px-3 py-1 text-xs text-ink-muted hover:border-ink-muted hover:text-ink"
          >
            + Columna de habilidades
          </button>
          <button
            type="button"
            onClick={() => addColumn("image")}
            className="rounded-lg border-2 border-dashed border-ink-muted/30 px-3 py-1 text-xs text-ink-muted hover:border-ink-muted hover:text-ink"
          >
            + Columna de imagen
          </button>
        </div>
      )}
    </div>
  );
}
