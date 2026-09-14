import { Canvas } from "@react-three/fiber";
import SceneContent, { type OnFrameCallback } from "./SceneContent";
import type { ResolvedZoneStop } from "./zoneStops";

interface Props {
  sphereIds: readonly string[];
  zoneStops: readonly ResolvedZoneStop[];
  sizeScale?: (aspect: number) => number;
  onFrame?: OnFrameCallback;
}

/**
 * El `<Canvas>` real de R3F, genérico para cualquier escenario. Vive en su propio archivo para
 * que `Scene3D.tsx` pueda cargarlo con `React.lazy`: así el bundle de `three`/R3F solo se
 * descarga cuando el gate decide que la escena puede montarse.
 */
export default function SceneCanvas({ sphereIds, zoneStops, sizeScale, onFrame }: Props) {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 bg-surface" aria-hidden="true">
      <Canvas dpr={[1, 1.5]} camera={{ position: [0, 0, 6], fov: 45, near: 0.1, far: 100 }}>
        <SceneContent sphereIds={sphereIds} zoneStops={zoneStops} sizeScale={sizeScale} onFrame={onFrame} />
      </Canvas>
    </div>
  );
}
