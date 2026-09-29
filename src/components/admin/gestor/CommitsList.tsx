import type { LinkedCommits } from "../../../lib/admin/gestor/commits";

interface Props {
  linked: LinkedCommits;
  targets: { id: string; label: string }[];
  onAssign: (sha: string, target: string) => void;
  onClear: (sha: string) => void;
  loading: boolean;
  error: string | null;
}

function formatDate(iso: string): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("es", { day: "numeric", month: "short" });
}

/**
 * Últimos commits del repo del proyecto con su vínculo resuelto (087): automático por marcador
 * `[N.M]` en el mensaje, o manual desde el `<select>`. El manual gana sobre el marcador — existe
 * justamente para corregir un marcador mal puesto.
 */
export default function CommitsList({ linked, targets, onAssign, onClear, loading, error }: Props) {
  if (loading) return <p className="text-sm text-ink-muted">Cargando commits…</p>;
  if (error) return <p className="rounded-lg bg-red-500/10 p-3 text-sm text-red-500">{error}</p>;
  if (linked.commits.length === 0) return <p className="text-sm text-ink-muted">El repositorio todavía no tiene commits.</p>;

  return (
    <ul className="space-y-1">
      {linked.commits.map((commit) => (
        <li
          key={commit.sha}
          className="flex flex-wrap items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-surface-muted/60"
        >
          <span className="shrink-0 text-xs text-ink-muted">{formatDate(commit.date)}</span>
          <a
            href={commit.url}
            target="_blank"
            rel="noreferrer"
            className="shrink-0 font-mono text-xs text-ink-muted hover:text-brand"
          >
            {commit.shortSha}
          </a>
          <span className="min-w-0 flex-1 truncate text-sm" title={commit.subject}>
            {commit.subject}
          </span>

          {commit.orphan && (
            <span
              className="shrink-0 rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] text-amber-500"
              title="El mensaje apunta a una etapa que no existe en el archivo"
            >
              huérfano [{commit.target}]
            </span>
          )}

          {commit.target && !commit.orphan && (
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] ${
                commit.source === "manual" ? "bg-brand/20 text-brand" : "bg-surface text-ink-muted"
              }`}
              title={commit.source === "manual" ? "Vinculado a mano" : "Vinculado por el marcador del mensaje"}
            >
              {commit.target} {commit.source === "manual" ? "· manual" : ""}
            </span>
          )}

          <select
            value={commit.source === "manual" ? (commit.target ?? "") : ""}
            onChange={(event) => (event.target.value ? onAssign(commit.sha, event.target.value) : onClear(commit.sha))}
            aria-label={`Vincular el commit ${commit.shortSha} a una etapa`}
            className="shrink-0 rounded-lg border border-ink-muted/30 bg-surface px-2 py-1 text-xs"
          >
            <option value="">{commit.target && !commit.orphan ? "— auto —" : "Sin vincular"}</option>
            {targets.map((target) => (
              <option key={target.id} value={target.id}>
                {target.label}
              </option>
            ))}
          </select>
        </li>
      ))}
    </ul>
  );
}
