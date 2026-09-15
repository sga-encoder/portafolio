import EditableImage from "./EditableImage";

interface Props {
  value: string[];
  onChange: (next: string[]) => void;
  alt: string;
}

/** Grilla de imágenes de `gallery`: cada una editable + recuadro "+" para agregar (044). */
export default function GalleryEditor({ value, onChange, alt }: Props) {
  function update(index: number, key: string) {
    onChange(value.map((item, i) => (i === index ? key : item)));
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
      {value.map((key, index) => (
        <EditableImage
          key={index}
          value={key}
          alt={alt}
          className="aspect-video"
          onChange={(next) => update(index, next)}
          onRemove={() => onChange(value.filter((_, i) => i !== index))}
        />
      ))}
      <button
        type="button"
        onClick={() => onChange([...value, ""])}
        className="flex aspect-video items-center justify-center rounded-2xl border-2 border-dashed border-ink-muted/30 text-3xl text-ink-muted hover:border-ink-muted hover:text-ink"
        aria-label="Agregar imagen a la galería"
      >
        +
      </button>
    </div>
  );
}
