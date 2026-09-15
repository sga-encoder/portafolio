import { useState } from "react";

interface Props {
  label?: string;
  onChange: (label: string | undefined) => void;
}

/**
 * Etiqueta opcional por imagen de la galería (064), superpuesta en la esquina superior izquierda
 * de la imagen principal — `EditableImage` ya ocupa inferior-derecha (✎) y superior-derecha (✕),
 * así que esta esquina queda libre. Sin `label`: botón "+". Con `label`: pastilla + editar/quitar.
 */
export default function ImageLabelControl({ label, onChange }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(label ?? "");

  function startEdit() {
    setDraft(label ?? "");
    setEditing(true);
  }

  function save() {
    const trimmed = draft.trim();
    onChange(trimmed || undefined);
    setEditing(false);
  }

  if (editing) {
    return (
      <div className="absolute left-2 top-2 z-10 flex items-center gap-1" onClick={(event) => event.stopPropagation()}>
        <input
          autoFocus
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={save}
          onKeyDown={(event) => {
            if (event.key === "Enter") save();
            if (event.key === "Escape") setEditing(false);
          }}
          placeholder="Etiqueta…"
          className="w-36 rounded-full bg-black/70 px-3 py-1 text-xs text-white outline-none placeholder:text-white/50"
        />
      </div>
    );
  }

  if (label) {
    return (
      <div className="absolute left-2 top-2 z-10 flex items-center gap-1" onClick={(event) => event.stopPropagation()}>
        <span className="max-w-[9rem] truncate rounded-full bg-black/60 px-3 py-1 text-xs text-white">{label}</span>
        <button
          type="button"
          onClick={startEdit}
          aria-label="Editar etiqueta"
          title="Editar etiqueta"
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-black/60 text-xs text-white hover:bg-black/80"
        >
          ✎
        </button>
        <button
          type="button"
          onClick={() => onChange(undefined)}
          aria-label="Quitar etiqueta"
          title="Quitar etiqueta"
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-black/60 text-xs text-white hover:bg-black/80"
        >
          ✕
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        startEdit();
      }}
      aria-label="Agregar etiqueta"
      title="Agregar etiqueta"
      className="absolute left-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-sm text-white hover:bg-black/80"
    >
      +
    </button>
  );
}
