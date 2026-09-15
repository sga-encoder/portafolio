import { useEffect, useState } from "react";
import { loadJsonContent, publishJson, saveJsonDraft } from "../../../lib/admin/jsonContent";
import { PROJECTS as fallbackProjects, type ProjectItem } from "../../../data/projects";
import CarouselRow from "./CarouselRow";

const DRAFT_ID = "home:carousel";
const FILE_PATH = "src/data/projects.json";

type Status = "loading" | "idle" | "saving" | "publishing" | "error";

function newProject(): ProjectItem {
  return { id: "", title: "", description: "", imageKey: "", link: "", date: "", featuredOnHome: true };
}

/** Recorta filas a medio llenar antes de guardar — mismo criterio que `cleanSkills` en `SkillsTab.tsx`. */
function cleanProjects(input: ProjectItem[]): ProjectItem[] {
  return input.filter((project) => project.title.trim() && project.id.trim());
}

/**
 * Pestaña "Carrusel" del panel de Contenido (066): CRUD completo sobre `src/data/projects.json`
 * — agregar/quitar, editar título/descripción/imagen/link/fecha, reordenar (el orden del array es
 * el orden del carrusel y del timeline de `/proyectos`), y marcar qué proyectos aparecen en el
 * carrusel de Inicio (`featuredOnHome`) sin sacarlos del listado completo.
 */
export default function CarouselTab() {
  const [data, setData] = useState<ProjectItem[] | null>(null);
  const [sha, setSha] = useState<string | null>(null);
  const [isDraft, setIsDraft] = useState(false);
  const [status, setStatus] = useState<Status>("loading");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadJsonContent<ProjectItem[]>(DRAFT_ID, FILE_PATH)
      .then((loaded) => {
        if (cancelled) return;
        setData(loaded.data);
        setSha(loaded.sha);
        setIsDraft(loaded.isDraft);
        setStatus("idle");
      })
      .catch((err) => {
        console.error(err);
        if (cancelled) return;
        setData(fallbackProjects);
        setSha(null);
        setStatus("idle");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function updateAt(index: number, next: ProjectItem) {
    if (!data) return;
    setData(data.map((project, i) => (i === index ? next : project)));
  }

  function removeAt(index: number) {
    if (!data) return;
    setData(data.filter((_, i) => i !== index));
  }

  function moveBy(index: number, delta: number) {
    if (!data) return;
    const target = index + delta;
    if (target < 0 || target >= data.length) return;
    const next = [...data];
    [next[index], next[target]] = [next[target], next[index]];
    setData(next);
  }

  function addProject() {
    if (!data) return;
    setData([...data, newProject()]);
  }

  async function handleSaveDraft() {
    if (!data) return;
    setStatus("saving");
    setMessage(null);
    try {
      await saveJsonDraft(DRAFT_ID, cleanProjects(data));
      setIsDraft(true);
      setStatus("idle");
      setMessage("Borrador guardado.");
    } catch (err) {
      console.error(err);
      setStatus("error");
      setMessage(`No se pudo guardar el borrador: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  async function handlePublish() {
    if (!data) return;
    setStatus("publishing");
    setMessage(null);
    try {
      await publishJson(DRAFT_ID, FILE_PATH, cleanProjects(data), sha);
      setIsDraft(false);
      setStatus("idle");
      setMessage("Publicado.");
    } catch (err) {
      console.error(err);
      setStatus("error");
      setMessage(`No se pudo publicar: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  const disabled = status === "loading" || status === "saving" || status === "publishing";

  if (status === "loading" || !data) {
    return <p className="text-ink-muted">Cargando…</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      {isDraft && (
        <span className="w-fit rounded-full bg-brand/20 px-3 py-1 text-xs text-brand">Borrador sin publicar</span>
      )}

      <p className="text-sm text-ink-muted">
        Un proyecto nuevo sin Markdown en <code>src/content/projects/</code> queda visible acá, pero su link da 404
        hasta crear el contenido desde "Proyectos → + Nuevo proyecto".
      </p>

      <div className="flex flex-col gap-3 rounded-2xl bg-surface-muted p-4">
        {data.map((project, index) => (
          <CarouselRow
            key={index}
            project={project}
            onChange={(next) => updateAt(index, next)}
            onRemove={() => removeAt(index)}
            onMoveUp={() => moveBy(index, -1)}
            onMoveDown={() => moveBy(index, 1)}
            canMoveUp={index > 0}
            canMoveDown={index < data.length - 1}
          />
        ))}

        <button
          type="button"
          onClick={addProject}
          className="rounded-lg border-2 border-dashed border-ink-muted/30 px-4 py-2 text-sm text-ink-muted hover:border-ink-muted hover:text-ink"
        >
          + Agregar proyecto
        </button>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSaveDraft}
          disabled={disabled}
          className="rounded-lg bg-surface-muted px-4 py-2 text-sm font-medium disabled:opacity-50"
        >
          {status === "saving" ? "Guardando…" : "Guardar borrador"}
        </button>
        <button
          type="button"
          onClick={handlePublish}
          disabled={disabled}
          className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {status === "publishing" ? "Publicando…" : "Publicar"}
        </button>
        {message && <span className="text-sm text-ink-muted">{message}</span>}
      </div>
    </div>
  );
}
