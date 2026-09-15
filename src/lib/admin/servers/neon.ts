import { getSecret } from "../secrets";
import type { NeonServer, ServerStatusResult } from "./types";

// Estado en vivo de un servidor Neon (046). Ver vercel.ts para el mecanismo (idéntico) y
// .claude/spec/features/046-panel-servidores/plan.md.
//
// A diferencia de Vercel/Render, "idle" en Neon es reposo normal (autosuspend de un Postgres
// serverless, no una caída) — tanto "active" como "idle" se muestran como "up", solo la ausencia
// total de endpoints o un error de red caen a "unknown"/error (ver index.ts).
interface NeonSecret {
  token: string;
}

export async function getNeonStatus(server: NeonServer): Promise<ServerStatusResult> {
  const { token } = await getSecret<NeonSecret>("neon");
  const headers = { Authorization: `Bearer ${token}`, Accept: "application/json" };
  const checkedAt = new Date().toISOString();

  const projectResponse = await fetch(`https://console.neon.tech/api/v2/projects/${server.projectId}`, { headers });
  if (!projectResponse.ok) throw new Error(`Neon API respondió ${projectResponse.status}`);
  const { project } = (await projectResponse.json()) as { project: Record<string, unknown> };

  const endpointsResponse = await fetch(
    `https://console.neon.tech/api/v2/projects/${server.projectId}/endpoints`,
    { headers },
  );
  const endpoints = endpointsResponse.ok
    ? ((await endpointsResponse.json()) as { endpoints?: Array<Record<string, unknown>> }).endpoints ?? []
    : [];
  const primary = endpoints[0];
  const currentState = primary?.current_state as string | undefined;

  return {
    state: currentState ? "up" : "unknown",
    summary: currentState === "idle" ? "Activo (en reposo, autosuspend)" : (currentState ?? "Sin endpoints"),
    details: [
      { label: "Región", value: (project.region_id as string) ?? "—" },
      { label: "Rama por defecto", value: (project.default_branch_id as string) ?? "—" },
      {
        label: "Autosuspend",
        value: primary?.suspend_timeout_seconds != null ? `${primary.suspend_timeout_seconds}s` : "—",
      },
    ],
    checkedAt,
  };
}
