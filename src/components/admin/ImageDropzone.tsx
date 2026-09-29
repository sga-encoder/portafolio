import { useEffect, useRef, useState, type DragEvent, type KeyboardEvent, type MouseEvent } from "react";

interface Props {
  file: File | null;
  onChange: (file: File | null) => void;
  disabled?: boolean;
  /** Variante chica para espacios angostos (tarjeta de "Reemplazar" en `/admin/imagenes`). */
  compact?: boolean;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Zona de arrastrar y soltar (089) que reemplaza el `<input type="file">` nativo en los puntos de
 * subida del panel. Solo selecciona el archivo — la subida sigue siendo explícita con el botón de
 * cada formulario, porque `addImage` hace un commit real del manifest.
 */
export default function ImageDropzone({ file, onChange, disabled = false, compact = false }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  // Contador en vez de booleano: `dragleave` dispara al pasar sobre cada hijo de la zona, y con un
  // booleano el resaltado parpadea.
  const dragDepth = useRef(0);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setPreview(null);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  // Sin esto, soltar una imagen unos píxeles fuera de la zona hace que el navegador la abra y
  // abandone el panel (perdiendo lo que se estaba editando).
  useEffect(() => {
    const block = (event: globalThis.DragEvent) => event.preventDefault();
    window.addEventListener("dragover", block);
    window.addEventListener("drop", block);
    return () => {
      window.removeEventListener("dragover", block);
      window.removeEventListener("drop", block);
    };
  }, []);

  function pick(candidate: File | undefined) {
    if (!candidate) return;
    if (!candidate.type.startsWith("image/")) {
      setError("Solo se aceptan imágenes.");
      return;
    }
    setError(null);
    onChange(candidate);
  }

  function openPicker() {
    if (!disabled) inputRef.current?.click();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openPicker();
    }
  }

  function handleDragEnter(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    if (disabled) return;
    dragDepth.current += 1;
    setDragging(true);
  }

  function handleDragLeave(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    dragDepth.current = Math.max(0, dragDepth.current - 1);
    if (dragDepth.current === 0) setDragging(false);
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    event.dataTransfer.dropEffect = disabled ? "none" : "copy";
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    dragDepth.current = 0;
    setDragging(false);
    if (disabled) return;
    pick(event.dataTransfer.files[0]);
  }

  function clear(event: MouseEvent) {
    event.stopPropagation();
    setError(null);
    onChange(null);
  }

  const stateClasses = dragging
    ? "border-brand bg-brand/10"
    : "border-ink-muted/40 hover:border-brand/60 hover:bg-brand/5";

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled}
      aria-label={file ? `Imagen elegida: ${file.name}. Click para cambiarla.` : "Elegir imagen"}
      onClick={openPicker}
      onKeyDown={handleKeyDown}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={`flex w-full cursor-pointer items-center rounded-xl border-2 border-dashed text-left transition-colors focus-visible:outline-2 focus-visible:outline-brand ${stateClasses} ${
        compact ? "gap-2 p-2 text-xs" : "gap-3 p-4 text-sm"
      } ${disabled ? "pointer-events-none opacity-50" : ""}`}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(event) => pick(event.target.files?.[0])}
      />

      {file && preview ? (
        <>
          <img
            src={preview}
            alt=""
            className={`shrink-0 rounded-lg object-cover ${compact ? "h-10 w-10" : "h-16 w-16"}`}
          />
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium" title={file.name}>
              {file.name}
            </p>
            <p className="text-ink-muted">{formatSize(file.size)}</p>
          </div>
          <button
            type="button"
            onClick={clear}
            className="shrink-0 rounded-lg bg-red-500/20 px-2 py-1 text-xs text-red-400"
          >
            Quitar
          </button>
        </>
      ) : (
        <>
          <svg
            viewBox="0 0 24 24"
            width={compact ? 18 : 28}
            height={compact ? 18 : 28}
            aria-hidden="true"
            className={`shrink-0 ${dragging ? "text-brand" : "text-ink-muted"}`}
          >
            <path
              d="M12 16V4m0 0l-4 4m4-4l4 4M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <div className="min-w-0 flex-1">
            <p className="font-medium">
              {dragging ? "Suelta la imagen aquí" : "Arrastra una imagen o haz click para elegir"}
            </p>
            {error ? (
              <p className="text-red-400">{error}</p>
            ) : (
              !compact && <p className="text-ink-muted">PNG, JPG, WebP, GIF, SVG…</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
