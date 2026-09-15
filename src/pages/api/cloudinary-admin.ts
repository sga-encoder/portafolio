export const prerender = false;

import type { APIRoute } from "astro";
import { getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

// Único endpoint server-side del sitio (feature 045) — la Admin API de
// Cloudinary (folders/resources/usage, a diferencia de /image/upload y
// /image/destroy que ya usa 043) no responde Access-Control-Allow-Origin,
// así que no se puede llamar desde el navegador. Este endpoint hace de
// proxy, gateado por el mismo admin autenticado que usa el resto de
// /admin. Ver .claude/spec/features/045-imagenes-multiproyecto-estadisticas/plan.md.

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

function cloudinaryAuthHeader(): string {
  const apiKey = import.meta.env.CLOUDINARY_API_KEY;
  const apiSecret = import.meta.env.CLOUDINARY_API_SECRET;
  return `Basic ${Buffer.from(`${apiKey}:${apiSecret}`).toString("base64")}`;
}

function forbidden(): Response {
  return new Response(JSON.stringify({ error: "forbidden" }), {
    status: 403,
    headers: { "Content-Type": "application/json" },
  });
}

export const POST: APIRoute = async ({ request }) => {
  if (!(await requireAdmin(request))) return forbidden();

  let body: { action?: string; prefix?: string; next_cursor?: string };
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "invalid body" }), { status: 400 });
  }

  const cloudName = import.meta.env.CLOUDINARY_CLOUD_NAME;
  const base = `https://api.cloudinary.com/v1_1/${cloudName}`;

  let path: string;
  if (body.action === "usage") {
    path = "usage";
  } else if (body.action === "folders") {
    path = "folders";
  } else if (body.action === "resources") {
    const params = new URLSearchParams({
      type: "upload",
      max_results: "500",
      prefix: body.prefix ?? "",
    });
    if (body.next_cursor) params.set("next_cursor", body.next_cursor);
    path = `resources/image?${params.toString()}`;
  } else {
    return new Response(JSON.stringify({ error: "unknown action" }), { status: 400 });
  }

  const response = await fetch(`${base}/${path}`, {
    headers: { Authorization: cloudinaryAuthHeader() },
  });
  const data = await response.text();
  return new Response(data, {
    status: response.status,
    headers: { "Content-Type": "application/json" },
  });
};
