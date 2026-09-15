// Tipos compartidos del panel /admin/servidores (046) — espejo en TS de la unión discriminada de
// `src/content.config.ts` (Zod es la fuente de verdad en build-time; estos tipos son para el editor
// visual y los clientes de cada empresa, que no importan `astro:content` en el navegador).

export type ServerKind = "web" | "database" | "other";
export type ServerCompany = "vercel" | "render" | "neon" | "firebase" | "generic";

interface ServerCommon {
  id: string;
  name: string;
  kind: ServerKind;
  url?: string;
}

export interface VercelServer extends ServerCommon {
  company: "vercel";
  projectId: string;
  teamId?: string;
}

export interface RenderServer extends ServerCommon {
  company: "render";
  serviceId: string;
}

export interface NeonServer extends ServerCommon {
  company: "neon";
  projectId: string;
}

export interface FirebaseServer extends ServerCommon {
  company: "firebase";
  projectId: string;
  siteId?: string;
}

export interface GenericServer extends ServerCommon {
  company: "generic";
}

export type ProjectServer = VercelServer | RenderServer | NeonServer | FirebaseServer | GenericServer;

export type ServerState = "up" | "degraded" | "down" | "unknown";

export interface ServerStatusDetail {
  label: string;
  value: string;
}

export interface ServerStatusResult {
  state: ServerState;
  summary: string;
  details: ServerStatusDetail[];
  checkedAt: string;
  error?: string;
}
