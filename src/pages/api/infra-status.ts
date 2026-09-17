export const prerender = false;

import type { APIRoute } from "astro";
import { getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

// Proxy server-side de solo lectura para Render/Neon (feature 075) — sus APIs no devuelven
// Access-Control-Allow-Origin (confirmado con curl), así que no se pueden llamar directo desde el
// navegador como sí funciona con Vercel (046/074). Mismo patrón exacto que /api/cloudinary-admin
// (045): firebase-admin inicializado solo con projectId (alcanza para verifyIdToken, no hace falta
// cuenta de servicio), gateado por el mismo ADMIN_UID. Ver
// .claude/spec/features/075-proxy-estado-render-neon/plan.md.

if (!getApps().length) {
  initializeApp({ projectId: import.meta.env.PUBLIC_FIREBASE_PROJECT_ID });
}

async function requireAdmin(request: Request): Promise<boolean> {
  const header = request.headers.get("authorization") ?? "";
  const token = header.replace(/^Bearer\s+/i, "");
  if (!token) return false;
  try {
    const decoded = await getAuth().verifyIdToken(token);
    return decoded.uid === import.meta.env.ADMIN_UID;
  } catch {
    return false;
  }
}

function forbidden(): Response {
  return new Response(JSON.stringify({ error: "forbidden" }), {
    status: 403,
    headers: { "Content-Type": "application/json" },
  });
}

function badRequest(message: string): Response {
  return new Response(JSON.stringify({ error: message }), {
    status: 400,
    headers: { "Content-Type": "application/json" },
  });
}

// Whitelist fija de acciones — nunca un proxy de path abierto, para no exponer un SSRF.
const ACTIONS: Record<string, { url: (id: string) => string; envVar: "RENDER_API_TOKEN" | "NEON_API_TOKEN" }> = {
  "render-service": { url: (id) => `https://api.render.com/v1/services/${id}`, envVar: "RENDER_API_TOKEN" },
  "render-deploys": { url: (id) => `https://api.render.com/v1/services/${id}/deploys?limit=1`, envVar: "RENDER_API_TOKEN" },
  "neon-project": { url: (id) => `https://console.neon.tech/api/v2/projects/${id}`, envVar: "NEON_API_TOKEN" },
  "neon-endpoints": { url: (id) => `https://console.neon.tech/api/v2/projects/${id}/endpoints`, envVar: "NEON_API_TOKEN" },
};

export const POST: APIRoute = async ({ request }) => {
  if (!(await requireAdmin(request))) return forbidden();

  let body: { action?: string; id?: string };
  try {
    body = await request.json();
  } catch {
    return badRequest("invalid body");
  }

  const action = body.action ? ACTIONS[body.action] : undefined;
  if (!action || !body.id) return badRequest("unknown action");

  const token = import.meta.env[action.envVar];
  if (!token) return badRequest(`Falta ${action.envVar} en el servidor`);

  const response = await fetch(action.url(body.id), {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
  });
  const data = await response.text();
  return new Response(data, {
    status: response.status,
    headers: { "Content-Type": "application/json" },
  });
};
