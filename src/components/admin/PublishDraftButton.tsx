import { useEffect, useRef, useState } from "react";
import { loadContent, publish } from "../../lib/admin/drafts";

interface Props {
  slug: string;
  title: string;
  hasPendingDraft: boolean;
  onPublished: () => void;
}

type Status = "idle" | "publishing" | "error";

// Botón "Publicar borrador" por tarjeta de /admin/proyectos (058). La modal
// de confirmación usa `.admin-confirm-dialog` (global.css), calco visual de
// `.like-dialog` de ProjectLikeButton.astro — mismo mecanismo de cierre
// animado (clase `is-closing` + esperar `animationend` antes de
// `dialog.close()`), portado a refs de React en vez de `querySelector`
// global porque este componente vive en un island, no en un script vanilla.
export default function PublishDraftButton({ slug, title, hasPendingDraft, onPublished }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    function onCancel(event: Event) {
      event.preventDefault();
      closeAnimated();
    }

    dialog.addEventListener("cancel", onCancel);
    return () => dialog.removeEventListener("cancel", onCancel);
  }, []);

  function closeAnimated() {
    const dialog = dialogRef.current;
    if (!dialog || dialog.classList.contains("is-closing")) return;
    dialog.classList.add("is-closing");
    const onEnd = () => {
      dialog.removeEventListener("animationend", onEnd);
      dialog.classList.remove("is-closing");
      dialog.close();
    };
    dialog.addEventListener("animationend", onEnd);
  }

  function openConfirm(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    setStatus("idle");
    setErrorMessage(null);
    dialogRef.current?.showModal();
  }

  async function handleConfirm() {
    setStatus("publishing");
    setErrorMessage(null);
    try {
      const { content, sha } = await loadContent(slug);
      await publish(slug, content, sha);
      closeAnimated();
      onPublished();
    } catch (err) {
      console.error(`No se pudo publicar el borrador de ${slug}`, err);
      setStatus("error");
      setErrorMessage(`No se pudo publicar: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  if (!hasPendingDraft) return null;

  return (
    <>
      <button
        type="button"
        onClick={openConfirm}
        className="absolute top-2 right-2 z-10 rounded-full bg-brand px-3 py-1 text-xs font-medium text-brand-contrast shadow"
      >
        Publicar borrador
      </button>

      <dialog ref={dialogRef} className="admin-confirm-dialog">
        <div className="flex flex-col gap-4">
          <h2 className="font-display text-lg font-bold">Publicar borrador</h2>
          <p className="font-body text-sm text-ink-muted">
            ¿Publicar los cambios pendientes de <strong className="text-ink">{title}</strong>? Esto hace un commit
            real al repositorio.
          </p>
          {errorMessage && <p className="text-sm text-red-400">{errorMessage}</p>}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => closeAnimated()}
              disabled={status === "publishing"}
              className="font-body text-sm text-ink-muted disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={status === "publishing"}
              className="rounded-full bg-brand px-4 py-2 font-body text-sm font-semibold text-brand-contrast disabled:opacity-60"
            >
              {status === "publishing" ? "Publicando…" : "Publicar"}
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}
