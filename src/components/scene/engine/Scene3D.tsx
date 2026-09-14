import { lazy, Suspense, useEffect, useState } from "react";
import type { OnFrameCallback } from "./SceneContent";
import type { ResolvedZoneStop } from "./zoneStops";

const SceneCanvas = lazy(() => import("./SceneCanvas"));

interface Props {
  sphereIds: readonly string[];
  zoneStops: readonly ResolvedZoneStop[];
  sizeScale?: (aspect: number) => number;
  onFrame?: OnFrameCallback;
  /** Llamado si la escena no llega a montarse (sin WebGL o `prefers-reduced-motion`) — ej. Inicio publica un fallback estático de variables CSS. */
  onDisabled?: () => void;
}

function supportsWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return !!(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

/**
 * Gate liviano, genérico para cualquier escenario: no importa `three`/R3F a nivel de módulo. Solo
 * si el usuario no pidió `prefers-reduced-motion` y el navegador soporta WebGL se dispara la
 * carga diferida de `SceneCanvas` (y con ella, el bundle pesado de 3D). En cualquier otro caso no
 * renderiza nada y deja ver el fondo estático de respaldo de cada página.
 */
export default function Scene3D({ sphereIds, zoneStops, sizeScale, onFrame, onDisabled }: Props) {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const shouldEnable = !reducedMotion && supportsWebGL();
    setEnabled(shouldEnable);
    if (!shouldEnable) {
      onDisabled?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!enabled) return null;

  return (
    <Suspense fallback={null}>
      <SceneCanvas sphereIds={sphereIds} zoneStops={zoneStops} sizeScale={sizeScale} onFrame={onFrame} />
    </Suspense>
  );
}
