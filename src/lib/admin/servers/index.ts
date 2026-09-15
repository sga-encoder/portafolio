import type { ProjectServer, ServerStatusResult } from "./types";
import { getVercelStatus } from "./vercel";
import { getRenderStatus } from "./render";
import { getNeonStatus } from "./neon";
import { getFirebaseStatus } from "./firebase";
import { getGenericStatus } from "./generic";

export type { ProjectServer, ServerCompany, ServerKind, ServerState, ServerStatusResult } from "./types";

/**
 * Punto de entrada único del panel /admin/servidores (046) — resuelve la empresa del servidor y
 * consulta su API real. Nunca lanza: falta de secreto, red caída, CORS o credenciales inválidas se
 * capturan y bajan a estado "unknown" con el error visible, para que un servidor roto no tumbe el
 * resto de la página (criterio de aceptación 4 de spec.md).
 */
export async function getServerStatus(server: ProjectServer): Promise<ServerStatusResult> {
  try {
    switch (server.company) {
      case "vercel":
        return await getVercelStatus(server);
      case "render":
        return await getRenderStatus(server);
      case "neon":
        return await getNeonStatus(server);
      case "firebase":
        return await getFirebaseStatus(server);
      case "generic":
        return getGenericStatus(server);
    }
  } catch (error) {
    return {
      state: "unknown",
      summary: "No se pudo consultar",
      details: [],
      checkedAt: new Date().toISOString(),
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}
