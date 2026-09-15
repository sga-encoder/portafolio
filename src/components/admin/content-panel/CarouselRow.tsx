import EditableImage from "../content-editor/EditableImage";
import type { ProjectItem } from "../../../data/projects";

// Mismo criterio que `slugifyLive`/`finalizeSlug` de `ContentEditor.tsx`: no recorta el guion
// final en cada tecla (para no comerse el separador justo tras un espacio), sí al perder foco.
function slugifyLive(raw: string): string {
  return raw
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+/g, "");
}

function finalizeSlug(raw: string): string {
  return slugifyLive(raw).replace(/-+$/g, "");
}

interface Props {
  project: ProjectItem;
  onChange: (next: ProjectItem) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}

/** Fila editable de un proyecto (066): imagen a la izquierda, campos a la derecha, reordenar/quitar. */
export default function CarouselRow({ project, onChange, onRemove, onMoveUp, onMoveDown, canMoveUp, canMoveDown }: Props) {
  return (
    <div className="flex items-start gap-4 rounded-xl bg-surface p-3">
      <EditableImage
        value={project.imageKey ?? ""}
        onChange={(imageKey) => onChange({ ...project, imageKey })}
        alt={project.title || "Portada del proyecto"}
        className="h-16 w-16 shrink-0"
      />

      <div className="grid flex-1 gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-ink-muted">Título</span>
          <input
            type="text"
            value={project.title}
            onChange={(event) => {
              const title = event.target.value;
              // Deriva ID/link del título mientras sigan "en sync" con el título anterior (proyecto
              // recién agregado) — apenas el admin toca ID/link directamente, dejan de seguir al
              // título letra a letra.
              const idInSync = project.id === slugifyLive(project.title);
              const id = idInSync ? slugifyLive(title) : project.id;
              const linkInSync = project.link === (project.id ? `/proyectos/${project.id}` : "");
              const link = linkInSync ? (id ? `/proyectos/${id}` : "") : project.link;
              onChange({ ...project, title, id, link });
            }}
            className="rounded-lg border border-ink-muted/30 bg-transparent px-3 py-2"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-ink-muted">ID (slug)</span>
          <input
            type="text"
            value={project.id}
            onChange={(event) => {
              const id = slugifyLive(event.target.value);
              const linkInSync = project.link === (project.id ? `/proyectos/${project.id}` : "");
              const link = linkInSync ? (id ? `/proyectos/${id}` : "") : project.link;
              onChange({ ...project, id, link });
            }}
            onBlur={(event) => onChange({ ...project, id: finalizeSlug(event.target.value) })}
            className="rounded-lg border border-ink-muted/30 bg-transparent px-3 py-2 font-mono text-xs"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-ink-muted">Fecha (AAAA-MM)</span>
          <input
            type="text"
            value={project.date}
            onChange={(event) => onChange({ ...project, date: event.target.value })}
            placeholder="2026-06"
            className="rounded-lg border border-ink-muted/30 bg-transparent px-3 py-2"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm sm:col-span-2">
          <span className="text-ink-muted">Descripción</span>
          <textarea
            value={project.description}
            onChange={(event) => onChange({ ...project, description: event.target.value })}
            rows={2}
            className="rounded-lg border border-ink-muted/30 bg-transparent px-3 py-2"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm sm:col-span-2">
          <span className="text-ink-muted">Link</span>
          <input
            type="text"
            value={project.link}
            onChange={(event) => onChange({ ...project, link: event.target.value })}
            className="rounded-lg border border-ink-muted/30 bg-transparent px-3 py-2"
          />
        </label>

        <label className="flex items-center gap-2 text-sm sm:col-span-2">
          <input
            type="checkbox"
            checked={project.featuredOnHome !== false}
            onChange={(event) => onChange({ ...project, featuredOnHome: event.target.checked })}
          />
          <span className="text-ink-muted">Mostrar en el carrusel de Inicio</span>
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
