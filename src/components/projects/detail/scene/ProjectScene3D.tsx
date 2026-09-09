import { lazy, Suspense, useEffect, useState } from "react";

const ProjectSceneCanvas = lazy(() => import("./ProjectSceneCanvas"));

interface Props {
  colorA: string;
  colorB: string;
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
 * Gate liviano (mismo mecanismo que `Scene3D.tsx` de Inicio): no importa `three`/R3F
 * a nivel de módulo. Solo si el usuario no pidió `prefers-reduced-motion` y el
 * navegador soporta WebGL se dispara la carga diferida de `ProjectSceneCanvas`.
 * En cualquier otro caso no renderiza nada y deja ver el fondo estático de
 * `ProjectPageBackground.astro` — sus 2 colores fijos ya coinciden con la posición
 * de reposo de la zona "encabezado", así que no hace falta publicar ninguna
 * variable CSS extra para el caso sin 3D.
 */
export default function ProjectScene3D({ colorA, colorB }: Props) {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setEnabled(!reducedMotion && supportsWebGL());
  }, []);

  if (!enabled) return null;

  return (
    <Suspense fallback={null}>
      <ProjectSceneCanvas colorA={colorA} colorB={colorB} />
    </Suspense>
  );
}
