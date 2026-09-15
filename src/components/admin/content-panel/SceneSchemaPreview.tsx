import type { SphereId } from "../../scene/sceneStops";
import type { ZoneStop } from "../../scene/engine/zoneStops";

interface Props {
  zone: ZoneStop<SphereId>;
  sphereIds: readonly SphereId[];
}

/** Rango real de `x`/`y` en `sceneStops.ts` (las esferas salen de pantalla a propósito). */
const AXIS_RANGE = 2.5;

/**
 * Esquema 2D estático (no Three.js) de las 3 esferas de la sección activa, en su pose `end` —
 * mismo approach "esquemático" que `SphereConfigPanel.tsx` (044), adaptado al rango `[-2.5, 2.5]`
 * de `sceneStops.ts` (vs. `[-1, 1]` del fondo de `/proyectos/[slug]`).
 */
export default function SceneSchemaPreview({ zone, sphereIds }: Props) {
  return (
    <div className="aspect-video w-full overflow-hidden rounded-xl bg-surface">
      <svg viewBox={`${-AXIS_RANGE} ${-AXIS_RANGE} ${AXIS_RANGE * 2} ${AXIS_RANGE * 2}`} className="h-full w-full">
        <rect x={-1} y={-1} width={2} height={2} fill="none" stroke="currentColor" strokeOpacity="0.15" />
        <line x1={-AXIS_RANGE} y1="0" x2={AXIS_RANGE} y2="0" stroke="currentColor" strokeOpacity="0.1" />
        <line x1="0" y1={-AXIS_RANGE} x2="0" y2={AXIS_RANGE} stroke="currentColor" strokeOpacity="0.1" />
        {sphereIds.map((id) => {
          const pose = zone.spheres[id].end;
          const [x, y] = pose.position;
          return (
            <circle
              key={id}
              cx={x}
              cy={-y}
              r={Math.max(pose.screenFraction * 0.3, 0.03)}
              fill={pose.color}
              opacity={0.75}
            />
          );
        })}
      </svg>
    </div>
  );
}
