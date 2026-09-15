import ButtonsListEditor from "./ButtonsListEditor";
import CopyListEditor from "./CopyListEditor";

interface CopyItem {
  value: string;
  label?: string;
}

interface ProjectButton {
  label: string;
  href: string;
}

interface Step {
  text: string;
  copyText?: CopyItem[];
  buttons?: ProjectButton[];
}

interface Props {
  value: Step[];
  onChange: (next: Step[]) => void;
  colors: [string, string];
}

const MAX_STEPS = 5;

/** Mirroa el layout real de `ProjectLiveSteps.astro`, con textarea/listas editables + recuadro "+" (044). */
export default function StepsEditor({ value, onChange, colors }: Props) {
  function update(index: number, patch: Partial<Step>) {
    onChange(value.map((step, i) => (i === index ? { ...step, ...patch } : step)));
  }

  function addStep() {
    if (value.length >= MAX_STEPS) return;
    onChange([...value, { text: "", copyText: [], buttons: [] }]);
  }

  return (
    <div className="flex h-full flex-col gap-4">
      <h2 className="font-display text-sm font-bold uppercase tracking-wide text-ink-muted">Cómo verlo en vivo</h2>

      <ol className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {value.map((step, index) => {
          const stepColor = index % 2 === 0 ? colors[0] : colors[1];
          return (
            <li key={index} className="flex flex-col gap-3 rounded-2xl bg-surface-muted p-4">
              <div className="flex items-start gap-3">
                <span
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-display text-sm font-bold text-white"
                  style={{ backgroundColor: stepColor }}
                >
                  {index + 1}
                </span>
                <textarea
                  value={step.text}
                  onChange={(event) => update(index, { text: event.target.value })}
                  rows={2}
                  placeholder="Texto del paso…"
                  className="min-w-0 flex-1 resize-none rounded-lg bg-transparent font-body text-sm text-ink-muted"
                />
                <button
                  type="button"
                  onClick={() => onChange(value.filter((_, i) => i !== index))}
                  disabled={value.length <= 1}
                  aria-label="Quitar paso"
                  className="text-ink-muted hover:text-ink disabled:opacity-30"
                >
                  ✕
                </button>
              </div>

              <CopyListEditor
                value={step.copyText ?? []}
                onChange={(copyText) => update(index, { copyText })}
                color={stepColor}
              />

              <ButtonsListEditor
                value={step.buttons ?? []}
                onChange={(buttons) => update(index, { buttons })}
                color={stepColor}
              />
            </li>
          );
        })}

        {value.length < MAX_STEPS && (
          <li>
            <button
              type="button"
              onClick={addStep}
              className="flex h-full min-h-24 w-full items-center justify-center rounded-2xl border-2 border-dashed border-ink-muted/30 text-3xl text-ink-muted hover:border-ink-muted hover:text-ink"
              aria-label="Agregar paso"
            >
              +
            </button>
          </li>
        )}
      </ol>
    </div>
  );
}
