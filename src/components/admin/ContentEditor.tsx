import { useEffect, useState } from "react";
import { loadContent, publish, saveDraft } from "../../lib/admin/drafts";
import AdminGate from "./AdminGate";

interface Props {
  slug: string;
}

type Status = "idle" | "loading" | "saving" | "publishing" | "error";

// Ver DashboardPanel.tsx: separado de ContentEditor para que la carga desde
// GitHub/Firestore solo corra una vez que AdminGate confirmó sesión.
function ContentEditorContent({ slug }: Props) {
  const [content, setContent] = useState("");
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
        setContent(loaded.content);
        setSha(loaded.sha);
        setIsDraft(loaded.isDraft);
        setStatus("idle");
      })
      .catch(() => {
        if (!cancelled) {
          setStatus("error");
          setMessage("No se pudo cargar el contenido.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  async function handleSaveDraft() {
    setStatus("saving");
    setMessage(null);
    try {
      await saveDraft(slug, content);
      setIsDraft(true);
      setStatus("idle");
      setMessage("Borrador guardado.");
    } catch {
      setStatus("error");
      setMessage("No se pudo guardar el borrador.");
    }
  }

  async function handlePublish() {
    setStatus("publishing");
    setMessage(null);
    try {
      await publish(slug, content, sha);
      setIsDraft(false);
      setStatus("idle");
      setMessage("Publicado.");
    } catch {
      setStatus("error");
      setMessage("No se pudo publicar.");
    }
  }

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-display font-bold">{slug}</h1>
        {isDraft && <span className="rounded-full bg-brand/20 px-3 py-1 text-xs text-brand">Borrador sin publicar</span>}
      </div>
      <textarea
        value={content}
        onChange={(event) => setContent(event.target.value)}
        disabled={status === "loading"}
        rows={24}
        className="w-full rounded-xl border border-ink-muted/30 bg-transparent p-4 font-mono text-sm"
      />
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
