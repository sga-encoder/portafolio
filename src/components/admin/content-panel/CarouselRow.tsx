import type { ProjectCardData } from "../../../lib/admin/projectCards";

interface Props {
  id: string;
  selected: ProjectCardData | undefined;
  options: ProjectCardData[];
  onChange: (id: string) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}

/**
 * Fila del carrusel (071): miniatura de solo lectura (portada real del proyecto elegido) + un
 * único `<select>` para elegir qué proyecto ocupa este lugar — sin título/slug/fecha/descripción/
 * link, esos ya viven en el Markdown de cada proyecto. `options` ya llega sin los proyectos
 * elegidos en otras filas (no se puede duplicar).
 */
export default function CarouselRow({
  id,
  selected,
  options,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
}: Props) {
  return (
    <div className="flex items-center gap-4 rounded-xl bg-surface p-3">
      {selected?.imageSrc ? (
        <img
          src={selected.imageSrc}
          alt={selected.title}
          className="h-16 w-16 shrink-0 rounded-lg object-cover"
        />
      ) : (
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-surface-muted text-xs text-ink-muted">
          Sin proyecto
        </div>
      )}

      <select
        value={id}
        onChange={(event) => onChange(event.target.value)}
        className="flex-1 rounded-lg border border-ink-muted/30 bg-transparent px-3 py-2 text-sm"
      >
        <option value="">Selecciona un proyecto…</option>
        {options.map((project) => (
          <option key={project.slug} value={project.slug}>
            {project.title}
          </option>
        ))}
      </select>

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
          aria-label="Quitar proyecto"
          title="Quitar proyecto"
          className="flex h-7 w-7 items-center justify-center rounded-full bg-surface-muted text-sm text-red-500"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
