// Chequeo real de "¿está despierto?" para un servidor Render en plan free (080) — la API de Render
// no expone si la instancia está dormida por inactividad (solo estado de deploy, ver render.ts),
// así que la única forma real es pegarle directo a la URL pública y medir cuánto tarda. `no-cors`
// evita el bloqueo de CORS porque no necesitamos leer el body/status, solo si la conexión se
// completó. Nunca se llama automático — solo por gesto explícito (botón), ver
// .claude/spec/features/080-despertar-backend-render/plan.md.

export interface PingResult {
  ok: boolean;
  elapsedMs: number;
}

export async function pingUrl(url: string, timeoutMs = 60000): Promise<PingResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const start = performance.now();
  try {
    await fetch(url, { mode: "no-cors", cache: "no-store", signal: controller.signal });
    return { ok: true, elapsedMs: performance.now() - start };
  } catch {
    return { ok: false, elapsedMs: performance.now() - start };
  } finally {
    clearTimeout(timeout);
  }
}
