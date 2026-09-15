import type { SpherePose, SphereStop } from "../../scene/engine/zoneStops";

interface Props {
  label: string;
  stop: SphereStop;
  onChange: (next: SphereStop) => void;
}

function PoseFields({
  pose,
  onChange,
}: {
  pose: SpherePose;
  onChange: (next: SpherePose) => void;
}) {
  function setAxis(axis: "x" | "y", raw: string) {
    const numeric = Number(raw);
    if (Number.isNaN(numeric)) return;
    const [x, y, z] = pose.position;
    onChange({ ...pose, position: axis === "x" ? [numeric, y, z] : [x, numeric, z] });
  }

  function setScreenFraction(raw: string) {
    const numeric = Number(raw);
    if (Number.isNaN(numeric)) return;
    onChange({ ...pose, screenFraction: numeric });
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      <label className="flex items-center justify-between gap-2 text-xs text-ink-muted">
        X
        <input
          type="number"
          step="0.1"
          min="-2.5"
          max="2.5"
          value={pose.position[0]}
          onChange={(event) => setAxis("x", event.target.value)}
          className="w-20 rounded border border-ink-muted/30 bg-transparent px-2 py-1 text-right"
        />
      </label>
      <label className="flex items-center justify-between gap-2 text-xs text-ink-muted">
        Y
        <input
          type="number"
          step="0.1"
          min="-2.5"
          max="2.5"
          value={pose.position[1]}
          onChange={(event) => setAxis("y", event.target.value)}
          className="w-20 rounded border border-ink-muted/30 bg-transparent px-2 py-1 text-right"
        />
      </label>
      <label className="flex items-center justify-between gap-2 text-xs text-ink-muted">
        Tamaño
        <input
          type="number"
          step="0.05"
          min="0"
          max="2"
          value={pose.screenFraction}
          onChange={(event) => setScreenFraction(event.target.value)}
          className="w-20 rounded border border-ink-muted/30 bg-transparent px-2 py-1 text-right"
        />
      </label>
      <label className="flex items-center justify-between gap-2 text-xs text-ink-muted">
        Color
        <input
          type="color"
          value={pose.color}
          onChange={(event) => onChange({ ...pose, color: event.target.value })}
        />
      </label>
    </div>
  );
}

/** `end` por defecto para un `start` recién activado: parte del mismo punto de llegada. */
function poseFromDefault(end: SpherePose): SpherePose {
  return { position: [...end.position], screenFraction: end.screenFraction, color: end.color };
}

/**
 * Editor de una esfera (`a`/`b`/`c`) dentro de una sección (067): pose de llegada (`end`) siempre
 * visible + checkbox para activar/desactivar un punto de partida propio (`start`) — igual criterio
 * de granularidad que `SphereConfigPanel.tsx` (044), sin el concepto de override opcional (acá se
 * edita el valor real que consume `sceneStops.ts`).
 */
export default function SpherePoseEditor({ label, stop, onChange }: Props) {
  const hasOwnStart = stop.start != null;

  function toggleStart(checked: boolean) {
    if (checked) {
      onChange({ ...stop, start: poseFromDefault(stop.end) });
    } else {
      const { start: _start, ...rest } = stop;
      onChange(rest as SphereStop);
    }
  }

  return (
    <div className="space-y-3 rounded-xl bg-surface p-3">
      <span className="text-sm font-semibold">{label}</span>

      <div>
        <p className="mb-1 text-xs font-medium uppercase tracking-wide text-ink-muted/70">Llegada</p>
        <PoseFields pose={stop.end} onChange={(next) => onChange({ ...stop, end: next })} />
      </div>

      <label className="flex items-center gap-2 text-xs text-ink-muted">
        <input type="checkbox" checked={hasOwnStart} onChange={(event) => toggleStart(event.target.checked)} />
        Definir punto de partida propio
      </label>

      {hasOwnStart && stop.start && (
        <div>
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-ink-muted/70">Partida</p>
          <PoseFields
            pose={stop.start}
            onChange={(next) => onChange({ ...stop, start: next })}
          />
        </div>
      )}
    </div>
  );
}
