import { useEffect, useState } from "react";
import { loadJsonContent, publishJson, saveJsonDraft } from "../../../lib/admin/jsonContent";
import { skillsPages as fallbackSkillsPages, type SkillsPage } from "../../../data/skillsPages";
import { skillCategories as fallbackSkillCategories } from "../../../data/skillCategories";
import SkillsPageCard from "./SkillsPageCard";
import SkillCategoriesPanel from "./SkillCategoriesPanel";

const DRAFT_ID = "home:skillsPages";
const FILE_PATH = "src/data/skillsPages.json";

const CATEGORIES_DRAFT_ID = "home:skillCategories";
const CATEGORIES_FILE_PATH = "src/data/skillCategories.json";

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

function ChevronIcon({ direction }: { direction: "left" | "right" }) {
  const points = direction === "left" ? "15 5 7 12 15 19" : "9 5 17 12 9 19";
  return (
    <svg viewBox="0 0 24 24" width="28" height="28" fill="none" aria-hidden="true">
      <polyline points={points} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * Pestaña "Habilidades" del panel de Contenido (073, rediseño de `069`): en vez de listar todas
 * las páginas apiladas, muestra una página a la vez (mismo patrón de carrusel que
 * `SkillsCarousel.tsx` del sitio público — flechas + dots) para que el editor se vea y se
 * comporte como Inicio. El tamaño de anillos/gaps usa `clamp()`/`vh` (`SkillRow.tsx`/
 * `SkillsColumnCard.tsx`) para que la página quepa en pantalla sin scroll ni contenedores con
 * alto fijo — nada queda fijo/pegado, todo se achica junto con el viewport.
 */
export default function SkillsPagesTab() {
  const [data, setData] = useState<SkillsPage[] | null>(null);
  const [sha, setSha] = useState<string | null>(null);
  const [isDraft, setIsDraft] = useState(false);
  const [status, setStatus] = useState<Status>("loading");
  const [message, setMessage] = useState<string | null>(null);
  const [pageIndex, setPageIndex] = useState(0);

  const [categories, setCategories] = useState<string[]>(fallbackSkillCategories);
  const [categoriesSha, setCategoriesSha] = useState<string | null>(null);
  const [categoriesIsDraft, setCategoriesIsDraft] = useState(false);
  const [categoriesStatus, setCategoriesStatus] = useState<Status>("idle");
  const [categoriesMessage, setCategoriesMessage] = useState<string | null>(null);

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

    loadJsonContent<string[]>(CATEGORIES_DRAFT_ID, CATEGORIES_FILE_PATH)
      .then((loaded) => {
        if (cancelled) return;
        setCategories(loaded.data);
        setCategoriesSha(loaded.sha);
        setCategoriesIsDraft(loaded.isDraft);
      })
      .catch((err) => {
        console.error(err);
        if (cancelled) return;
        setCategories(fallbackSkillCategories);
        setCategoriesSha(null);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSaveCategoriesDraft() {
    setCategoriesStatus("saving");
    setCategoriesMessage(null);
    try {
      await saveJsonDraft(CATEGORIES_DRAFT_ID, categories);
      setCategoriesIsDraft(true);
      setCategoriesStatus("idle");
      setCategoriesMessage("Borrador guardado.");
    } catch (err) {
      console.error(err);
      setCategoriesStatus("error");
      setCategoriesMessage(`No se pudo guardar el borrador: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  async function handlePublishCategories() {
    setCategoriesStatus("publishing");
    setCategoriesMessage(null);
    try {
      await publishJson(CATEGORIES_DRAFT_ID, CATEGORIES_FILE_PATH, categories, categoriesSha);
      setCategoriesIsDraft(false);
      setCategoriesStatus("idle");
      setCategoriesMessage("Publicado.");
    } catch (err) {
      console.error(err);
      setCategoriesStatus("error");
      setCategoriesMessage(`No se pudo publicar: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  const pageCount = data?.length ?? 0;
  const currentIndex = pageCount > 0 ? Math.min(pageIndex, pageCount - 1) : 0;

  function updateCurrent(next: SkillsPage) {
    if (!data) return;
    setData(data.map((page, i) => (i === currentIndex ? next : page)));
  }

  function removeCurrent() {
    if (!data) return;
    const next = data.filter((_, i) => i !== currentIndex);
    setData(next);
    setPageIndex((index) => Math.max(0, Math.min(index, next.length - 1)));
  }

  function moveCurrentBy(delta: number) {
    if (!data) return;
    const target = currentIndex + delta;
    if (target < 0 || target >= data.length) return;
    const next = [...data];
    [next[currentIndex], next[target]] = [next[target], next[currentIndex]];
    setData(next);
    setPageIndex(target);
  }

  function addPage() {
    if (!data) return;
    setPageIndex(data.length);
    setData([...data, newSkillsPage()]);
  }

  function goTo(delta: number) {
    if (pageCount === 0) return;
    setPageIndex((index) => (index + delta + pageCount) % pageCount);
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

  const currentPage = data[currentIndex];

  return (
    <div className="flex flex-col gap-3">
      {isDraft && (
        <span className="w-fit rounded-full bg-brand/20 px-3 py-1 text-xs text-brand">Borrador sin publicar</span>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm text-ink-muted">
          <span>
            Página {pageCount === 0 ? 0 : currentIndex + 1} de {pageCount}
          </span>
          <button
            type="button"
            onClick={() => moveCurrentBy(-1)}
            disabled={currentIndex === 0}
            title="Mover esta página a la izquierda"
            className="rounded-full bg-surface-muted px-2 py-0.5 text-xs disabled:opacity-30"
          >
            ← Mover
          </button>
          <button
            type="button"
            onClick={() => moveCurrentBy(1)}
            disabled={currentIndex >= pageCount - 1}
            title="Mover esta página a la derecha"
            className="rounded-full bg-surface-muted px-2 py-0.5 text-xs disabled:opacity-30"
          >
            Mover →
          </button>
          {pageCount > 0 && (
            <button
              type="button"
              onClick={removeCurrent}
              title="Eliminar esta página"
              className="rounded-full bg-surface-muted px-2 py-0.5 text-xs text-red-500"
            >
              Eliminar página
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={addPage}
          className="rounded-lg border-2 border-dashed border-ink-muted/30 px-3 py-1 text-xs text-ink-muted hover:border-ink-muted hover:text-ink"
        >
          + Agregar página
        </button>
      </div>

      {pageCount === 0 ? (
        <p className="text-ink-muted">No hay páginas todavía.</p>
      ) : (
        <div className="relative flex items-center">
          {pageCount > 1 && (
            <button
              type="button"
              aria-label="Página anterior"
              onClick={() => goTo(-1)}
              className="absolute left-0 z-10 -translate-x-1 transition-transform hover:scale-110"
              style={{ color: "var(--color-brand)" }}
            >
              <ChevronIcon direction="left" />
            </button>
          )}
          <div className="w-full px-9">
            <SkillsPageCard page={currentPage} categories={categories} onChange={updateCurrent} />
          </div>
          {pageCount > 1 && (
            <button
              type="button"
              aria-label="Página siguiente"
              onClick={() => goTo(1)}
              className="absolute right-0 z-10 translate-x-1 transition-transform hover:scale-110"
              style={{ color: "var(--color-accent-2)" }}
            >
              <ChevronIcon direction="right" />
            </button>
          )}
        </div>
      )}

      {pageCount > 1 && (
        <div className="flex justify-center gap-2">
          {data.map((_, index) => (
            <button
              key={index}
              type="button"
              aria-label={`Ir a la página ${index + 1}`}
              onClick={() => setPageIndex(index)}
              className="h-2 w-2 rounded-full transition-opacity"
              style={{
                backgroundColor: index === currentIndex ? "var(--color-brand)" : "var(--color-ink-muted)",
                opacity: index === currentIndex ? 1 : 0.4,
              }}
            />
          ))}
        </div>
      )}

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

      <SkillCategoriesPanel
        categories={categories}
        onChange={setCategories}
        isDraft={categoriesIsDraft}
        status={categoriesStatus}
        message={categoriesMessage}
        onSaveDraft={handleSaveCategoriesDraft}
        onPublish={handlePublishCategories}
      />
    </div>
  );
}
