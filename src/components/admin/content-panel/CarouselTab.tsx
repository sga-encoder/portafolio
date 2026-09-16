import { useEffect, useState } from "react";
import { loadJsonContent, publishJson, saveJsonDraft } from "../../../lib/admin/jsonContent";
import { CAROUSEL_PROJECT_IDS } from "../../../data/carousel";
import type { ProjectCardData } from "../../../lib/admin/projectCards";
import AddProjectModal from "./AddProjectModal";
import CarouselRow from "./CarouselRow";

// Doc-id nuevo (no `home:carousel`, reusado por `066` con la forma vieja `ProjectItem[]`) — evita
// que un borrador viejo sin publicar de esa pestaña se cargue mal-tipado acá.
const DRAFT_ID = "home:carousel-select";
const FILE_PATH = "src/data/carousel.json";

type Status = "loading" | "idle" | "saving" | "publishing" | "error";

/** Filas sin proyecto elegido no se publican — mismo criterio que `cleanSkills`/`cleanProjects`. */
function cleanIds(input: string[]): string[] {
  return input.filter((id) => id.trim());
}

interface Props {
  availableProjects: ProjectCardData[];
}

/**
 * Pestaña "Carrusel" del panel de Contenido (071): gestiona únicamente membresía + orden del
 * carrusel de Proyectos de Inicio sobre `src/data/carousel.json` (`string[]` de ids). Título,
 * descripción y portada de cada proyecto se resuelven en `ProjectsSection.astro` directamente
 * desde su Markdown — acá no se editan, solo se elige cuál aparece y en qué orden.
 */
export default function CarouselTab({ availableProjects }: Props) {
  const [ids, setIds] = useState<string[] | null>(null);
  const [sha, setSha] = useState<string | null>(null);
  const [isDraft, setIsDraft] = useState(false);
  const [status, setStatus] = useState<Status>("loading");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadJsonContent<string[]>(DRAFT_ID, FILE_PATH)
      .then((loaded) => {
        if (cancelled) return;
        setIds(loaded.data);
        setSha(loaded.sha);
        setIsDraft(loaded.isDraft);
        setStatus("idle");
      })
      .catch((err) => {
        console.error(err);
        if (cancelled) return;
        setIds(CAROUSEL_PROJECT_IDS);
        setSha(null);
        setStatus("idle");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function removeAt(index: number) {
    if (!ids) return;
    setIds(ids.filter((_, i) => i !== index));
  }

  function moveBy(index: number, delta: number) {
    if (!ids) return;
    const target = index + delta;
    if (target < 0 || target >= ids.length) return;
    const next = [...ids];
    [next[index], next[target]] = [next[target], next[index]];
    setIds(next);
  }

  function handleAdd(slug: string) {
    if (!ids) return;
    setIds([...ids, slug]);
  }

  async function handleSaveDraft() {
    if (!ids) return;
    setStatus("saving");
    setMessage(null);
    try {
      await saveJsonDraft(DRAFT_ID, cleanIds(ids));
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
    if (!ids) return;
    setStatus("publishing");
    setMessage(null);
    try {
      await publishJson(DRAFT_ID, FILE_PATH, cleanIds(ids), sha);
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

  if (status === "loading" || !ids) {
    return <p className="text-ink-muted">Cargando…</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      {isDraft && (
        <span className="w-fit rounded-full bg-brand/20 px-3 py-1 text-xs text-brand">Borrador sin publicar</span>
      )}

      <p className="text-sm text-ink-muted">
        Para cambiar la imagen de un proyecto en el carrusel, edita su portada desde "Proyectos" —
        acá solo se elige cuáles aparecen y en qué orden.
      </p>

      <div className="flex flex-wrap gap-3 rounded-2xl bg-surface-muted p-4">
        {ids.map((id, index) => {
          const selected = availableProjects.find((project) => project.slug === id);
          return (
            <CarouselRow
              key={index}
              id={id}
              selected={selected}
              onRemove={() => removeAt(index)}
              onMoveUp={() => moveBy(index, -1)}
              onMoveDown={() => moveBy(index, 1)}
              canMoveUp={index > 0}
              canMoveDown={index < ids.length - 1}
            />
          );
        })}

        <AddProjectModal
          options={availableProjects.filter((project) => !ids.includes(project.slug))}
          onAdd={handleAdd}
        />
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
