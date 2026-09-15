import { useEffect, useState } from "react";
import { loadContent, publish, saveDraft } from "../../lib/admin/drafts";
import { parseFrontmatter, serializeFrontmatter } from "../../lib/admin/frontmatter";
import ProjectEditorLayout, { type ProjectFrontmatter } from "./content-editor/ProjectEditorLayout";
import AdminGate from "./AdminGate";

interface Props {
  slug: string;
}

type Status = "idle" | "loading" | "saving" | "publishing" | "error";

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
function ContentEditorContent({ slug }: Props) {
  const [data, setData] = useState<ProjectFrontmatter | null>(null);
  const [body, setBody] = useState("");
  const [sha, setSha] = useState<string | null>(null);
  const [isDraft, setIsDraft] = useState(false);
  const [status, setStatus] = useState<Status>("loading");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
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
  }, [slug]);

  function currentContent(): string {
    if (!data) return "";
    return serializeFrontmatter({ data: cleanFrontmatter(data), body });
  }

  async function handleSaveDraft() {
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

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-display font-bold">{slug}</h1>
        {isDraft && <span className="rounded-full bg-brand/20 px-3 py-1 text-xs text-brand">Borrador sin publicar</span>}
      </div>

      {status === "loading" && <p className="text-ink-muted">Cargando…</p>}

      {data && (
        <ProjectEditorLayout data={data} body={body} onChangeData={setData} onChangeBody={setBody} />
      )}

      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={handleSaveDraft}
          disabled={status === "loading" || status === "saving" || status === "publishing"}
          className="rounded-lg bg-surface-muted px-4 py-2 text-sm font-medium disabled:opacity-50"
        >
          {status === "saving" ? "Guardando…" : "Guardar borrador"}
        </button>
        <button
          type="button"
          onClick={handlePublish}
          disabled={status === "loading" || status === "saving" || status === "publishing"}
          className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {status === "publishing" ? "Publicando…" : "Publicar"}
        </button>
        {message && <span className="text-sm text-ink-muted">{message}</span>}
      </div>
    </>
  );
}

export default function ContentEditor({ slug }: Props) {
  return (
    <AdminGate active="contenido">
      <ContentEditorContent slug={slug} />
    </AdminGate>
  );
}
