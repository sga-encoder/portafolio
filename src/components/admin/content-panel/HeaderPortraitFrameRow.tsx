import EditableImage from "../content-editor/EditableImage";
import type { HeaderPortraitFrame, PortraitWordSide } from "../../../data/profile";

interface Props {
  frame: HeaderPortraitFrame;
  onChange: (next: HeaderPortraitFrame) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
  canRemove: boolean;
}

interface SideToggleProps {
  label: string;
  value: PortraitWordSide;
  onChange: (side: PortraitWordSide) => void;
}

/** Selector izquierda/derecha del lado de la palabra (094), visto de frente a la foto. */
function SideToggle({ label, value, onChange }: SideToggleProps) {
  return (
    <div
      className="flex items-center gap-1 text-xs text-ink-muted"
      role="group"
      aria-label={`Lado de la palabra en ${label}`}
    >
      <span className="w-10">{label}</span>
      {(["left", "right"] as const).map((side) => (
        <button
          key={side}
          type="button"
          onClick={() => onChange(side)}
          aria-pressed={value === side}
          title={side === "left" ? "Izquierda" : "Derecha"}
          className={`h-6 w-7 rounded-md ${
            value === side ? "bg-brand text-white" : "bg-surface-muted hover:text-ink"
          }`}
        >
          {side === "left" ? "◀" : "▶"}
        </button>
      ))}
    </div>
  );
}

/**
 * Fila editable de un frame del retrato rotativo del Header (079): imagen (mismo `EditableImage`/
 * `CloudinaryPicker` que `SkillRow`/068) + palabra + lado de la palabra en PC/móvil (094) +
 * reordenar + quitar, mismo espíritu que `SkillRow.tsx`.
 */
export default function HeaderPortraitFrameRow({
  frame,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
  canRemove,
}: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg bg-surface p-2">
      <EditableImage
        value={frame.imageKey}
        onChange={(imageKey) => onChange({ ...frame, imageKey })}
        alt={frame.word || "Frame del retrato del Header"}
        className="h-16 w-16 shrink-0"
      />

      <input
        type="text"
        value={frame.word}
        onChange={(event) => onChange({ ...frame, word: event.target.value })}
        placeholder="Palabra"
        aria-label="Palabra"
        className="min-w-0 flex-1 rounded-lg border border-ink-muted/30 bg-transparent px-3 py-2 text-sm"
      />

      <div className="flex shrink-0 flex-col gap-1">
        <SideToggle
          label="PC"
          value={frame.wordSideDesktop ?? "right"}
          onChange={(wordSideDesktop) => onChange({ ...frame, wordSideDesktop })}
        />
        <SideToggle
          label="Móvil"
          value={frame.wordSideMobile ?? "left"}
          onChange={(wordSideMobile) => onChange({ ...frame, wordSideMobile })}
        />
      </div>

      <div className="flex shrink-0 flex-col gap-0.5">
        <button
          type="button"
          onClick={onMoveUp}
          disabled={!canMoveUp}
          aria-label="Subir"
          title="Subir"
          className="flex h-5 w-5 items-center justify-center rounded-full bg-surface-muted text-[0.65rem] disabled:opacity-30"
        >
          ↑
        </button>
        <button
          type="button"
          onClick={onMoveDown}
          disabled={!canMoveDown}
          aria-label="Bajar"
          title="Bajar"
          className="flex h-5 w-5 items-center justify-center rounded-full bg-surface-muted text-[0.65rem] disabled:opacity-30"
        >
          ↓
        </button>
        <button
          type="button"
          onClick={onRemove}
          disabled={!canRemove}
          aria-label="Quitar frame"
          title="Quitar frame"
          className="flex h-5 w-5 items-center justify-center rounded-full bg-surface-muted text-[0.65rem] text-red-500 disabled:opacity-30"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
