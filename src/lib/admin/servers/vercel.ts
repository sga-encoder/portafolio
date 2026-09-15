import { getSecret } from "../secrets";
import type { VercelServer, ServerState, ServerStatusResult } from "./types";

// Estado en vivo de un servidor Vercel (046) — mismo mecanismo que github.ts/cloudinary.ts (043):
// llamada directa desde el navegador ya autenticado como admin, token pegado a mano en Firestore
// (`adminSecrets/vercel`). Ver .claude/spec/features/046-panel-servidores/plan.md.
interface VercelSecret {
  token: string;
  teamId?: string;
}

function mapState(state: string | undefined): ServerState {
  if (state === "READY") return "up";
  if (state === "ERROR" || state === "CANCELED") return "down";
  if (!state) return "unknown";
  return "degraded";
}

export async function getVercelStatus(server: VercelServer): Promise<ServerStatusResult> {
  const secret = await getSecret<VercelSecret>("vercel");
  const teamId = server.teamId ?? secret.teamId;
  const query = new URLSearchParams({ projectId: server.projectId, limit: "1" });
  if (teamId) query.set("teamId", teamId);

  const response = await fetch(`https://api.vercel.com/v6/deployments?${query.toString()}`, {
    headers: { Authorization: `Bearer ${secret.token}` },
  });
  if (!response.ok) throw new Error(`Vercel API respondió ${response.status}`);

  const payload = (await response.json()) as { deployments?: Array<Record<string, unknown>> };
  const deployment = payload.deployments?.[0];
  const checkedAt = new Date().toISOString();

  if (!deployment) {
    return { state: "unknown", summary: "Sin despliegues todavía", details: [], checkedAt };
  }

  const state = deployment.state as string | undefined;
  const url = deployment.url as string | undefined;
  const created = (deployment.createdAt ?? deployment.created) as number | undefined;

  return {
    state: mapState(state),
    summary: state ?? "Desconocido",
    details: [
      { label: "URL", value: url ? `https://${url}` : "—" },
      { label: "Entorno", value: (deployment.target as string) ?? "preview" },
      { label: "Creado", value: created ? new Date(created).toLocaleString() : "—" },
    ],
    checkedAt,
  };
}
