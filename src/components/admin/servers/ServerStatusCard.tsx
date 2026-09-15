import { useEffect, useState } from "react";
import { getServerStatus, type ProjectServer, type ServerStatusResult } from "../../../lib/admin/servers";

interface Props {
  server: ProjectServer;
}

const STATE_STYLES: Record<ServerStatusResult["state"], { label: string; dot: string; text: string }> = {
  up: { label: "Activo", dot: "bg-emerald-500", text: "text-emerald-500" },
  degraded: { label: "Degradado", dot: "bg-amber-500", text: "text-amber-500" },
  down: { label: "Caído", dot: "bg-red-500", text: "text-red-500" },
  unknown: { label: "Desconocido", dot: "bg-ink-muted", text: "text-ink-muted" },
};

const COMPANY_LABELS: Record<ProjectServer["company"], string> = {
  vercel: "Vercel",
  render: "Render",
  neon: "Neon",
  firebase: "Firebase",
  generic: "Genérico",
};

const KIND_LABELS: Record<ProjectServer["kind"], string> = {
  web: "Web",
  database: "Base de datos",
  other: "Otro",
};

/** Tarjeta de estado de un servidor (046) — consulta la API real de su empresa al montar, con
 * botón "Actualizar" para repetir la llamada. `getServerStatus` nunca lanza (ver
 * src/lib/admin/servers/index.ts), así que un servidor roto no rompe el resto del panel. */
export default function ServerStatusCard({ server }: Props) {
  const [status, setStatus] = useState<ServerStatusResult | null>(null);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    setLoading(true);
    const result = await getServerStatus(server);
    setStatus(result);
    setLoading(false);
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [server.id]);

  const stateStyle = status ? STATE_STYLES[status.state] : null;

  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-surface-muted p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-display text-sm font-bold text-ink">{server.name || server.id}</p>
          <p className="text-xs text-ink-muted">
            {KIND_LABELS[server.kind]} · {COMPANY_LABELS[server.company]}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {stateStyle && (
            <span className={`flex items-center gap-1.5 text-xs font-medium ${stateStyle.text}`}>
              <span className={`h-2 w-2 rounded-full ${stateStyle.dot}`} />
              {stateStyle.label}
            </span>
          )}
          <button
            type="button"
            onClick={refresh}
            disabled={loading}
            className="rounded-full bg-surface px-3 py-1 text-xs font-medium text-ink-muted hover:text-ink disabled:opacity-50"
          >
            {loading ? "Consultando…" : "Actualizar"}
          </button>
        </div>
      </div>

      {loading && !status && <p className="text-xs text-ink-muted">Consultando…</p>}

      {status && (
        <>
          <p className="text-sm text-ink">{status.summary}</p>
          {status.error && <p className="text-xs text-red-500">{status.error}</p>}
          {status.details.length > 0 && (
            <dl className="grid grid-cols-1 gap-x-4 gap-y-1 text-xs sm:grid-cols-2">
              {status.details.map((detail) => (
                <div key={detail.label} className="flex items-center justify-between gap-2 sm:justify-start">
                  <dt className="text-ink-muted">{detail.label}</dt>
                  <dd className="truncate text-ink">{detail.value}</dd>
                </div>
              ))}
            </dl>
          )}
          {server.url && (
            <a href={server.url} target="_blank" rel="noreferrer" className="text-xs text-brand underline">
              Abrir enlace ↗
            </a>
          )}
        </>
      )}
    </div>
  );
}
