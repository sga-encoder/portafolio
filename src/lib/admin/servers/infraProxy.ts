import { auth } from "../../firebase";

// Cliente del proxy server-side `/api/infra-status` (feature 075) — Render/Neon no aceptan
// llamadas directas del navegador (sin Access-Control-Allow-Origin, a diferencia de Vercel), así
// que estas lecturas pasan por el endpoint propio en vez de llamar a esas APIs directo. Ver
// .claude/spec/features/075-proxy-estado-render-neon/plan.md.

export async function callInfraProxy<T>(action: string, id: string): Promise<T> {
  const token = await auth.currentUser?.getIdToken();
  if (!token) throw new Error("Sin sesión admin activa.");

  const response = await fetch("/api/infra-status", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ action, id }),
  });
  if (!response.ok) {
    throw new Error(`Proxy respondió ${response.status} para "${action}"`);
  }
  return response.json() as Promise<T>;
}
