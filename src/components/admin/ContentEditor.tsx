import { useEffect, useState } from "react";
import { loadContent, publish, saveDraft } from "../../lib/admin/drafts";
import { parseFrontmatter, serializeFrontmatter } from "../../lib/admin/frontmatter";
import ProjectEditorLayout, { type ProjectFrontmatter } from "./content-editor/ProjectEditorLayout";
import AdminGate from "./AdminGate";
import type { ProjectCardData } from "../../lib/admin/projectCards";

interface Props {
  slug: string;
  switcherProjects: ProjectCardData[];
  /** `/admin/proyectos/nuevo` (062): arranca vacío, sin cargar contenido, con slug editable. */
  isNew?: boolean;
}

type Status = "idle" | "loading" | "saving" | "publishing" | "error";

const EMPTY_FRONTMATTER: ProjectFrontmatter = {
  title: "",
  summary: "",
  coverImage: "",
  gallery: [],
  techStack: [],
  platforms: [],
  links: {},
  steps: [],
};

const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/**
 * Usada en `onChange`: NO recorta el guion final, para no borrar el separador de palabra que el
 * usuario acaba de escribir (ej. tras un espacio) antes de que teclee la siguiente — si se recortara
 * en cada tecla, "Prueba Slug" quedaría "pruebaslug" en vez de "prueba-slug" porque el guion
 * intermedio desaparecería justo antes de escribir la letra siguiente. `finalizeSlug` (onBlur) hace
 * la limpieza completa.
 */
function slugifyLive(raw: string): string {
  return raw
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+/g, "");
}

function finalizeSlug(raw: string): string {
  return slugifyLive(raw).replace(/-+$/g, "");
}

/**
 * El editor visual trabaja con YAML crudo, sin pasar por el schema Zod de `content.config.ts` (eso
 * solo corre al build) — a diferencia de la carga por Astro, acá cualquier campo opcional/con
 * default en el schema (`gallery`, `techStack`, `links`, `steps[].buttons`, …) puede llegar
 * `undefined` si el `.md` real no lo declara explícitamente. Sin esto, un campo así rompía el
 * render (`value.map is not a function`) con toda la página en blanco y sin ningún mensaje — ahora
 * se normaliza al mismo shape que ya asume el resto del editor. Si falta `title` (la única señal
 * confiable de que el frontmatter se parseó de verdad), se trata como carga fallida.
 */
function normalizeFrontmatter(raw: Record<string, unknown>): ProjectFrontmatter {
  if (typeof raw.title !== "string") {
    throw new Error("Frontmatter inválido: no se encontró 'title'.");
  }
  const links = raw.links && typeof raw.links === "object" ? (raw.links as Record<string, unknown>) : {};
  const steps = Array.isArray(raw.steps) ? raw.steps : [];
  // `...raw` primero: preserva cualquier campo que este editor no conoce (ej. `servers` de otra
  // feature en paralelo) tal cual venía, en vez de perderlo al reserializar.
  return {
    ...raw,
    title: raw.title,
    summary: typeof raw.summary === "string" ? raw.summary : "",
    coverImage: typeof raw.coverImage === "string" ? raw.coverImage : "",
    gallery: Array.isArray(raw.gallery) ? raw.gallery : [],
    techStack: Array.isArray(raw.techStack) ? raw.techStack : [],
    platforms: Array.isArray(raw.platforms) ? raw.platforms : [],
    links: { repo: typeof links.repo === "string" ? links.repo : undefined, demo: typeof links.demo === "string" ? links.demo : undefined },
    steps: steps.map((step) => {
      const s = step && typeof step === "object" ? (step as Record<string, unknown>) : {};
      // Compat: un borrador en Firestore guardado antes de la migración de 044 puede seguir en el
      // formato viejo (`actionLabel`/`actionHref` sueltos en vez de `buttons[]`) — se convierte acá
      // en vez de perderlo silenciosamente.
      const legacyButtons =
        typeof s.actionLabel === "string" && typeof s.actionHref === "string"
          ? [{ label: s.actionLabel, href: s.actionHref }]
          : [];
      return {
        text: typeof s.text === "string" ? s.text : "",
        copyText: Array.isArray(s.copyText) ? s.copyText : [],
        buttons: Array.isArray(s.buttons) ? s.buttons : legacyButtons,
      };
    }),
    sphereColors: Array.isArray(raw.sphereColors) ? (raw.sphereColors as [string, string]) : undefined,
    sphereMovement:
      raw.sphereMovement && typeof raw.sphereMovement === "object"
        ? (raw.sphereMovement as ProjectFrontmatter["sphereMovement"])
        : undefined,
  } as ProjectFrontmatter;
}

