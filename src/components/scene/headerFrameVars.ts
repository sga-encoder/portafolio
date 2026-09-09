import type { Camera, Vector3 } from "three";
import { sceneStops } from "./sceneStops";

interface SphereScreenVar {
  x: number;
  y: number;
  color: string;
}

const VAR_NAMES = {
  a: { x: "--sphere-a-x", y: "--sphere-a-y", color: "--sphere-a-color" },
  b: { x: "--sphere-b-x", y: "--sphere-b-y", color: "--sphere-b-color" },
} as const;

/** Proyecta una posición de mundo a fracción de pantalla [0,1] (y hacia abajo, como CSS). */
export function projectToScreenFraction(camera: Camera, position: Vector3): { x: number; y: number } {
  const ndc = position.clone().project(camera);
  return { x: (ndc.x + 1) / 2, y: (1 - ndc.y) / 2 };
}

/** Ángulo (grados, convención CSS: 0deg = arriba, aumenta en sentido horario) de A hacia B. */
function gradientAngleDeg(a: { x: number; y: number }, b: { x: number; y: number }): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return (Math.atan2(dx, -dy) * 180) / Math.PI;
}

/** Escribe la posición/color de las esferas A y B (y el ángulo derivado), y opcionalmente el color de C, como CSS custom properties en `root`. */
export function setSphereFrameVars(
  root: HTMLElement,
  a: SphereScreenVar,
  b: SphereScreenVar,
  c?: { color: string },
): void {
  root.style.setProperty(VAR_NAMES.a.x, `${a.x}`);
  root.style.setProperty(VAR_NAMES.a.y, `${a.y}`);
  root.style.setProperty(VAR_NAMES.a.color, a.color);
  root.style.setProperty(VAR_NAMES.b.x, `${b.x}`);
  root.style.setProperty(VAR_NAMES.b.y, `${b.y}`);
  root.style.setProperty(VAR_NAMES.b.color, b.color);
  root.style.setProperty("--sphere-gradient-angle", `${gradientAngleDeg(a, b)}deg`);
  // Color de C: usado por el panel/divisor de "Sobre mí" (verde↔violeta), no participa
  // en el ángulo/left-right de A y B para no afectar Header/Habilidades/Proyectos.
  if (c) {
    root.style.setProperty("--sphere-c-color", c.color);
  }

  // No dependen de si es "A" o "B": el botón "Proyectos" siempre toma el color
  // de la esfera que esté más a la izquierda en pantalla en ese momento, y
  // "Blog" el de la que esté más a la derecha, sin importar cuál sea cuál.
  const [left, right] = a.x <= b.x ? [a, b] : [b, a];
  root.style.setProperty("--sphere-left-color", left.color);
  root.style.setProperty("--sphere-right-color", right.color);
}

/**
 * Fallback estático (sin escena 3D montada: `prefers-reduced-motion` o sin WebGL):
 * usa la posición/color de reposo de la sección "header" en `sceneStops`, una sola vez.
 */
export function setStaticHeaderFrameVars(root: HTMLElement = document.documentElement): void {
  const headerStop = sceneStops.find((stop) => stop.sectionId === "header");
  if (!headerStop) return;

  const toScreenFraction = (position: readonly [number, number, number]) => ({
    x: (position[0] + 1) / 2,
    y: (1 - position[1]) / 2,
  });

  setSphereFrameVars(
    root,
    { ...toScreenFraction(headerStop.spheres.a.end.position), color: headerStop.spheres.a.end.color },
    { ...toScreenFraction(headerStop.spheres.b.end.position), color: headerStop.spheres.b.end.color },
  );
}
