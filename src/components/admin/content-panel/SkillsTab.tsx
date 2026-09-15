import { useEffect, useState } from "react";
import { loadJsonContent, publishJson, saveJsonDraft } from "../../../lib/admin/jsonContent";
import { skills as fallbackSkills, type Skill } from "../../../data/skills";
import SkillRow from "./SkillRow";

const DRAFT_ID = "home:skills";
const FILE_PATH = "src/data/skills.json";

type Status = "loading" | "idle" | "saving" | "publishing" | "error";

function newSkill(): Skill {
  return { name: "", percentage: 50, imageKey: "", side: "left", category: "lenguajes" };
}

/** Recorta filas a medio llenar antes de guardar — mismo criterio que `cleanProfile` en `SectionsTab.tsx`. */
function cleanSkills(input: Skill[]): Skill[] {
  return input.filter((skill) => skill.name.trim());
}

/**
 * Pestaña "Habilidades" del panel de Contenido (065): CRUD completo sobre `src/data/skills.json`
 * — agregar/quitar, editar nombre/porcentaje/lado/categoría/ícono, y reordenar dentro del array
 * (el orden define el chevron desktop y el orden por categoría en mobile, ver `skills.ts`).
 */
export default function SkillsTab() {
  const [data, setData] = useState<Skill[] | null>(null);
  const [sha, setSha] = useState<string | null>(null);
  const [isDraft, setIsDraft] = useState(false);
  const [status, setStatus] = useState<Status>("loading");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadJsonContent<Skill[]>(DRAFT_ID, FILE_PATH)
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
        setData(fallbackSkills);
        setSha(null);
        setStatus("idle");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function updateAt(index: number, next: Skill) {
    if (!data) return;
    setData(data.map((skill, i) => (i === index ? next : skill)));
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

  function addSkill() {
    if (!data) return;
    setData([...data, newSkill()]);
  }

  async function handleSaveDraft() {
    if (!data) return;
    setStatus("saving");
    setMessage(null);
    try {
      await saveJsonDraft(DRAFT_ID, cleanSkills(data));
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
      await publishJson(DRAFT_ID, FILE_PATH, cleanSkills(data), sha);
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

      <div className="flex flex-col gap-3 rounded-2xl bg-surface-muted p-4">
        {data.map((skill, index) => (
          <SkillRow
            key={index}
            skill={skill}
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
          onClick={addSkill}
          className="rounded-lg border-2 border-dashed border-ink-muted/30 px-4 py-2 text-sm text-ink-muted hover:border-ink-muted hover:text-ink"
        >
          + Agregar habilidad
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
