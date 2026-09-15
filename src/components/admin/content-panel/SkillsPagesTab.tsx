import { useEffect, useState } from "react";
import { loadJsonContent, publishJson, saveJsonDraft } from "../../../lib/admin/jsonContent";
import { skillsPages as fallbackSkillsPages, type SkillsPage } from "../../../data/skillsPages";
import SkillsPageCard from "./SkillsPageCard";

const DRAFT_ID = "home:skillsPages";
const FILE_PATH = "src/data/skillsPages.json";

type Status = "loading" | "idle" | "saving" | "publishing" | "error";

function newSkillsPage(): SkillsPage {
  return { columns: [{ type: "skills", skills: [] }] };
}

/** Recorta filas de skills a medio llenar antes de guardar — mismo criterio que `cleanSkills` en `065`. */
function cleanSkillsPages(input: SkillsPage[]): SkillsPage[] {
  return input.map((page) => ({
    columns: page.columns.map((column) =>
      column.type === "skills"
        ? { ...column, skills: (column.skills ?? []).filter((skill) => skill.name.trim()) }
        : column,
    ),
  }));
}

/**
 * Pestaña "Habilidades" del panel de Contenido (069): reemplaza a `SkillsTab.tsx` (065) —
 * CRUD sobre `src/data/skillsPages.json`, un array de páginas de carrusel, cada una con 1 a 3
 * columnas de tipo "skills" o "image". Mismo par borrador(Firestore)/publicar(GitHub) que el
 * resto de pestañas de `jsonContent.ts`.
 */
export default function SkillsPagesTab() {
  const [data, setData] = useState<SkillsPage[] | null>(null);
  const [sha, setSha] = useState<string | null>(null);
  const [isDraft, setIsDraft] = useState(false);
  const [status, setStatus] = useState<Status>("loading");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadJsonContent<SkillsPage[]>(DRAFT_ID, FILE_PATH)
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
        setData(fallbackSkillsPages);
        setSha(null);
        setStatus("idle");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function updateAt(index: number, next: SkillsPage) {
    if (!data) return;
    setData(data.map((page, i) => (i === index ? next : page)));
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

  function addPage() {
    if (!data) return;
    setData([...data, newSkillsPage()]);
  }

  async function handleSaveDraft() {
    if (!data) return;
    setStatus("saving");
    setMessage(null);
    try {
      await saveJsonDraft(DRAFT_ID, cleanSkillsPages(data));
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
      await publishJson(DRAFT_ID, FILE_PATH, cleanSkillsPages(data), sha);
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

      <div className="flex flex-col gap-4">
        {data.map((page, index) => (
          <SkillsPageCard
            key={index}
            page={page}
            index={index}
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
          onClick={addPage}
          className="rounded-lg border-2 border-dashed border-ink-muted/30 px-4 py-2 text-sm text-ink-muted hover:border-ink-muted hover:text-ink"
        >
          + Agregar página
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
