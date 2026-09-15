interface CopyItem {
  value: string;
  label?: string;
}

interface Props {
  value: CopyItem[];
  onChange: (next: CopyItem[]) => void;
  color: string;
}

/** Lista de copy-chips de un paso (`steps[].copyText`) — agregar/quitar/editar (044). */
export default function CopyListEditor({ value, onChange, color }: Props) {
  function update(index: number, patch: Partial<CopyItem>) {
    onChange(value.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  return (
    <div className="flex flex-col gap-2">
      {value.map((item, index) => (
        <div
          key={index}
          className="flex flex-wrap items-center gap-2 rounded-lg p-2"
          style={{ border: `1px solid ${color}`, backgroundColor: `color-mix(in srgb, ${color} 12%, transparent)` }}
        >
          <input
            type="text"
            value={item.label ?? ""}
            onChange={(event) => update(index, { label: event.target.value })}
            placeholder="Label (opcional)"
            className="w-28 rounded bg-transparent px-2 py-1 text-xs uppercase"
          />
          <input
            type="text"
            value={item.value}
            onChange={(event) => update(index, { value: event.target.value })}
            placeholder="Valor a copiar"
            className="min-w-0 flex-1 rounded bg-transparent px-2 py-1 font-mono text-sm"
          />
          <button
            type="button"
            onClick={() => onChange(value.filter((_, i) => i !== index))}
            aria-label="Quitar copy"
            className="text-ink-muted hover:text-ink"
          >
            ✕
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...value, { value: "", label: "" }])}
        className="w-fit rounded-full border border-dashed border-ink-muted/40 px-3 py-1 text-xs text-ink-muted hover:border-ink-muted"
      >
        + copy
      </button>
    </div>
  );
}
