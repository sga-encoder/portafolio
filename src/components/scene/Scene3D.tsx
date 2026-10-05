import EngineScene3D from "./engine/Scene3D";
import type { SphereFrameState } from "./engine/SceneContent";
import { setSphereFrameVars, setStaticHeaderFrameVars } from "./headerFrameVars";
import { resolvedSceneStops, SPHERE_IDS } from "./sceneStops";
import { mobilePortraitSizeScale } from "./viewport";

function publishHomeSceneVars(spheres: readonly SphereFrameState[]): void {
  const a = spheres.find((sphere) => sphere.id === "a");
  const b = spheres.find((sphere) => sphere.id === "b");
  const c = spheres.find((sphere) => sphere.id === "c");
  if (!a || !b) return;
  setSphereFrameVars(document.documentElement, a, b, c);
}

/**
 * Escenario de Inicio (3 esferas, color que cicla por parada de `sceneStops.ts`) sobre el motor
 * genérico compartido (`engine/`, ver 034-unificar-escenas-threejs/plan.md).
 */
export default function Scene3D() {
  return (
    <EngineScene3D
      sphereIds={SPHERE_IDS}
      zoneStops={resolvedSceneStops}
      sizeScale={mobilePortraitSizeScale}
      onFrame={publishHomeSceneVars}
      onDisabled={() => setStaticHeaderFrameVars()}
    />
  );
}
