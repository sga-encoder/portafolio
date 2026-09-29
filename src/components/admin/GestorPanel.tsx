import { useEffect, useState } from "react";
import type { ProjectCardData } from "../../lib/admin/projectCards";
import { MANAGED_PROJECTS } from "../../data/managedProjects";
import {
  loadManagedProjects,
  normalizeRepo,
  publishManaged,
  saveManagedDraft,
  type ManagedProject,
} from "../../lib/admin/gestor/registry";
import { loadSummary, type ProjectSummary } from "../../lib/admin/gestor/summary";
import AdminGate from "./AdminGate";
import ProjectDetail from "./gestor/ProjectDetail";
import ProjectProgressCard from "./gestor/ProjectProgressCard";

interface Props {
  switcherProjects: ProjectCardData[];
  /** Slugs con página pública (`src/content/projects/`) — marca "sin página pública" y el enlace al editor. */
  publishedSlugs: string[];
}

type Status = "loading" | "idle" | "saving" | "publishing" | "error";

const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

function AddProjectForm({ options, onAdd }: { options: ProjectCardData[]; onAdd: (project: ManagedProject) => void }) {
  const [open, setOpen] = useState(false);
  const [id, setId] = useState("");
  const [title, setTitle] = useState("");
  const [repo, setRepo] = useState("");
  const [branch, setBranch] = useState("");
  const [error, setError] = useState<string | null>(null);

  function submit() {
    const cleanId = id.trim().toLowerCase();
    const cleanRepo = normalizeRepo(repo);
    if (!SLUG_RE.test(cleanId)) {
      setError("El identificador solo puede tener minúsculas, números y guiones.");
      return;
    }
    if (!/^[^/\s]+\/[^/\s]+$/.test(cleanRepo)) {
      setError("El repo va como owner/repo (o pegá la URL de GitHub).");
      return;
    }
    if (!title.trim()) {
      setError("Ponele un título.");
      return;
    }
    onAdd({
      id: cleanId,
      title: title.trim(),
      repo: cleanRepo,
      ...(branch.trim() ? { branch: branch.trim() } : {}),
    });
    setId("");
    setTitle("");
    setRepo("");
    setBranch("");
    setError(null);
    setOpen(false);
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="rounded-lg bg-surface-muted px-4 py-2 text-sm font-medium hover:text-brand">
        + Agregar proyecto
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-ink-muted/20 bg-surface-muted/40 p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm">
          <span className="mb-1 block text-xs text-ink-muted">Identificador</span>
          <input
            type="text"
            value={id}
            onChange={(event) => setId(event.target.value)}
            list="gestor-published-slugs"
            placeholder="mi-proyecto"
            className="w-full rounded-lg border border-ink-muted/30 bg-surface px-3 py-2 text-sm"
          />
          <datalist id="gestor-published-slugs">
            {options.map((option) => (
              <option key={option.slug} value={option.slug}>
                {option.title}
              </option>
            ))}
          </datalist>
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-xs text-ink-muted">Título</span>
          <input
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Mi Proyecto"
            className="w-full rounded-lg border border-ink-muted/30 bg-surface px-3 py-2 text-sm"
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-xs text-ink-muted">Repositorio</span>
          <input
            type="text"
            value={repo}
            onChange={(event) => setRepo(event.target.value)}
            placeholder="sga-encoder/mi-proyecto"
            className="w-full rounded-lg border border-ink-muted/30 bg-surface px-3 py-2 text-sm"
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-xs text-ink-muted">Rama (opcional)</span>
          <input
            type="text"
            value={branch}
            onChange={(event) => setBranch(event.target.value)}
            placeholder="por defecto: la del repo"
            className="w-full rounded-lg border border-ink-muted/30 bg-surface px-3 py-2 text-sm"
          />
        </label>
      </div>
      {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
      <div className="mt-3 flex items-center gap-2">
        <button type="button" onClick={submit} className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white">
          Agregar
        </button>
        <button type="button" onClick={() => setOpen(false)} className="rounded-lg bg-surface-muted px-4 py-2 text-sm font-medium">
          Cancelar
        </button>
      </div>
    </div>
  );
}

// Ver DashboardPanel.tsx: separado de GestorPanel para que las llamadas a GitHub/Firestore solo
// corran una vez que AdminGate confirmó sesión.
function GestorContent({ publishedSlugs, switcherProjects }: Props) {
  const [projects, setProjects] = useState<ManagedProject[] | null>(null);
  const [sha, setSha] = useState<string | null>(null);
  const [isDraft, setIsDraft] = useState(false);
  const [status, setStatus] = useState<Status>("loading");
  const [message, setMessage] = useState<string | null>(null);
  const [summaries, setSummaries] = useState<Record<string, ProjectSummary>>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadManagedProjects()
      .then((loaded) => {
        if (cancelled) return;
        setProjects(loaded.data);
        setSha(loaded.sha);
        setIsDraft(loaded.isDraft);
        setStatus("idle");
      })
      .catch(() => {
        if (cancelled) return;
        // Sin archivo remoto todavía: arranca desde el dato empaquetado al build (mismo criterio
        // que SectionsTab de 064).
        setProjects(MANAGED_PROJECTS);
        setSha(null);
        setStatus("idle");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Un resumen por proyecto, en paralelo — `loadSummary` nunca lanza, así que un repo inaccesible
  // se muestra con su error sin frenar a los demás.
  useEffect(() => {
    if (!projects) return;
    let cancelled = false;
    for (const project of projects) {
      loadSummary(project).then((summary) => {
        if (!cancelled) setSummaries((current) => ({ ...current, [project.id]: summary }));
      });
    }
    return () => {
      cancelled = true;
    };
  }, [projects]);

  async function persist(next: ManagedProject[]) {
    setProjects(next);
    setStatus("saving");
    try {
      await saveManagedDraft(next);
      setIsDraft(true);
      setStatus("idle");
      setMessage("Registro guardado como borrador.");
    } catch (err) {
      setStatus("error");
      setMessage(`No se pudo guardar el registro: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  async function handlePublishRegistry() {
    if (!projects) return;
    setStatus("publishing");
    setMessage(null);
    try {
      setSha(await publishManaged(projects, sha));
      setIsDraft(false);
      setStatus("idle");
      setMessage("Registro publicado.");
    } catch (err) {
      setStatus("error");
      setMessage(`No se pudo publicar el registro: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  const selected = projects?.find((project) => project.id === selectedId) ?? null;

  if (selected) {
    return (
      <ProjectDetail
        project={selected}
        isPublished={publishedSlugs.includes(selected.id)}
        onBack={() => setSelectedId(null)}
      />
    );
  }

  return (
    <>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h1 className="font-display text-2xl font-bold">Gestor de proyectos</h1>
        {isDraft && <span className="rounded-full bg-brand/20 px-3 py-1 text-xs text-brand">Registro sin publicar</span>}
      </div>
      <p className="mb-6 text-sm text-ink-muted">
        Proyectos que todavía se están construyendo. El desglose de etapas de cada uno vive como Markdown en{" "}
        <span className="font-medium text-ink">su propio repositorio</span>, no acá.
      </p>

      {status === "loading" && <p className="text-ink-muted">Cargando…</p>}

      {projects && projects.length === 0 && (
        <p className="mb-4 text-sm text-ink-muted">Todavía no hay proyectos en el gestor.</p>
      )}

      <div className="space-y-3">
        {projects?.map((project) => (
          <ProjectProgressCard
            key={project.id}
            summary={summaries[project.id] ?? null}
            isPublished={publishedSlugs.includes(project.id)}
            onOpen={() => setSelectedId(project.id)}
            onRemove={() => {
              if (!window.confirm(`¿Quitar "${project.title}" del gestor? El archivo de etapas en su repo no se toca.`)) return;
              void persist(projects.filter((candidate) => candidate.id !== project.id));
            }}
          />
        ))}
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <AddProjectForm
          options={switcherProjects}
          onAdd={(project) => {
            if (projects?.some((candidate) => candidate.id === project.id)) {
              setMessage("Ya hay un proyecto con ese identificador.");
              return;
            }
            void persist([...(projects ?? []), project]);
          }}
        />
        <button
          type="button"
          onClick={handlePublishRegistry}
          disabled={status === "publishing" || !projects}
          className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {status === "publishing" ? "Publicando…" : "Publicar registro"}
        </button>
        {message && <span className="text-sm text-ink-muted">{message}</span>}
      </div>
    </>
  );
}

/**
 * Sección "Gestor de proyectos" de `/admin` (feature 087): sigue el avance de los proyectos EN
 * CONSTRUCCIÓN, a diferencia de `/admin/proyectos` que edita la página pública de los terminados.
 * Ver .claude/spec/features/087-gestor-proyectos-etapas/spec.md.
 */
export default function GestorPanel({ switcherProjects, publishedSlugs }: Props) {
  return (
    <AdminGate active="gestor" wide switcherProjects={switcherProjects}>
      <GestorContent switcherProjects={switcherProjects} publishedSlugs={publishedSlugs} />
    </AdminGate>
  );
}
