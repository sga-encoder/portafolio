import { getSecret } from "../secrets";
import type { VercelServer } from "./types";

// Gestión de Environment Variables reales de un proyecto de Vercel (074) — mismo secreto
// (`adminSecrets/vercel`) que ya usa `vercel.ts` (046) para leer estado de deploys, pero acá con
// llamadas de escritura reales: es la primera pieza de /admin que modifica infraestructura de
// producción, no solo Markdown/Firestore. Ver .claude/spec/features/074-variables-entorno-vercel/plan.md.

interface VercelSecret {
  token: string;
  teamId?: string;
}

export type VercelEnvTarget = "production" | "preview" | "development";
export type VercelEnvType = "plain" | "sensitive" | "encrypted";

export interface VercelEnvVar {
  id: string;
  key: string;
  value?: string; // ausente si type === "sensitive" (la API de Vercel nunca lo devuelve)
  target: VercelEnvTarget[];
  type: VercelEnvType;
}

async function vercelEnvFetch(server: VercelServer, path: string, init?: RequestInit): Promise<Response> {
  const secret = await getSecret<VercelSecret>("vercel");
  const teamId = server.teamId ?? secret.teamId;
  const query = new URLSearchParams();
  if (teamId) query.set("teamId", teamId);
  const queryString = query.toString();

  return fetch(`https://api.vercel.com${path}${queryString ? `${path.includes("?") ? "&" : "?"}${queryString}` : ""}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${secret.token}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
}

export async function listEnv(server: VercelServer): Promise<VercelEnvVar[]> {
  const response = await vercelEnvFetch(server, `/v10/projects/${server.projectId}/env?decrypt=true`);
  if (!response.ok) throw new Error(`Vercel API respondió ${response.status} al listar variables`);
  const payload = (await response.json()) as { envs?: VercelEnvVar[] };
  return payload.envs ?? [];
}

export async function createEnv(
  server: VercelServer,
  input: { key: string; value: string; target: VercelEnvTarget[]; type: "plain" | "sensitive" },
): Promise<void> {
  const response = await vercelEnvFetch(server, `/v10/projects/${server.projectId}/env`, {
    method: "POST",
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Vercel API respondió ${response.status} al crear la variable — ${body}`);
  }
}

export async function updateEnv(
  server: VercelServer,
  envId: string,
  input: { value?: string; target?: VercelEnvTarget[] },
): Promise<void> {
  const response = await vercelEnvFetch(server, `/v9/projects/${server.projectId}/env/${envId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Vercel API respondió ${response.status} al editar la variable — ${body}`);
  }
}

export async function deleteEnv(server: VercelServer, envId: string): Promise<void> {
  const response = await vercelEnvFetch(server, `/v9/projects/${server.projectId}/env/${envId}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Vercel API respondió ${response.status} al borrar la variable — ${body}`);
  }
}
