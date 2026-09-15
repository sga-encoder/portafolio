import { useEffect, useState } from "react";
import { loadContent } from "../../lib/admin/drafts";
import { parseFrontmatter } from "../../lib/admin/frontmatter";
import type { ProjectServer } from "../../lib/admin/servers";
import type { ProjectCardData } from "../../lib/admin/projectCards";
import AdminGate from "./AdminGate";
import ServerStatusCard from "./servers/ServerStatusCard";

interface ProjectMeta {
  slug: string;
  title: string;
}

interface ProjectServers {
  slug: string;
  title: string;
  servers: ProjectServer[];
}

interface Props {
  projects: ProjectMeta[];
}

interface PanelProps extends Props {
  switcherProjects: ProjectCardData[];
}

// Ver DashboardPanel.tsx: separado de ServersPanel para que el fetch a GitHub solo corra una vez
// que AdminGate confirmó sesión. El contenido se trae en vivo (mismo `loadContent` que usa el
// editor visual de 044, incluye borradores pendientes) en vez de leer del build estático, para que
// un servidor recién agregado se vea de inmediato sin esperar un rebuild (ver plan.md de 046).
function ServersContent({ projects }: Props) {
  const [entries, setEntries] = useState<ProjectServers[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all(
      projects.map(async ({ slug, title }) => {
        try {
          const loaded = await loadContent(slug);
          const { data } = parseFrontmatter(loaded.content);
          const servers = Array.isArray(data.servers) ? (data.servers as ProjectServer[]) : [];
          return { slug, title, servers };
        } catch {
          return { slug, title, servers: [] };
        }
      }),
    )
      .then((results) => {
        if (!cancelled) setEntries(results);
      })
      .catch(() => {
        if (!cancelled) setError("No se pudo cargar la lista de servidores.");
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <h1 className="mb-2 text-2xl font-display font-bold">Servidores</h1>
      <p className="mb-6 text-sm text-ink-muted">
        Estado en vivo de la infraestructura de cada proyecto. Configura los servidores de un proyecto desde
        su editor en <span className="font-medium text-ink">Contenido</span>.
      </p>

      {error && <p className="text-sm text-red-500">{error}</p>}
      {!entries && !error && <p className="text-ink-muted">Cargando…</p>}

      {entries && (
        <div className="flex flex-col gap-8">
          {entries.map((project) => (
            <section key={project.slug}>
              <h2 className="mb-3 font-display text-lg font-bold text-ink">{project.title}</h2>
              {project.servers.length === 0 ? (
                <p className="text-sm text-ink-muted">Sin servidores configurados todavía.</p>
              ) : (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {project.servers.map((server) => (
                    <ServerStatusCard key={server.id || server.name} server={server} />
                  ))}
                </div>
              )}
            </section>
          ))}
        </div>
      )}
    </>
  );
}

export default function ServersPanel({ projects, switcherProjects }: PanelProps) {
  return (
    <AdminGate active="servidores" switcherProjects={switcherProjects}>
      <ServersContent projects={projects} />
    </AdminGate>
  );
}
