import { useEffect, useRef, useState } from "react";
import type { ProjectCardData } from "../../../lib/admin/projectCards";

interface Props {
  options: ProjectCardData[];
  onAdd: (slug: string) => void;
}

const PAGE_SIZE = 6; // cuadrícula de hasta 3 columnas x 2 filas por página

function ChevronIcon({ direction }: { direction: "left" | "right" }) {
  const points = direction === "left" ? "15 5 7 12 15 19" : "9 5 17 12 9 19";
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" aria-hidden="true">
      <polyline points={points} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * Modal "Agregar proyecto" de la pestaña Carrusel (072, ajuste post-implementación pedido por el
 * usuario): trigger + `<dialog>` nativo, mismo mecanismo de cierre animado (`is-closing` +
 * `animationend`) que `PublishDraftButton.tsx`. Dentro, tarjetas verticales (imagen arriba,
 * título/año abajo) en `flex flex-wrap` — se acomodan solas hasta 3 por fila (`basis-1/3`) en vez
 * de una cuadrícula rígida, así que con pocas opciones ocupan menos filas sin celdas vacías —
 * paginadas de a `PAGE_SIZE = 6` (hasta 2 filas de 3) con flechas anterior/siguiente debajo del
 * grupo de tarjetas (deshabilitadas en los extremos, sin loop), no a los costados. Con
 * `options.length <= PAGE_SIZE` no hay paginación. Click en una tarjeta agrega ese proyecto y
 * cierra el modal directamente, sin un botón de confirmación aparte.
 */
export default function AddProjectModal({ options, onAdd }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [page, setPage] = useState(0);

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

  function openModal() {
    setPage(0);
    dialogRef.current?.showModal();
  }

  function handlePick(slug: string) {
    onAdd(slug);
    closeAnimated();
  }

  const totalPages = Math.ceil(options.length / PAGE_SIZE) || 1;
  const pageItems = options.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);
  const canPrev = page > 0;
  const canNext = page < totalPages - 1;

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        disabled={options.length === 0}
        className="flex aspect-square w-28 shrink-0 flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-ink-muted/30 text-ink-muted hover:border-ink-muted hover:text-ink disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-ink-muted/30 disabled:hover:text-ink-muted"
      >
        <span className="text-2xl leading-none">+</span>
        <span className="font-body text-xs">Agregar</span>
      </button>

      <dialog ref={dialogRef} className="admin-confirm-dialog admin-confirm-dialog--grid">
        <div className="flex flex-col gap-4">
          <h2 className="font-display text-lg font-bold">Agregar proyecto al carrusel</h2>

          {/* Tarjetas verticales (imagen arriba, texto abajo) en flex-wrap: se acomodan solas
              según el espacio disponible (hasta 3 por fila) en vez de una cuadrícula rígida —
              con pocas opciones simplemente ocupan menos filas, sin celdas vacías. */}
          <div className="flex flex-wrap justify-center gap-3">
            {pageItems.map((project) => (
              <button
                key={project.slug}
                type="button"
                onClick={() => handlePick(project.slug)}
                className="flex shrink-0 grow-0 basis-[calc(33.333%-0.5rem)] flex-col items-center gap-1 rounded-xl bg-surface-muted p-2 text-center transition-colors hover:bg-surface-muted/70"
              >
                {project.imageSrc ? (
                  <img
                    src={project.imageSrc}
                    alt={project.title}
                    className="aspect-square w-full rounded-lg object-cover"
                  />
                ) : (
                  <div className="flex aspect-square w-full items-center justify-center rounded-lg bg-surface text-xs text-ink-muted">
                    Sin imagen
                  </div>
                )}
                <span className="font-display text-xs font-bold leading-tight text-ink">{project.title}</span>
                <span className="font-body text-[11px] text-ink-muted">{project.date.slice(0, 4)}</span>
              </button>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setPage((p) => p - 1)}
                disabled={!canPrev}
                aria-label="Página anterior"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-muted text-ink-muted hover:text-ink disabled:opacity-30 disabled:hover:text-ink-muted"
              >
                <ChevronIcon direction="left" />
              </button>
              <span className="font-body text-xs text-ink-muted">
                Página {page + 1} de {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => p + 1)}
                disabled={!canNext}
                aria-label="Página siguiente"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-muted text-ink-muted hover:text-ink disabled:opacity-30 disabled:hover:text-ink-muted"
              >
                <ChevronIcon direction="right" />
              </button>
            </div>
          )}

          <div className="flex justify-end">
            <button type="button" onClick={() => closeAnimated()} className="font-body text-sm text-ink-muted">
              Cancelar
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}
