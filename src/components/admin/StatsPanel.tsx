import { useEffect, useState } from "react";
import type { Timestamp } from "firebase/firestore";
import AdminGate from "./AdminGate";
import type { ProjectCardData } from "../../lib/admin/projectCards";
import { getProjectStats, type ProjectStats } from "../../lib/admin/projectStats";

interface ProjectRow extends ProjectCardData {
  stats: ProjectStats;
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

// Corona oro/plata/bronce para los 3 proyectos más visitados recientemente
// (057, pedido explícito del usuario) — sin emoji porque no existe una
// corona de plata/bronce en Unicode, así que es un ícono propio (mismo
// criterio de SVG a mano que ya usa AdminDotNav) coloreado por rango.
const RANK_COLORS = ["#FFD700", "#C0C0C0", "#CD7F32"] as const;

function RankCrown({ rank }: { rank: number }) {
  if (rank >= RANK_COLORS.length) return null;
  return (
    <div
      className="absolute left-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-surface/80 backdrop-blur-sm"
      title={["1er lugar", "2do lugar", "3er lugar"][rank]}
    >
      <svg viewBox="0 0 24 24" width="18" height="18" style={{ color: RANK_COLORS[rank] }}>
        <path d="M3 8l4 3 5-6 5 6 4-3-2 10H5L3 8z" fill="currentColor" />
      </svg>
    </div>
  );
}

interface CardProps {
  project: ProjectRow;
  rank: number;
  dlColumns: "two" | "three";
}

function StatsCard({ project, rank, dlColumns }: CardProps) {
  const stats = project.stats;
  const [colorA, colorB] = project.colors;

  return (
    <div
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
          <div className="relative aspect-video w-full shrink-0 overflow-hidden rounded-2xl bg-surface-muted">
            {project.imageSrc && <img src={project.imageSrc} alt={project.title} className="h-full w-full object-cover" />}
            <RankCrown rank={rank} />
          </div>

          <div className="min-w-0 flex-1">
            <p className="font-display text-lg font-bold">{project.title}</p>

            <dl className={`mt-3 grid grid-cols-2 gap-x-4 gap-y-3 text-sm ${dlColumns === "three" ? "sm:grid-cols-3" : ""}`}>
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
          </div>
        </div>
      </div>
    </div>
  );
}

// Ver DashboardPanel.tsx: separado de StatsPanel para que el fetch solo
// corra una vez que AdminGate confirmó sesión, no al montar la página.
function StatsContent({ projects }: Props) {
  const [rows, setRows] = useState<ProjectRow[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all(projects.map(async (project) => ({ ...project, stats: await getProjectStats(project.slug) }))).then(
      (results) => {
        if (cancelled) return;
        // Más reciente visitado primero; nunca visitado va al final (057,
        // pedido explícito del usuario). `lastVisit` nulo se trata como el
        // valor más antiguo posible para que caiga al final del orden.
        const sorted = [...results].sort(
          (a, b) => (b.stats.lastVisit?.toMillis() ?? 0) - (a.stats.lastVisit?.toMillis() ?? 0),
        );
        setRows(sorted);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [projects]);

  return (
    <>
      <h1 className="mb-6 text-center text-2xl font-display font-bold">Estadísticas</h1>

      {rows == null && <p className="text-sm text-ink-muted">Cargando estadísticas…</p>}

      {rows != null && rows.length > 0 && (
        <div className="flex flex-col gap-5">
          <StatsCard project={rows[0]} rank={0} dlColumns="three" />

          {/* El resto envuelve en filas de 2, hacia abajo con el scroll
              normal de la página (no horizontal) — pedido explícito del
              usuario: al cargar se ve el proyecto 1, la fila siguiente con
              el 2 y el 3, y luego lo que alcance a entrar del resto según
              el alto de la ventana (naturalmente la mitad de la fila
              siguiente si no entra completa), sin lógica especial: es el
              comportamiento normal de una grilla que envuelve. */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {rows.slice(1).map((project, i) => (
              <StatsCard key={project.slug} project={project} rank={i + 1} dlColumns="two" />
            ))}
          </div>
        </div>
      )}
    </>
  );
}

export default function StatsPanel({ projects }: Props) {
  return (
    <AdminGate active="estadisticas" switcherProjects={projects}>
      <StatsContent projects={projects} />
    </AdminGate>
  );
}
