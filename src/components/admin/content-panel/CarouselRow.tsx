import type { ProjectCardData } from "../../../lib/admin/projectCards";

interface Props {
  id: string;
  selected: ProjectCardData | undefined;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}

/**
 * Tarjeta del carrusel (071, sin selector desde 072; tarjeta chica en horizontal desde este
 * ajuste): miniatura de solo lectura (portada real del proyecto elegido) + título + año como
 * texto — sin ningún control para cambiar qué proyecto ocupa este lugar, eso ahora solo se elige
 * al agregar (`AddProjectModal`). La lista completa (`CarouselTab`) las acomoda en `flex-wrap` en
 * vez de una pila vertical de filas de punta a punta, así que cada una es una tarjeta chica
 * (imagen arriba, texto en medio, reordenar/quitar abajo) en vez de una fila horizontal ancha.
 * Mover "anterior/siguiente" (antes ↑/↓) reordena dentro de ese flujo horizontal.
 */
export default function CarouselRow({
  id,
  selected,
  onRemove,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
}: Props) {
  return (
    <div className="flex w-28 shrink-0 flex-col items-center gap-1 rounded-xl bg-surface p-2 text-center">
      {selected?.imageSrc ? (
        <img src={selected.imageSrc} alt={selected.title} className="aspect-square w-full rounded-lg object-cover" />
      ) : (
        <div className="flex aspect-square w-full items-center justify-center rounded-lg bg-surface-muted text-xs text-ink-muted">
          Sin proyecto
        </div>
      )}

      <span className="line-clamp-2 font-display text-xs font-bold leading-tight text-ink">
        {selected?.title ?? (id ? `Proyecto no encontrado (${id})` : "Sin proyecto")}
      </span>
      {selected && <span className="font-body text-[11px] text-ink-muted">{selected.date.slice(0, 4)}</span>}

      <div className="flex shrink-0 gap-1">
        <button
          type="button"
          onClick={onMoveUp}
          disabled={!canMoveUp}
          aria-label="Mover antes"
          title="Mover antes"
          className="flex h-6 w-6 items-center justify-center rounded-full bg-surface-muted text-xs disabled:opacity-30"
        >
          ←
        </button>
        <button
          type="button"
          onClick={onMoveDown}
          disabled={!canMoveDown}
          aria-label="Mover después"
          title="Mover después"
          className="flex h-6 w-6 items-center justify-center rounded-full bg-surface-muted text-xs disabled:opacity-30"
        >
          →
        </button>
        <button
          type="button"
          onClick={onRemove}
          aria-label="Quitar proyecto"
          title="Quitar proyecto"
          className="flex h-6 w-6 items-center justify-center rounded-full bg-surface-muted text-xs text-red-500"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
