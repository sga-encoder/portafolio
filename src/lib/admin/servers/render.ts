import { callInfraProxy } from "./infraProxy";
import type { RenderServer, ServerState, ServerStatusResult } from "./types";

// Estado en vivo de un servidor Render (046) — vía el proxy server-side `/api/infra-status` (075),
// porque la API de Render no acepta llamadas directas del navegador (sin CORS, a diferencia de
// Vercel). Ver .claude/spec/features/075-proxy-estado-render-neon/plan.md.

function mapDeployStatus(suspended: boolean, deployStatus: string | undefined): ServerState {
  if (suspended) return "down";
  if (deployStatus === "live") return "up";
  if (deployStatus === "build_failed" || deployStatus === "update_failed" || deployStatus === "deactivated") {
    return "down";
  }
  if (!deployStatus) return "unknown";
  return "degraded";
}

// Cada tipo de servicio de Render vive bajo un segmento de URL distinto en su dashboard — sin
// este mapeo el link cae en una página 404 en vez de abrir el servicio real.
const DASHBOARD_SEGMENT: Record<string, string> = {
  web_service: "web",
  static_site: "static",
  background_worker: "worker",
  private_service: "pserv",
  cron_job: "cron",
};

export async function getRenderStatus(server: RenderServer): Promise<ServerStatusResult> {
  const checkedAt = new Date().toISOString();

  const service = await callInfraProxy<Record<string, unknown>>("render-service", server.serviceId);
  const deploys = await callInfraProxy<Array<{ deploy?: Record<string, unknown> }>>(
    "render-deploys",
    server.serviceId,
  ).catch(() => []);
  const latestDeploy = deploys[0]?.deploy;

  const suspended = service.suspended === "suspended";
  const deployStatus = latestDeploy?.status as string | undefined;
  const serviceDetails = service.serviceDetails as Record<string, unknown> | undefined;
  const commit = latestDeploy?.commit as { id?: string; message?: string } | undefined;
  const branch = service.branch as string | undefined;
  const serviceType = service.type as string | undefined;

  const details = [
    { label: "URL", value: (serviceDetails?.url as string) ?? server.url ?? "—" },
    { label: "Región", value: (serviceDetails?.region as string) ?? "—" },
    { label: "Plan", value: (serviceDetails?.plan as string) ?? "—" },
  ];
  if (branch) details.push({ label: "Branch", value: branch });
  if (commit?.id) {
    details.push({
      label: "Commit",
      value: commit.message ? `${commit.id.slice(0, 7)} — ${commit.message}` : commit.id.slice(0, 7),
    });
  }

  return {
    state: mapDeployStatus(suspended, deployStatus),
    summary: suspended ? "Suspendido" : (deployStatus ?? "Sin despliegues"),
    details,
    checkedAt,
    dashboardUrl: `https://dashboard.render.com/${DASHBOARD_SEGMENT[serviceType ?? ""] ?? "web"}/${server.serviceId}`,
  };
}
