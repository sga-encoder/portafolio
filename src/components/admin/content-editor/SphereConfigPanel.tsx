import { useState } from "react";

interface SphereAxisOverride {
  x?: number;
  y?: number;
  screenFraction?: number;
}

type ZoneKey = "header" | "content" | "gallery";

interface SphereMovementOverride {
  header?: { a?: SphereAxisOverride; b?: SphereAxisOverride };
  content?: { a?: SphereAxisOverride; b?: SphereAxisOverride };
  gallery?: { a?: SphereAxisOverride; b?: SphereAxisOverride };
}

interface Props {
  sphereColors: [string, string] | undefined;
  autoColors: [string, string];
  onChangeColors: (colors: [string, string] | undefined) => void;
  sphereMovement: SphereMovementOverride | undefined;
  onChangeMovement: (movement: SphereMovementOverride | undefined) => void;
  /** Valores por defecto de `projectSceneStops.ts` (el `end` de cada zona/esfera), para mostrar
   * en la vista esquemática cuando no hay override — y como base al editar por primera vez. */
  defaults: Record<ZoneKey, { a: { x: number; y: number; screenFraction: number }; b: { x: number; y: number; screenFraction: number } }>;
}

const ZONES: { id: ZoneKey; label: string }[] = [
  { id: "header", label: "Encabezado" },
  { id: "content", label: "Contenido" },
  { id: "gallery", label: "Galería" },
];

/** Panel de override por proyecto del fondo 3D — colores + movimiento por zona/esfera (044). */
export default function SphereConfigPanel({
  sphereColors,
  autoColors,
  onChangeColors,
  sphereMovement,
  onChangeMovement,
  defaults,
}: Props) {
  const [zone, setZone] = useState<ZoneKey>("header");
  const colors = sphereColors ?? autoColors;
  const zoneOverride = sphereMovement?.[zone];
  const zoneDefaults = defaults[zone];

  function currentValue(sphere: "a" | "b", axis: "x" | "y" | "screenFraction"): number {
    return zoneOverride?.[sphere]?.[axis] ?? zoneDefaults[sphere][axis];
  }

  function setAxis(sphere: "a" | "b", axis: "x" | "y" | "screenFraction", raw: string) {
    const numeric = Number(raw);
    if (Number.isNaN(numeric)) return;
    const next: SphereMovementOverride = { ...sphereMovement };
    next[zone] = { ...next[zone], [sphere]: { ...next[zone]?.[sphere], [axis]: numeric } };
    onChangeMovement(next);
  }

  function resetZoneSphere(sphere: "a" | "b") {
    if (!sphereMovement?.[zone]) return;
    const nextZone = { ...sphereMovement[zone] };
    delete nextZone[sphere];
    const next: SphereMovementOverride = { ...sphereMovement, [zone]: nextZone };
    onChangeMovement(next);
  }

  return (
    <div className="flex flex-col gap-4 rounded-2xl bg-surface-muted p-4">
      <h2 className="font-display text-sm font-bold uppercase tracking-wide text-ink-muted">Fondo 3D del proyecto</h2>

      <div className="flex flex-wrap items-center gap-4">
        {(["0", "1"] as const).map((i) => {
          const index = Number(i) as 0 | 1;
          return (
            <label key={i} className="flex items-center gap-2 text-sm">
              Color {index === 0 ? "A" : "B"}
              <input
                type="color"
                value={colors[index]}
                onChange={(event) => {
                  const next: [string, string] = [...colors] as [string, string];
                  next[index] = event.target.value;
                  onChangeColors(next);
                }}
              />
            </label>
          );
        })}
        {sphereColors && (
          <button type="button" onClick={() => onChangeColors(undefined)} className="text-xs text-ink-muted underline">
            Usar automático (portada)
          </button>
        )}
      </div>

      <div className="flex gap-2">
        {ZONES.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => setZone(option.id)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${zone === option.id ? "bg-brand text-white" : "bg-surface"}`}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {(["a", "b"] as const).map((sphere) => (
          <div key={sphere} className="space-y-2 rounded-xl bg-surface p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">Esfera {sphere.toUpperCase()}</span>
              <button
                type="button"
                onClick={() => resetZoneSphere(sphere)}
                disabled={!zoneOverride?.[sphere]}
                className="text-xs text-ink-muted underline disabled:opacity-30"
              >
                Restablecer
              </button>
            </div>
            {(["x", "y", "screenFraction"] as const).map((axis) => (
              <label key={axis} className="flex items-center justify-between gap-2 text-xs text-ink-muted">
                {axis === "screenFraction" ? "Tamaño" : `Posición ${axis.toUpperCase()}`}
                <input
                  type="number"
                  step="0.05"
                  value={currentValue(sphere, axis)}
                  onChange={(event) => setAxis(sphere, axis, event.target.value)}
                  className="w-20 rounded border border-ink-muted/30 bg-transparent px-2 py-1 text-right"
                />
              </label>
            ))}
          </div>
        ))}
      </div>

      <svg viewBox="-1.5 -1.5 3 3" className="h-40 w-full rounded-xl bg-surface">
        <line x1="-1.5" y1="0" x2="1.5" y2="0" stroke="currentColor" strokeOpacity="0.15" />
        <line x1="0" y1="-1.5" x2="0" y2="1.5" stroke="currentColor" strokeOpacity="0.15" />
        {(["a", "b"] as const).map((sphere) => (
          <circle
            key={sphere}
            cx={currentValue(sphere, "x")}
            cy={-currentValue(sphere, "y")}
            r={Math.max(currentValue(sphere, "screenFraction") * 0.3, 0.05)}
            fill={sphere === "a" ? colors[0] : colors[1]}
            opacity={0.75}
          />
        ))}
      </svg>
      <p className="text-xs text-ink-muted">
        Vista esquemática de referencia (no es una réplica animada del motor 3D real).
      </p>
    </div>
  );
}
