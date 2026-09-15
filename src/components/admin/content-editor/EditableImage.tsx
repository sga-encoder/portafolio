import { useState } from "react";
import { getCloudinaryUrl } from "../../../utils/cloudinaryManifest";
import CloudinaryPicker from "./CloudinaryPicker";

interface Props {
  value: string;
  onChange: (key: string) => void;
  alt: string;
  className?: string;
  onRemove?: () => void;
}

function safeCloudinaryUrl(key: string): string | null {
  try {
    return getCloudinaryUrl(key, "w_600,q_auto,f_auto");
  } catch {
    // La clave puede ser de una imagen subida esta misma sesión, todavía no presente en el
    // manifest estático empaquetado al build — `localUrl` cubre ese caso mientras tanto.
    return null;
  }
}

/** Imagen fija con el ícono de editar en la esquina inferior derecha (044) — abre el `CloudinaryPicker`. */
export default function EditableImage({ value, onChange, alt, className, onRemove }: Props) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [localUrl, setLocalUrl] = useState<string | null>(null);

  const displayUrl = localUrl ?? (value ? safeCloudinaryUrl(value) : null);

  return (
    <div className={`group relative ${className ?? ""}`}>
      {displayUrl ? (
        <img src={displayUrl} alt={alt} className="h-full w-full rounded-2xl object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center rounded-2xl bg-surface-muted text-sm text-ink-muted">
          Sin imagen
        </div>
      )}

      <button
        type="button"
        onClick={() => setPickerOpen(true)}
        aria-label="Cambiar imagen"
        title="Cambiar imagen"
        className="absolute bottom-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-black/80"
      >
        ✎
      </button>

      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label="Quitar imagen"
          title="Quitar imagen"
          className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-xs text-white opacity-0 transition group-hover:opacity-100"
        >
          ✕
        </button>
      )}

      {pickerOpen && (
        <CloudinaryPicker
          onSelect={(key, url) => {
            setLocalUrl(url);
            onChange(key);
            setPickerOpen(false);
          }}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </div>
  );
}
