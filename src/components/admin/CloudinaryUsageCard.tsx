import { useEffect, useState } from "react";
import { getUsage, type CloudinaryUsage } from "../../lib/admin/cloudinaryAccount";

const GB = 1024 ** 3;

type Status = "loading" | "idle" | "error";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB", "TB"];
  let value = bytes / 1024;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value.toFixed(1)} ${units[unitIndex]}`;
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-surface-muted p-4">
      <p className="text-xs text-ink-muted">{label}</p>
      <p className="text-xl font-display font-semibold">{value}</p>
    </div>
  );
}

export default function CloudinaryUsageCard() {
  const [usage, setUsage] = useState<CloudinaryUsage | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState<string | null>(null);

  function load() {
    setStatus("loading");
    getUsage()
      .then((data) => {
        setUsage(data);
        setStatus("idle");
      })
      .catch((err: unknown) => {
        setStatus("error");
        setError(err instanceof Error ? err.message : "No se pudieron leer las estadísticas de Cloudinary.");
      });
  }

  useEffect(load, []);

  return (
    <>
      <div className="mb-6 flex items-center gap-3">
        <button
          type="button"
          onClick={load}
          disabled={status === "loading"}
          className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {status === "loading" ? "Actualizando…" : "Actualizar"}
        </button>
        {usage && (
          <span className="text-sm text-ink-muted">
            Última actualización de Cloudinary: {new Intl.DateTimeFormat("es", { dateStyle: "medium" }).format(new Date(usage.last_updated))}
          </span>
        )}
      </div>

      {status === "error" && <p className="text-red-400">{error}</p>}

      {usage && (() => {
        const remainingCredits = usage.credits ? usage.credits.limit - usage.credits.usage : null;
        return (
          <>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <StatCard label="Plan" value={usage.plan} />
              {usage.credits && (
                <StatCard label="Créditos" value={`${usage.credits.usage.toFixed(1)} / ${usage.credits.limit}`} />
              )}
              <StatCard label="Almacenamiento" value={formatBytes(usage.storage.usage)} />
              {remainingCredits !== null && (
                <StatCard
                  label="Espacio disponible (estimado)"
                  value={formatBytes(Math.max(0, remainingCredits) * GB)}
                />
              )}
              {usage.bandwidth && <StatCard label="Ancho de banda (mes)" value={formatBytes(usage.bandwidth.usage)} />}
              <StatCard label="Recursos" value={String(usage.resources)} />
              <StatCard label="Recursos derivados" value={String(usage.derived_resources)} />
              {usage.transformations && (
                <StatCard label="Transformaciones (mes)" value={String(usage.transformations.usage)} />
              )}
            </div>
            {remainingCredits !== null && (
              <p className="mt-3 text-xs text-ink-muted">
                Estimado a partir de los créditos restantes del plan (1 crédito ≈ 1 GB) — se comparten con ancho de
                banda y transformaciones, no es un límite exclusivo de almacenamiento.
              </p>
            )}
          </>
        );
      })()}
    </>
  );
}
