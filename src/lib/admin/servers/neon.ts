import { callInfraProxy } from "./infraProxy";
import type { NeonServer, ServerStatusResult } from "./types";

// Estado en vivo de un servidor Neon (046) — vía el proxy server-side `/api/infra-status` (075),
// porque la API de Neon no acepta llamadas directas del navegador (sin CORS, a diferencia de
// Vercel). Ver .claude/spec/features/075-proxy-estado-render-neon/plan.md.
//
// A diferencia de Vercel/Render, "idle" en Neon es reposo normal (autosuspend de un Postgres
// serverless, no una caída) — tanto "active" como "idle" se muestran como "up", solo la ausencia
// total de endpoints o un error de red caen a "unknown"/error (ver index.ts).

export async function getNeonStatus(server: NeonServer): Promise<ServerStatusResult> {
  const checkedAt = new Date().toISOString();

  const { project } = await callInfraProxy<{ project: Record<string, unknown> }>(
    "neon-project",
    server.projectId,
  );
  const endpoints = await callInfraProxy<{ endpoints?: Array<Record<string, unknown>> }>(
    "neon-endpoints",
    server.projectId,
  )
    .then((data) => data.endpoints ?? [])
    .catch(() => []);
  const primary = endpoints[0];
  const currentState = primary?.current_state as string | undefined;
  const endpointType = primary?.type as string | undefined;
  const pgVersion = project.pg_version as number | undefined;

  const details = [
    { label: "Región", value: (project.region_id as string) ?? "—" },
    { label: "Rama por defecto", value: (project.default_branch_id as string) ?? "—" },
    {
      label: "Autosuspend",
      value: primary?.suspend_timeout_seconds != null ? `${primary.suspend_timeout_seconds}s` : "—",
    },
  ];
  if (pgVersion) details.push({ label: "Postgres", value: `v${pgVersion}` });
  if (endpointType) details.push({ label: "Endpoint", value: endpointType === "read_write" ? "Lectura-escritura" : "Solo lectura" });

  return {
    state: currentState ? "up" : "unknown",
    summary: currentState === "idle" ? "Activo (en reposo, autosuspend)" : (currentState ?? "Sin endpoints"),
    details,
    checkedAt,
    dashboardUrl: `https://console.neon.tech/app/projects/${server.projectId}`,
  };
}
