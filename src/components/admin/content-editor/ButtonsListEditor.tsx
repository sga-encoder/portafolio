interface ProjectButton {
  label: string;
  href: string;
}

interface Props {
  value: ProjectButton[];
  onChange: (next: ProjectButton[]) => void;
  color: string;
}

/** Lista de botones de acción de un paso (`steps[].buttons`) — agregar/quitar/editar (044). */
export default function ButtonsListEditor({ value, onChange, color }: Props) {
  function update(index: number, patch: Partial<ProjectButton>) {
    onChange(value.map((button, i) => (i === index ? { ...button, ...patch } : button)));
  }

  return (
    <div className="flex flex-col gap-2">
      {value.map((button, index) => (
        <div key={index} className="flex flex-wrap items-center gap-2 rounded-lg border border-dashed border-ink-muted/30 p-2">
          <input
            type="text"
            value={button.label}
            onChange={(event) => update(index, { label: event.target.value })}
            placeholder="Texto del botón"
            className="w-40 rounded-full px-3 py-1 text-sm font-semibold"
            style={{ border: `1px solid ${color}`, color }}
          />
          <input
            type="text"
            value={button.href}
            onChange={(event) => update(index, { href: event.target.value })}
            placeholder="https://…"
            className="min-w-0 flex-1 rounded-lg border border-ink-muted/30 bg-transparent px-2 py-1 text-xs"
          />
          <button
            type="button"
            onClick={() => onChange(value.filter((_, i) => i !== index))}
            aria-label="Quitar botón"
            className="text-ink-muted hover:text-ink"
          >
            ✕
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...value, { label: "Nuevo botón", href: "" }])}
        className="w-fit rounded-full border border-dashed border-ink-muted/40 px-3 py-1 text-xs text-ink-muted hover:border-ink-muted"
      >
        + botón
      </button>
    </div>
  );
}
