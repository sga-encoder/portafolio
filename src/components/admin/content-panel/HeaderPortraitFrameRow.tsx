import EditableImage from "../content-editor/EditableImage";
import type { HeaderPortraitFrame } from "../../../data/profile";

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

/**
 * Fila editable de un frame del retrato rotativo del Header (079): imagen (mismo `EditableImage`/
 * `CloudinaryPicker` que `SkillRow`/068) + palabra + reordenar + quitar, mismo espíritu que
 * `SkillRow.tsx`.
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
    <div className="flex items-center gap-2 rounded-lg bg-surface p-2">
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
