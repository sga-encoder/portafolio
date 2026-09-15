import { auth } from "../firebase";

// Cliente del proxy server-side `/api/cloudinary-admin` (feature 045) — la
// Admin API de Cloudinary no acepta llamadas directas del navegador (sin
// Access-Control-Allow-Origin), así que estas 3 lecturas pasan por el
// endpoint propio en vez de llamar a Cloudinary directo. Ver
// .claude/spec/features/045-imagenes-multiproyecto-estadisticas/plan.md.

async function callProxy<T>(action: string, params: Record<string, string> = {}): Promise<T> {
  const token = await auth.currentUser?.getIdToken();
  if (!token) throw new Error("Sin sesión admin activa.");

  const response = await fetch("/api/cloudinary-admin", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ action, ...params }),
  });
  if (!response.ok) {
    throw new Error(`No se pudo leer "${action}" de Cloudinary (${response.status}).`);
  }
  return response.json() as Promise<T>;
}

export interface CloudinaryFolder {
  name: string;
  path: string;
}

export async function listRootFolders(): Promise<CloudinaryFolder[]> {
  const data = await callProxy<{ folders: CloudinaryFolder[] }>("folders");
  return data.folders;
}

export interface CloudinaryResource {
  public_id: string;
  secure_url: string;
  width: number;
  height: number;
  format: string;
}

export async function listResourcesByPrefix(prefix: string): Promise<CloudinaryResource[]> {
  const all: CloudinaryResource[] = [];
  let cursor: string | undefined;
  do {
    const data = await callProxy<{ resources: CloudinaryResource[]; next_cursor?: string }>(
      "resources",
      { prefix, ...(cursor ? { next_cursor: cursor } : {}) },
    );
    all.push(...data.resources);
    cursor = data.next_cursor;
  } while (cursor);
  return all;
}

export interface CloudinaryUsage {
  plan: string;
  credits?: { usage: number; limit: number };
  storage: { usage: number };
  bandwidth?: { usage: number };
  resources: number;
  derived_resources: number;
  transformations?: { usage: number };
  last_updated: string;
}

export async function getUsage(): Promise<CloudinaryUsage> {
  return callProxy<CloudinaryUsage>("usage");
}
