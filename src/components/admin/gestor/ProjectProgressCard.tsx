import type { ProjectSummary } from "../../../lib/admin/gestor/summary";
import { etapasPathOf } from "../../../lib/admin/gestor/registry";
import ProgressBar from "./ProgressBar";

interface Props {
  summary: ProjectSummary | null;
  /** El proyecto ya tiene página pública `/proyectos/[slug]` (id = slug del content collection). */
  isPublished: boolean;
  onOpen: () => void;
  onRemove: () => void;
}

function formatCommitDate(iso: string): string {
  if (!iso) return "sin commits";
  return new Date(iso).toLocaleDateString("es", { day: "numeric", month: "short", year: "numeric" });
}

/**
 * Tarjeta del listado de `/admin/gestor` (087). Muestra el avance cuantitativo del proyecto; un
 * proyecto que falla (token sin alcance, repo inexistente) muestra su error acá sin tumbar el resto
 * del listado — ver criterio 11 de spec.md.
 */
export default function ProjectProgressCard({ summary, isPublished, onOpen, onRemove }: Props) {
  if (!summary) {
    return <div className="rounded-xl border border-ink-muted/20 bg-surface-muted/40 p-4 text-sm text-ink-muted">Cargando…</div>;
  }

  const { project, progress, exists, isDraft, lastCommit, error } = summary;

  return (
    <div className="rounded-xl border border-ink-muted/20 bg-surface-muted/40 p-4">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-display text-lg font-bold">{project.title}</h2>
            {isDraft && <span className="rounded-full bg-brand/20 px-2 py-0.5 text-xs text-brand">Borrador sin publicar</span>}
            {!isPublished && (
              <span className="rounded-full bg-ink-muted/15 px-2 py-0.5 text-xs text-ink-muted">Sin página pública</span>
            )}
          </div>
          <a
            href={`https://github.com/${project.repo}`}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-ink-muted hover:text-brand hover:underline"
          >
            {project.repo}
          </a>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {isPublished && (
            <a
              href={`/admin/proyectos/${project.id}`}
              className="rounded-lg bg-surface-muted px-3 py-1.5 text-xs font-medium hover:text-brand"
            >
              Editar página
            </a>
          )}
          <button type="button" onClick={onOpen} className="rounded-lg bg-brand px-3 py-1.5 text-xs font-medium text-white">
            Ver etapas
          </button>
        </div>
      </div>

      {error ? (
        <p className="rounded-lg bg-red-500/10 p-3 text-sm text-red-500">{error}</p>
      ) : !exists && !progress ? (
        <p className="text-sm text-ink-muted">
          Todavía no existe <code className="text-xs">{etapasPathOf(project)}</code> en el repo — abrí el proyecto para
          crearlo.
        </p>
      ) : progress && progress.total > 0 ? (
        <>
          <div className="mb-2 flex items-baseline justify-between gap-3">
            <span className="font-display text-2xl font-bold text-brand">{progress.percent}%</span>
            <span className="text-xs text-ink-muted">
              {progress.done}/{progress.total} sub-etapas · {progress.etapasCompletas}/{progress.etapasConSubEtapas} etapas
              completas
            </span>
          </div>
          <ProgressBar percent={progress.percent} />
        </>
      ) : (
        <p className="text-sm text-ink-muted">El archivo de etapas todavía no tiene sub-etapas para medir.</p>
      )}

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-ink-muted">
        <span>
          Último commit: {lastCommit ? `${formatCommitDate(lastCommit.date)} · ${lastCommit.subject}` : "—"}
        </span>
        <button type="button" onClick={onRemove} className="hover:text-red-500 hover:underline">
          Quitar del gestor
        </button>
      </div>
    </div>
  );
}
