import { getSecret } from "../secrets";
import type { RenderServer, ServerState, ServerStatusResult } from "./types";

// Estado en vivo de un servidor Render (046). Ver vercel.ts para el mecanismo (idéntico) y
// .claude/spec/features/046-panel-servidores/plan.md.
interface RenderSecret {
  token: string;
}

function mapDeployStatus(suspended: boolean, deployStatus: string | undefined): ServerState {
  if (suspended) return "down";
  if (deployStatus === "live") return "up";
  if (deployStatus === "build_failed" || deployStatus === "update_failed" || deployStatus === "deactivated") {
    return "down";
  }
  if (!deployStatus) return "unknown";
  return "degraded";
}

export async function getRenderStatus(server: RenderServer): Promise<ServerStatusResult> {
  const { token } = await getSecret<RenderSecret>("render");
  const headers = { Authorization: `Bearer ${token}`, Accept: "application/json" };
  const checkedAt = new Date().toISOString();

  const serviceResponse = await fetch(`https://api.render.com/v1/services/${server.serviceId}`, { headers });
  if (!serviceResponse.ok) throw new Error(`Render API respondió ${serviceResponse.status}`);
  const service = (await serviceResponse.json()) as Record<string, unknown>;

  const deploysResponse = await fetch(
    `https://api.render.com/v1/services/${server.serviceId}/deploys?limit=1`,
    { headers },
  );
  const deploys = deploysResponse.ok ? ((await deploysResponse.json()) as Array<{ deploy?: Record<string, unknown> }>) : [];
  const latestDeploy = deploys[0]?.deploy;

  const suspended = service.suspended === "suspended";
  const deployStatus = latestDeploy?.status as string | undefined;
  const details = service.serviceDetails as Record<string, unknown> | undefined;

  return {
    state: mapDeployStatus(suspended, deployStatus),
    summary: suspended ? "Suspendido" : (deployStatus ?? "Sin despliegues"),
    details: [
      { label: "URL", value: (details?.url as string) ?? server.url ?? "—" },
      { label: "Región", value: (details?.region as string) ?? "—" },
      { label: "Plan", value: (details?.plan as string) ?? "—" },
    ],
    checkedAt,
  };
}
