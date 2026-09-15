import { useState } from "react";

interface Props {
  value: string[];
  onChange: (next: string[]) => void;
}

/** Editor de `techStack`: chips con botón de quitar + input para agregar (044). */
export default function TagListEditor({ value, onChange }: Props) {
  const [draft, setDraft] = useState("");

  function addTag() {
    const tag = draft.trim();
    if (!tag) return;
    onChange([...value, tag]);
    setDraft("");
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {value.map((tag, index) => (
        <span key={`${tag}-${index}`} className="flex items-center gap-1 rounded-full bg-surface-muted px-3 py-1 text-sm text-ink">
          {tag}
          <button
            type="button"
            onClick={() => onChange(value.filter((_, i) => i !== index))}
            aria-label={`Quitar ${tag}`}
            className="text-ink-muted hover:text-ink"
          >
            ✕
          </button>
        </span>
      ))}
      <input
        type="text"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            addTag();
          }
        }}
        placeholder="Agregar tecnología…"
        className="w-40 rounded-full border border-ink-muted/30 bg-transparent px-3 py-1 text-sm"
      />
    </div>
  );
}
