import { useState } from "react";
import EditableImage from "./EditableImage";
import ImageLabelControl from "./ImageLabelControl";

interface GalleryImageItem {
  image: string;
  label?: string;
}

interface Props {
  value: GalleryImageItem[];
  onChange: (next: GalleryImageItem[]) => void;
  alt: string;
}

function ChevronIcon({ direction }: { direction: "left" | "right" }) {
  const points = direction === "left" ? "15 5 7 12 15 19" : "9 5 17 12 9 19";
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" aria-hidden="true">
      <polyline points={points} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * Vista principal tipo carrusel (réplica visual de `ProjectGallery.tsx`, el carrusel real de
 * `/proyectos/[slug]`) + pila de miniaturas a la derecha para elegir cuál mostrar como principal
 * (044, rediseño estético 063). Cada imagen es `{ image, label? }` (064): la imagen principal
 * lleva además `ImageLabelControl` para agregar/editar/quitar su etiqueta; cada miniatura
 * conserva ✎/✕ de `EditableImage` y, si ya tiene etiqueta, un badge de solo lectura con el texto.
 */
export default function GalleryEditor({ value, onChange, alt }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const safeIndex = value.length ? Math.min(activeIndex, value.length - 1) : 0;

  function update(index: number, image: string) {
    onChange(value.map((item, i) => (i === index ? { ...item, image } : item)));
  }

  function updateLabel(index: number, label: string | undefined) {
    onChange(value.map((item, i) => (i === index ? { ...item, label } : item)));
  }

  function removeAt(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  function addImage() {
    setActiveIndex(value.length);
    onChange([...value, { image: "" }]);
  }

  function goTo(delta: number) {
    setActiveIndex((safeIndex + delta + value.length) % value.length);
  }

  if (value.length === 0) {
    return (
      <button
        type="button"
        onClick={addImage}
        className="flex aspect-video w-full items-center justify-center rounded-2xl border-2 border-dashed border-ink-muted/30 text-3xl text-ink-muted hover:border-ink-muted hover:text-ink"
        aria-label="Agregar imagen a la galería"
      >
        +
      </button>
    );
  }

  const activeItem = value[safeIndex];

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_160px]">
      {/* Vista principal (carrusel) */}
      <div className="relative">
        <EditableImage
          value={activeItem.image}
          alt={alt}
          className="aspect-video w-full"
          onChange={(next) => update(safeIndex, next)}
          onRemove={() => removeAt(safeIndex)}
        />
        <ImageLabelControl label={activeItem.label} onChange={(label) => updateLabel(safeIndex, label)} />
        {value.length > 1 && (
          <>
            <button
              type="button"
              aria-label="Imagen anterior"
              onClick={() => goTo(-1)}
              className="absolute left-2 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white transition hover:bg-black/70"
            >
              <ChevronIcon direction="left" />
            </button>
            <button
              type="button"
              aria-label="Siguiente imagen"
              onClick={() => goTo(1)}
              className="absolute right-2 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white transition hover:bg-black/70"
            >
              <ChevronIcon direction="right" />
            </button>
          </>
        )}
      </div>

      {/* Pila de miniaturas */}
      <div className="flex gap-2 overflow-x-auto md:flex-col md:overflow-x-visible md:overflow-y-auto md:pr-1">
        <button
          type="button"
          onClick={addImage}
          className="flex aspect-video w-28 shrink-0 items-center justify-center rounded-xl border-2 border-dashed border-ink-muted/30 text-2xl text-ink-muted hover:border-ink-muted hover:text-ink md:w-full"
          aria-label="Agregar imagen a la galería"
        >
          +
        </button>
        {value.map((item, index) => (
          <div
            key={index}
            role="button"
            tabIndex={0}
            onClick={() => setActiveIndex(index)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                setActiveIndex(index);
              }
            }}
            aria-label={`Ver imagen ${index + 1} en la vista principal`}
            aria-pressed={index === safeIndex}
            className={`relative aspect-video w-28 shrink-0 cursor-pointer overflow-hidden rounded-xl ring-2 transition md:w-full ${
              index === safeIndex ? "ring-brand" : "ring-transparent hover:ring-ink-muted/40"
            }`}
          >
            <EditableImage value={item.image} alt={alt} className="h-full w-full" onChange={(next) => update(index, next)} onRemove={() => removeAt(index)} />
            {item.label && (
              <span className="pointer-events-none absolute inset-x-0 bottom-0 truncate bg-black/60 px-1.5 py-0.5 text-[10px] text-white">
                {item.label}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
