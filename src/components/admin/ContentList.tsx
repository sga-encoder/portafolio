import { useEffect, useState } from "react";
import { doc, getDoc, type Timestamp } from "firebase/firestore";
import { db } from "../../lib/firebase";
import AdminGate from "./AdminGate";
import PublishDraftButton from "./PublishDraftButton";
import { isDraftPending, type DraftDoc } from "../../lib/admin/drafts";
import type { ProjectCardData, ProjectYearGroup } from "../../lib/admin/projectCards";

interface Props {
  groups: ProjectYearGroup[];
}

interface PanelProps extends Props {
  switcherProjects: ProjectCardData[];
}

interface ProjectStats {
  likes: number;
  views: number;
  lastVisit: Timestamp | null;
  hasPendingDraft: boolean;
}

async function fetchStats(slug: string): Promise<ProjectStats> {
  // Cada lectura se resuelve de forma independiente: si falla una (ej.
  // `projectViews` sin desplegar todavía en las Security Rules) no debe
  // dejar sin el resto de datos a la tarjeta.
  const [likesResult, viewsResult, draftResult] = await Promise.allSettled([
    getDoc(doc(db, "projectLikes", slug)),
    getDoc(doc(db, "projectViews", slug)),
    getDoc(doc(db, "adminDrafts", slug)),
  ]);
  if (likesResult.status === "rejected") console.error(`No se pudieron leer los likes de ${slug}`, likesResult.reason);
  if (viewsResult.status === "rejected") console.error(`No se pudieron leer las visitas de ${slug}`, viewsResult.reason);
  if (draftResult.status === "rejected") console.error(`No se pudo leer el borrador de ${slug}`, draftResult.reason);

  return {
    likes: likesResult.status === "fulfilled" ? ((likesResult.value.data()?.count as number | undefined) ?? 0) : 0,
    views: viewsResult.status === "fulfilled" ? ((viewsResult.value.data()?.count as number | undefined) ?? 0) : 0,
    lastVisit:
      viewsResult.status === "fulfilled" ? ((viewsResult.value.data()?.lastVisit as Timestamp | undefined) ?? null) : null,
    hasPendingDraft:
      draftResult.status === "fulfilled"
        ? isDraftPending(draftResult.value.exists() ? (draftResult.value.data() as DraftDoc) : null)
        : false,
  };
}

const dateTimeFormatter = new Intl.DateTimeFormat("es-CO", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

// Estado abierto/cerrado de cada sección de año (056), recordado por
// visitante vía localStorage — mismo criterio defensivo que
// ProjectLikeButton/ProjectViewTracker: sin acceso a localStorage, se
// degrada a "todo expandido" sin romper la UI.
const COLLAPSED_YEARS_KEY = "admin-proyectos-collapsed-years";

function loadCollapsedYears(): Set<string> {
  try {
    const raw = localStorage.getItem(COLLAPSED_YEARS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

function saveCollapsedYears(years: Set<string>) {
  try {
    localStorage.setItem(COLLAPSED_YEARS_KEY, JSON.stringify([...years]));
  } catch {
    // Sin persistencia (modo privado, localStorage bloqueado, etc.) — no rompe la UI.
  }
}

// Ver DashboardPanel.tsx/StatsPanel.tsx: separado de ContentList para que el
// fetch de estadísticas solo corra una vez que AdminGate confirmó sesión.
function ContentListContent({ groups }: Props) {
  const [stats, setStats] = useState<Record<string, ProjectStats>>({});
  const [collapsedYears, setCollapsedYears] = useState<Set<string>>(() => loadCollapsedYears());

  function toggleYear(year: string) {
    setCollapsedYears((prev) => {
      const next = new Set(prev);
      if (next.has(year)) next.delete(year);
      else next.add(year);
      saveCollapsedYears(next);
      return next;
    });
  }

  useEffect(() => {
    const slugs = groups.flatMap((group) => group.projects.map((project) => project.slug));
    let cancelled = false;

    Promise.all(slugs.map(async (slug) => [slug, await fetchStats(slug)] as const)).then((entries) => {
      if (!cancelled) setStats(Object.fromEntries(entries));
    });

    return () => {
      cancelled = true;
    };
  }, [groups]);

  async function refreshOne(slug: string) {
    const stat = await fetchStats(slug);
    setStats((prev) => ({ ...prev, [slug]: stat }));
  }

  return (
    <>
      <h1 className="mb-6 text-center text-2xl font-display font-bold">Editor de Proyectos</h1>
      <div className="mb-8 flex flex-wrap items-center justify-center gap-3">
        <a
          href="/admin/proyectos/nuevo"
          className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
        >
          + Agregar nuevo proyecto
        </a>
        <a
          href="/proyectos"
          className="rounded-lg bg-surface-muted px-4 py-2 text-sm font-medium transition hover:bg-surface-muted/70"
        >
          Ver todos los proyectos
        </a>
      </div>
      <div className="flex flex-col gap-10">
        {groups.map((group) => {
          const isCollapsed = collapsedYears.has(group.year);
          return (
          <div key={group.year}>
            <button
              type="button"
              onClick={() => toggleYear(group.year)}
              aria-expanded={!isCollapsed}
              className="mb-4 flex w-full items-center gap-2 font-display text-xl font-bold text-ink-muted"
            >
              <svg
                viewBox="0 0 20 20"
                width="16"
                height="16"
                aria-hidden="true"
                className={`shrink-0 transition-transform ${isCollapsed ? "-rotate-90" : ""}`}
              >
                <path d="M5 7l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>{group.year}</span>
              {isCollapsed && (
                <>
                  <span className="mx-2 h-0 flex-1 border-b border-dotted border-ink-muted/40" aria-hidden="true" />
                  <span className="font-body text-sm font-normal text-ink-muted">{group.projects.length}</span>
                </>
              )}
            </button>
            {!isCollapsed && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {group.projects.map((project) => {
                const stat = stats[project.slug];
                return (
                  <div key={project.slug} className="relative overflow-hidden rounded-2xl bg-surface-muted transition hover:bg-surface-muted/70">
                    <PublishDraftButton
                      slug={project.slug}
                      title={project.title}
                      hasPendingDraft={stat?.hasPendingDraft ?? false}
                      onPublished={() => refreshOne(project.slug)}
                    />
                    <a href={`/admin/proyectos/${project.slug}`} className="block">
                    <div className="aspect-video w-full bg-surface">
                      {project.imageSrc && (
                        <img src={project.imageSrc} alt={project.title} className="h-full w-full object-cover" />
                      )}
                    </div>
                    <div className="p-4">
                      <p className="font-medium">{project.title}</p>
                      <p className="mt-1 text-sm text-ink-muted">
                        ❤ {stat ? stat.likes : "…"} · 👁 {stat ? stat.views : "…"}
                      </p>
                      <p className="mt-1 text-xs text-ink-muted">
                        {stat
                          ? stat.lastVisit
                            ? `Última visita: ${dateTimeFormatter.format(stat.lastVisit.toDate())}`
                            : "Sin visitas todavía"
                          : "Cargando…"}
                      </p>
                    </div>
                    </a>
                  </div>
                );
              })}
            </div>
            )}
          </div>
          );
        })}
      </div>
    </>
  );
}

export default function ContentList({ groups, switcherProjects }: PanelProps) {
  return (
    <AdminGate active="proyectos" switcherProjects={switcherProjects}>
      <ContentListContent groups={groups} />
    </AdminGate>
  );
}
