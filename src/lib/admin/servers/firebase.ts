import { getSecret } from "../secrets";
import { getGoogleAccessToken, type GoogleServiceAccount } from "./googleAuth";
import type { FirebaseServer, ServerStatusDetail, ServerStatusResult } from "./types";

// Estado en vivo de un servidor Firebase (046) — el único de los 4 que no usa un bearer token
// simple: `adminSecrets/firebase` guarda una cuenta de servicio de Google Cloud (`clientEmail` +
// `privateKey`, pegada a mano desde la consola de Firebase igual que los demás secretos de 043).
// Ver googleAuth.ts para el riesgo de CORS sin confirmar.
const CLOUD_PLATFORM_SCOPE = "https://www.googleapis.com/auth/cloud-platform";

export async function getFirebaseStatus(server: FirebaseServer): Promise<ServerStatusResult> {
  const account = await getSecret<GoogleServiceAccount>("firebase");
  const token = await getGoogleAccessToken(account, CLOUD_PLATFORM_SCOPE);
  const checkedAt = new Date().toISOString();

  const projectResponse = await fetch(
    `https://cloudresourcemanager.googleapis.com/v1/projects/${server.projectId}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!projectResponse.ok) throw new Error(`Cloud Resource Manager respondió ${projectResponse.status}`);
  const project = (await projectResponse.json()) as Record<string, unknown>;
  const lifecycleState = project.lifecycleState as string | undefined;

  const details: ServerStatusDetail[] = [
    { label: "Nombre", value: (project.name as string) ?? server.projectId },
    { label: "Número de proyecto", value: (project.projectNumber as string) ?? "—" },
  ];

  if (server.siteId) {
    const releasesResponse = await fetch(
      `https://firebasehosting.googleapis.com/v1beta1/sites/${server.siteId}/releases?pageSize=1`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    if (releasesResponse.ok) {
      const { releases } = (await releasesResponse.json()) as { releases?: Array<Record<string, unknown>> };
      const latest = releases?.[0];
      if (latest) {
        details.push({ label: "Último release", value: new Date(latest.releaseTime as string).toLocaleString() });
        details.push({ label: "Tipo de release", value: (latest.type as string) ?? "—" });
      }
    }
  }

  return {
    state: lifecycleState === "ACTIVE" ? "up" : "down",
    summary: lifecycleState ?? "Desconocido",
    details,
    checkedAt,
  };
}
