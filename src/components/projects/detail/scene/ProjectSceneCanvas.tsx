import { Canvas } from "@react-three/fiber";
import ProjectSceneContent from "./ProjectSceneContent";

interface Props {
  colorA: string;
  colorB: string;
}

/**
 * El `<Canvas>` real de R3F. Vive en su propio archivo para que `ProjectScene3D.tsx`
 * pueda cargarlo con `React.lazy`: así el bundle de `three`/R3F solo se descarga
 * cuando el gate decide que la escena puede montarse (mismo mecanismo que
 * `SceneCanvas.tsx` de Inicio).
 */
export default function ProjectSceneCanvas({ colorA, colorB }: Props) {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 bg-surface" aria-hidden="true">
      <Canvas dpr={[1, 1.5]} camera={{ position: [0, 0, 6], fov: 45, near: 0.1, far: 100 }}>
        <ProjectSceneContent colorA={colorA} colorB={colorB} />
      </Canvas>
    </div>
  );
}
