import type { GenericServer, ServerStatusResult } from "./types";

// Placeholder sin llamada de red — para empresas que todavía no están soportadas o servidores que
// el autor solo quiere anotar sin conectar a nada (046, ver spec.md "si no se tiene la empresa se
// pone en uno genérico").
export function getGenericStatus(server: GenericServer): ServerStatusResult {
  return {
    state: "unknown",
    summary: "Sin integración automática",
    details: server.url ? [{ label: "URL", value: server.url }] : [],
    checkedAt: new Date().toISOString(),
  };
}
