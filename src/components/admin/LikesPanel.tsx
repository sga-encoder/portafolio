import { useEffect, useState } from "react";
import { collection, doc, getDocs, orderBy, query, type Timestamp } from "firebase/firestore";
import { db } from "../../lib/firebase";
import AdminGate from "./AdminGate";
import type { ProjectCardData } from "../../lib/admin/projectCards";
import { getProjectStats, type ProjectStats } from "../../lib/admin/projectStats";

interface Submission {
  id: string;
  firstName: string;
  lastName?: string;
  contactLink?: string;
  message?: string;
  createdAt: Timestamp | null;
}

interface ProjectRow extends ProjectCardData {
  stats: ProjectStats;
  submissions: Submission[] | null;
}

interface Props {
  projects: ProjectCardData[];
}

const dateTimeFormatter = new Intl.DateTimeFormat("es-CO", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function formatDate(value: Timestamp | null, fallback: string): string {
  return value ? dateTimeFormatter.format(value.toDate()) : fallback;
}

// Ver DashboardPanel.tsx: separado de LikesPanel para que el fetch solo
// corra una vez que AdminGate confirmó sesión, no al montar la página.
function StatsContent({ projects }: Props) {
  const [rows, setRows] = useState<ProjectRow[] | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all(
      projects.map(async (project) => ({ ...project, stats: await getProjectStats(project.slug), submissions: null })),
    ).then((results) => {
      if (cancelled) return;
      // Más reciente visitado primero; nunca visitado va al final (057,
      // pedido explícito del usuario). `lastVisit` nulo se trata como el
      // valor más antiguo posible para que caiga al final del orden.
      const sorted = [...results].sort(
        (a, b) => (b.stats.lastVisit?.toMillis() ?? 0) - (a.stats.lastVisit?.toMillis() ?? 0),
      );
      setRows(sorted);
    });
    return () => {
      cancelled = true;
    };
  }, [projects]);

  async function toggleExpand(slug: string) {
    if (expanded === slug) {
      setExpanded(null);
      return;
    }
    setExpanded(slug);
    setError(null);
    const project = rows?.find((item) => item.slug === slug);
    if (project?.submissions) return;

    try {
      const submissionsQuery = query(
        collection(db, "projectLikes", slug, "submissions"),
        orderBy("createdAt", "desc"),
      );
      const snap = await getDocs(submissionsQuery);
      const submissions: Submission[] = snap.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<Submission, "id">),
      }));
      setRows((prev) => prev && prev.map((item) => (item.slug === slug ? { ...item, submissions } : item)));
    } catch {
      setError("No se pudieron cargar los mensajes (¿sesión admin válida?).");
    }
  }

  return (
    <>
      <h1 className="mb-6 text-2xl font-display font-bold">Estadísticas</h1>
      {error && <p className="mb-4 text-sm text-red-400">{error}</p>}

      {rows == null && <p className="text-sm text-ink-muted">Cargando estadísticas…</p>}

      {rows != null && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {rows.map((project, index) => {
            const stats = project.stats;
            const [colorA, colorB] = project.colors;
            return (
              <div
                key={project.slug}
                className={index === 0 ? "sm:col-span-2" : undefined}
                style={{
                  borderRadius: "2rem",
                  padding: "clamp(3px, 0.53vw, 10px)",
                  background: `conic-gradient(from 135deg at 50% 50%, ${colorA}, ${colorB}, ${colorA})`,
                }}
              >
                <div
                  className="rounded-[calc(2rem-0.53vw)] p-4"
                  style={{ background: "color-mix(in srgb, var(--color-surface) 85%, transparent)" }}
                >
                  <div className="flex flex-col gap-4">
                    <div className="aspect-video w-full shrink-0 overflow-hidden rounded-2xl bg-surface-muted">
                      {project.imageSrc && (
                        <img src={project.imageSrc} alt={project.title} className="h-full w-full object-cover" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="font-display text-lg font-bold">{project.title}</p>

                      {/* La tarjeta destacada (index 0, la más reciente) ocupa la fila
                          entera y puede permitirse 3 columnas de stats; el resto son
                          la mitad de ancho (2 por fila) y se quedan en 2 columnas —
                          nunca 3, para no depender de un breakpoint de viewport que
                          ignora el ancho real de la tarjeta. */}
                      <dl
                        className={`mt-3 grid grid-cols-2 gap-x-4 gap-y-3 text-sm ${index === 0 ? "sm:grid-cols-3" : ""}`}
                      >
                        <div>
                          <dt className="text-ink-muted">❤ Likes</dt>
                          <dd className="font-medium">{stats.likes}</dd>
                        </div>
                        <div>
                          <dt className="text-ink-muted">👁 Visitas totales</dt>
                          <dd className="font-medium">{stats.views}</dd>
                        </div>
                        <div>
                          <dt className="text-ink-muted">📅 Visitas último mes</dt>
                          <dd className="font-medium">{stats.monthlyViews}</dd>
                        </div>
                        <div>
                          <dt className="text-ink-muted">Creado</dt>
                          <dd className="font-medium">{formatDate(stats.createdAt, "Sin publicar todavía")}</dd>
                        </div>
                        <div>
                          <dt className="text-ink-muted">Actualizado</dt>
                          <dd className="font-medium">{formatDate(stats.updatedAt, "Sin publicar todavía")}</dd>
                        </div>
                        <div>
                          <dt className="text-ink-muted">Última visita</dt>
                          <dd className="font-medium">{formatDate(stats.lastVisit, "Sin visitas todavía")}</dd>
                        </div>
                      </dl>

                      <button
                        type="button"
                        onClick={() => toggleExpand(project.slug)}
                        className="mt-3 text-sm text-ink-muted underline"
                      >
                        {expanded === project.slug ? "Ocultar mensajes" : "Ver mensajes"}
                      </button>

                      {expanded === project.slug && (
                        <ul className="mt-3 space-y-2 border-t border-ink-muted/20 pt-3">
                          {project.submissions == null && <li className="text-sm text-ink-muted">Cargando…</li>}
                          {project.submissions?.length === 0 && <li className="text-sm text-ink-muted">Sin mensajes.</li>}
                          {project.submissions?.map((submission) => (
                            <li key={submission.id} className="text-sm">
                              <span className="font-medium">
                                {submission.firstName} {submission.lastName ?? ""}
                              </span>
                              {submission.contactLink && (
                                <>
                                  {" — "}
                                  <a href={submission.contactLink} className="underline" target="_blank" rel="noreferrer">
                                    {submission.contactLink}
                                  </a>
                                </>
                              )}
                              {submission.message && <p className="text-ink-muted">{submission.message}</p>}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

export default function LikesPanel({ projects }: Props) {
  return (
    <AdminGate active="likes" switcherProjects={projects}>
      <StatsContent projects={projects} />
    </AdminGate>
  );
}