/**
 * Limpia entradas a medio llenar antes de guardar/publicar (ej. un recuadro de galería "+" sin
 * imagen elegida todavía, o un botón/copy agregado y dejado vacío) — evita escribir Markdown que el
 * schema Zod rechazaría al build. No sustituye la validación real (sigue faltando en el cliente,
 * limitación ya documentada en 043), solo evita el caso más obvio de "olvidé completarlo".
 */
function cleanFrontmatter(data: ProjectFrontmatter): ProjectFrontmatter {
  return {
    ...data,
    gallery: data.gallery.filter(Boolean),
    steps: data.steps.map((step) => ({
      ...step,
      buttons: step.buttons?.filter((button) => button.label.trim() && button.href.trim()),
      copyText: step.copyText?.filter((item) => item.value.trim()),
    })),
    servers: data.servers?.filter((server) => server.id.trim() && server.name.trim()),
  };
}

// Ver DashboardPanel.tsx: separado de ContentEditor para que la carga desde
// GitHub/Firestore solo corra una vez que AdminGate confirmó sesión.
function ContentEditorContent({ slug: initialSlug, isNew }: { slug: string; isNew?: boolean }) {
  const [slug, setSlug] = useState(initialSlug);
  const [data, setData] = useState<ProjectFrontmatter | null>(isNew ? EMPTY_FRONTMATTER : null);
  const [body, setBody] = useState("");
  const [sha, setSha] = useState<string | null>(null);
  const [isDraft, setIsDraft] = useState(false);
  const [status, setStatus] = useState<Status>(isNew ? "idle" : "loading");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isNew) return; // arranca vacío, nada que traer de GitHub/Firestore todavía.
    let cancelled = false;
    setStatus("loading");
    loadContent(slug)
      .then((loaded) => {
        if (cancelled) return;
        const parsed = parseFrontmatter(loaded.content);
        setData(normalizeFrontmatter(parsed.data));
        setBody(parsed.body);
        setSha(loaded.sha);
        setIsDraft(loaded.isDraft);
        setStatus("idle");
      })
      .catch((err) => {
        console.error(err);
        if (!cancelled) {
          setStatus("error");
          setMessage("No se pudo cargar el contenido.");
        }
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNew ? null : slug]);

  function currentContent(): string {
    if (!data) return "";
    return serializeFrontmatter({ data: cleanFrontmatter(data), body });
  }

  function slugError(): string | null {
    if (!isNew) return null;
    if (!slug.trim()) return "Elegí un identificador (slug) antes de guardar.";
    if (!SLUG_RE.test(slug)) return "El slug solo puede tener minúsculas, números y guiones (ej. mi-proyecto-nuevo).";
    return null;
  }

  async function handleSaveDraft() {
    const err = slugError();
    if (err) {
      setMessage(err);
      return;
    }
    setStatus("saving");
    setMessage(null);
    try {
      await saveDraft(slug, currentContent());
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
    const err = slugError();
    if (err) {
      setMessage(err);
      return;
    }
    setStatus("publishing");
    setMessage(null);
    try {
      await publish(slug, currentContent(), sha);
      setIsDraft(false);
      setStatus("idle");
      setMessage("Publicado.");
    } catch (err) {
      console.error(err);
      setStatus("error");
      setMessage(`No se pudo publicar: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  const disabled = status === "loading" || status === "saving" || status === "publishing" || (isNew && slugError() != null);

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-display font-bold">{isNew ? slug || "Nuevo proyecto" : slug}</h1>
        {isDraft && <span className="rounded-full bg-brand/20 px-3 py-1 text-xs text-brand">Borrador sin publicar</span>}
      </div>

      {isNew && (
        <div className="mb-6">
          <label htmlFor="new-project-slug" className="mb-1 block text-sm font-medium text-ink-muted">
            Identificador (slug)
          </label>
          <input
            id="new-project-slug"
            type="text"
            value={slug}
            onChange={(e) => setSlug(slugifyLive(e.target.value))}
            onBlur={(e) => setSlug(finalizeSlug(e.target.value))}
            placeholder="mi-proyecto-nuevo"
            className="w-full max-w-sm rounded-lg border border-ink-muted/30 bg-surface px-3 py-2 text-sm"
          />
          <p className="mt-1 text-xs text-ink-muted">Define el archivo `src/content/projects/{slug || "…"}.md` al publicar.</p>
        </div>
      )}

      {status === "loading" && <p className="text-ink-muted">Cargando…</p>}

      {data && (
        <ProjectEditorLayout data={data} body={body} onChangeData={setData} onChangeBody={setBody} />
      )}

      <div className="mt-4 flex items-center gap-3">
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
    </>
  );
}

export default function ContentEditor({ slug, switcherProjects, isNew }: Props) {
  return (
    <AdminGate active="proyectos" wide switcherProjects={switcherProjects} currentSlug={isNew ? undefined : slug}>
      <ContentEditorContent slug={slug} isNew={isNew} />
    </AdminGate>
  );
}
