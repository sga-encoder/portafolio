import type { Camera, Vector3 } from "three";
import { sceneStops } from "./sceneStops";

interface SphereScreenVar {
  x: number;
  y: number;
  color: string;
}

interface SphereCandidate extends SphereScreenVar {
  /**
   * Si la esfera participa activamente en esta sección (tamaño > 0). Una esfera "dormida"
   * (todavía no nace, ej. C en Header/Habilidades) puede seguir "aparcada" dentro del rango
   * on-screen y no debe competir por izquierda/derecha.
   */
  active: boolean;
}

/**
 * Margen extra (fracción de pantalla) fuera de [0,1] donde una esfera todavía cuenta como
 * "en pantalla" — el degradado se difumina antes del borde geométrico, así que no hace falta
 * que esté 100% dentro del viewport para seguir siendo la protagonista visual de ese lado.
 */
const ON_SCREEN_MARGIN = 0.25;

function isOnScreenCandidate(sphere: SphereCandidate): boolean {
  return sphere.active && sphere.x >= -ON_SCREEN_MARGIN && sphere.x <= 1 + ON_SCREEN_MARGIN;
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

/** Escribe la posición/color de las esferas A y B (y el ángulo derivado), y el color/posición de C, como CSS custom properties en `root`. */
export function setSphereFrameVars(
  root: HTMLElement,
  a: SphereCandidate,
  b: SphereCandidate,
  c?: SphereCandidate,
): void {
  root.style.setProperty(VAR_NAMES.a.x, `${a.x}`);
  root.style.setProperty(VAR_NAMES.a.y, `${a.y}`);
  root.style.setProperty(VAR_NAMES.a.color, a.color);
  root.style.setProperty(VAR_NAMES.b.x, `${b.x}`);
  root.style.setProperty(VAR_NAMES.b.y, `${b.y}`);
  root.style.setProperty(VAR_NAMES.b.color, b.color);
  root.style.setProperty("--sphere-gradient-angle", `${gradientAngleDeg(a, b)}deg`);
  // Color de C: usado por el panel/divisor de "Sobre mí" (verde↔violeta), no participa
  // en el ángulo de A/B para no afectar el marco de Header (único consumidor de ese ángulo).
  if (c) {
    root.style.setProperty("--sphere-c-color", c.color);
  }

  // "Izquierda"/"derecha" no dependen de si es A, B o C: el botón "Proyectos" siempre toma
  // el color de la esfera que esté más a la izquierda EN PANTALLA en ese momento, y "Blog" el
  // de la que esté más a la derecha. Filtramos a las esferas realmente en pantalla (`active` +
  // dentro de [0,1] con margen) porque en Proyectos/Sobre-mí una de A/B/C sale de cuadro
  // mientras otra "nace" — sin este filtro, la que salió de cuadro seguía ganando el extremo
  // por su posición numérica aunque ya no se viera, y la que sí se veía (C) nunca competía.
  const candidates = [a, b, c].filter((sphere): sphere is SphereCandidate => sphere !== undefined);
  const onScreen = candidates.filter(isOnScreenCandidate);
  const pool = onScreen.length > 0 ? onScreen : candidates;
  const left = pool.reduce((min, sphere) => (sphere.x < min.x ? sphere : min));
  const right = pool.reduce((max, sphere) => (sphere.x > max.x ? sphere : max));
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
    { ...toScreenFraction(headerStop.spheres.a.end.position), color: headerStop.spheres.a.end.color, active: true },
    { ...toScreenFraction(headerStop.spheres.b.end.position), color: headerStop.spheres.b.end.color, active: true },
  );
}
