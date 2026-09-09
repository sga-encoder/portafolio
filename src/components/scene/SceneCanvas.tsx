import { Canvas } from "@react-three/fiber";
import SceneContent from "./SceneContent";

/**
 * El `<Canvas>` real de R3F. Vive en su propio archivo para que `Scene3D.tsx`
 * pueda cargarlo con `React.lazy`: así el bundle de `three`/R3F solo se
 * descarga cuando el gate decide que la escena puede montarse.
 */
export default function SceneCanvas() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 bg-surface" aria-hidden="true">
      <Canvas dpr={[1, 1.5]} camera={{ position: [0, 0, 6], fov: 45, near: 0.1, far: 100 }}>
        <SceneContent />
      </Canvas>
    </div>
  );
}
