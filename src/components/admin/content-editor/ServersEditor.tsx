import type { ProjectServer, ServerCompany, ServerKind } from "../../../lib/admin/servers";

interface Props {
  value: ProjectServer[];
  onChange: (next: ProjectServer[]) => void;
}

const KIND_OPTIONS: { value: ServerKind; label: string }[] = [
  { value: "web", label: "Web" },
  { value: "database", label: "Base de datos" },
  { value: "other", label: "Otro" },
];

const COMPANY_OPTIONS: { value: ServerCompany; label: string }[] = [
  { value: "vercel", label: "Vercel" },
  { value: "render", label: "Render" },
  { value: "neon", label: "Neon" },
  { value: "firebase", label: "Firebase" },
  { value: "generic", label: "Genérico (sin integración)" },
];

function withCompany(server: ProjectServer, company: ServerCompany): ProjectServer {
  const { id, name, kind, url } = server;
  const common = { id, name, kind, url };
  switch (company) {
    case "vercel":
      return { ...common, company, projectId: "" };
    case "render":
      return { ...common, company, serviceId: "" };
    case "neon":
      return { ...common, company, projectId: "" };
    case "firebase":
      return { ...common, company, projectId: "" };
    case "generic":
      return { ...common, company };
  }
}

/** Editor de `servers[]` — agregar/quitar servidores por proyecto, con campos condicionales según
 * la empresa elegida (046, misma decisión que exige `content.config.ts` en build-time vía Zod). */
export default function ServersEditor({ value, onChange }: Props) {
  function update(index: number, next: ProjectServer) {
    onChange(value.map((server, i) => (i === index ? next : server)));
  }

  function addServer() {
    onChange([...value, { id: "", name: "", kind: "web", company: "generic" }]);
  }

  return (
    <div className="flex flex-col gap-4 rounded-2xl bg-surface-muted p-4">
      <h2 className="font-display text-sm font-bold uppercase tracking-wide text-ink-muted">Servidores</h2>
      <p className="text-xs text-ink-muted">
        Infraestructura del proyecto (web, bases de datos, etc.) que el panel /admin/servidores consulta en
        vivo. Elige la empresa que aloja cada servidor para pedir justo los datos que su API necesita.
      </p>

      <div className="flex flex-col gap-3">
        {value.map((server, index) => (
          <div key={index} className="flex flex-col gap-3 rounded-xl bg-surface p-3">
            <div className="flex items-start gap-3">
              <div className="grid flex-1 grid-cols-1 gap-2 sm:grid-cols-2">
                <label className="flex flex-col gap-1 text-xs text-ink-muted">
                  Nombre
                  <input
                    type="text"
                    value={server.name}
                    onChange={(event) => update(index, { ...server, name: event.target.value })}
                    placeholder="ej. Web principal"
                    className="rounded-lg border border-ink-muted/30 bg-transparent px-2 py-1 text-sm text-ink"
                  />
                </label>
                <label className="flex flex-col gap-1 text-xs text-ink-muted">
                  Id
                  <input
                    type="text"
                    value={server.id}
                    onChange={(event) => update(index, { ...server, id: event.target.value })}
                    placeholder="ej. web"
                    className="rounded-lg border border-ink-muted/30 bg-transparent px-2 py-1 text-sm text-ink"
                  />
                </label>
                <label className="flex flex-col gap-1 text-xs text-ink-muted">
                  Tipo
                  <select
                    value={server.kind}
                    onChange={(event) => update(index, { ...server, kind: event.target.value as ServerKind })}
                    className="rounded-lg border border-ink-muted/30 bg-transparent px-2 py-1 text-sm text-ink"
                  >
                    {KIND_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1 text-xs text-ink-muted">
                  Empresa
                  <select
                    value={server.company}
                    onChange={(event) => update(index, withCompany(server, event.target.value as ServerCompany))}
                    className="rounded-lg border border-ink-muted/30 bg-transparent px-2 py-1 text-sm text-ink"
                  >
                    {COMPANY_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <button
                type="button"
                onClick={() => onChange(value.filter((_, i) => i !== index))}
                aria-label="Quitar servidor"
                className="text-ink-muted hover:text-ink"
              >
                ✕
              </button>
            </div>

            <label className="flex flex-col gap-1 text-xs text-ink-muted">
              URL (opcional)
              <input
                type="text"
                value={server.url ?? ""}
                onChange={(event) => update(index, { ...server, url: event.target.value || undefined })}
                placeholder="https://…"
                className="rounded-lg border border-ink-muted/30 bg-transparent px-2 py-1 text-sm text-ink"
              />
            </label>

            {server.company === "vercel" && (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <label className="flex flex-col gap-1 text-xs text-ink-muted">
                  Project ID
                  <input
                    type="text"
                    value={server.projectId}
                    onChange={(event) => update(index, { ...server, projectId: event.target.value })}
                    className="rounded-lg border border-ink-muted/30 bg-transparent px-2 py-1 text-sm text-ink"
                  />
                </label>
                <label className="flex flex-col gap-1 text-xs text-ink-muted">
                  Team ID (opcional)
                  <input
                    type="text"
                    value={server.teamId ?? ""}
                    onChange={(event) => update(index, { ...server, teamId: event.target.value || undefined })}
                    className="rounded-lg border border-ink-muted/30 bg-transparent px-2 py-1 text-sm text-ink"
                  />
                </label>
              </div>
            )}

            {server.company === "render" && (
              <label className="flex flex-col gap-1 text-xs text-ink-muted">
                Service ID
                <input
                  type="text"
                  value={server.serviceId}
                  onChange={(event) => update(index, { ...server, serviceId: event.target.value })}
                  className="rounded-lg border border-ink-muted/30 bg-transparent px-2 py-1 text-sm text-ink"
                />
              </label>
            )}

            {server.company === "neon" && (
              <label className="flex flex-col gap-1 text-xs text-ink-muted">
                Project ID
                <input
                  type="text"
                  value={server.projectId}
                  onChange={(event) => update(index, { ...server, projectId: event.target.value })}
                  className="rounded-lg border border-ink-muted/30 bg-transparent px-2 py-1 text-sm text-ink"
                />
              </label>
            )}

            {server.company === "firebase" && (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <label className="flex flex-col gap-1 text-xs text-ink-muted">
                  Project ID
                  <input
                    type="text"
                    value={server.projectId}
                    onChange={(event) => update(index, { ...server, projectId: event.target.value })}
                    className="rounded-lg border border-ink-muted/30 bg-transparent px-2 py-1 text-sm text-ink"
                  />
                </label>
                <label className="flex flex-col gap-1 text-xs text-ink-muted">
                  Site ID (opcional, Hosting)
                  <input
                    type="text"
                    value={server.siteId ?? ""}
                    onChange={(event) => update(index, { ...server, siteId: event.target.value || undefined })}
                    className="rounded-lg border border-ink-muted/30 bg-transparent px-2 py-1 text-sm text-ink"
                  />
                </label>
              </div>
            )}

            {server.company === "generic" && (
              <p className="text-xs text-ink-muted">
                Sin integración automática todavía — el panel solo mostrará el nombre/URL de arriba.
              </p>
            )}
          </div>
        ))}

        <button
          type="button"
          onClick={addServer}
          className="flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-ink-muted/30 py-3 text-sm text-ink-muted hover:border-ink-muted hover:text-ink"
        >
          + Agregar servidor
        </button>
      </div>
    </div>
  );
}
