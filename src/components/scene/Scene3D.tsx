import { lazy, Suspense, useEffect, useState } from "react";
import { setStaticHeaderFrameVars } from "./headerFrameVars";

const SceneCanvas = lazy(() => import("./SceneCanvas"));

function supportsWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return !!(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

/**
 * Gate liviano: no importa `three`/R3F a nivel de módulo. Solo si el usuario
 * no pidió `prefers-reduced-motion` y el navegador soporta WebGL se dispara
 * la carga diferida de `SceneCanvas` (y con ella, el bundle pesado de 3D).
 * En cualquier otro caso no renderiza nada y deja ver `SceneFallbackBackground`.
 */
export default function Scene3D() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const shouldEnable = !reducedMotion && supportsWebGL();
    setEnabled(shouldEnable);
    if (!shouldEnable) {
      setStaticHeaderFrameVars();
    }
  }, []);

  if (!enabled) return null;

  return (
    <Suspense fallback={null}>
      <SceneCanvas />
    </Suspense>
  );
}
