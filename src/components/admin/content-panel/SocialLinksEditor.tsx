import type { SocialLink, SocialPlatform } from "../../../data/profile";

interface Props {
  value: SocialLink[];
  onChange: (next: SocialLink[]) => void;
}

const PLATFORMS: { value: SocialPlatform; label: string }[] = [
  { value: "instagram", label: "Instagram" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "email", label: "Email" },
];

/** Lista editable de `about.social[]` (064) — mismo patrón de fila que `ButtonsListEditor.tsx`, con un `<select>` de plataforma. */
export default function SocialLinksEditor({ value, onChange }: Props) {
  function update(index: number, patch: Partial<SocialLink>) {
    onChange(value.map((link, i) => (i === index ? { ...link, ...patch } : link)));
  }

  return (
    <div className="flex flex-col gap-2">
      {value.map((link, index) => (
        <div key={index} className="flex flex-wrap items-center gap-2 rounded-lg border border-dashed border-ink-muted/30 p-2">
          <select
            value={link.platform}
            onChange={(event) => update(index, { platform: event.target.value as SocialPlatform })}
            className="rounded-lg border border-ink-muted/30 bg-transparent px-2 py-1 text-sm"
          >
            {PLATFORMS.map((platform) => (
              <option key={platform.value} value={platform.value}>
                {platform.label}
              </option>
            ))}
          </select>
          <input
            type="text"
            value={link.label}
            onChange={(event) => update(index, { label: event.target.value })}
            placeholder="Texto visible"
            className="w-40 rounded-lg border border-ink-muted/30 bg-transparent px-2 py-1 text-sm"
          />
          <input
            type="text"
            value={link.href}
            onChange={(event) => update(index, { href: event.target.value })}
            placeholder="https:// o mailto:…"
            className="min-w-0 flex-1 rounded-lg border border-ink-muted/30 bg-transparent px-2 py-1 text-xs"
          />
          <button
            type="button"
            onClick={() => onChange(value.filter((_, i) => i !== index))}
            aria-label="Quitar enlace"
            className="text-ink-muted hover:text-ink"
          >
            ✕
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...value, { platform: "instagram", label: "", href: "" }])}
        className="w-fit rounded-full border border-dashed border-ink-muted/40 px-3 py-1 text-xs text-ink-muted hover:border-ink-muted"
      >
        + Agregar enlace
      </button>
    </div>
  );
}
