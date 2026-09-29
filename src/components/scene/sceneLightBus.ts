import type { SphereFrameState } from "./engine/SceneContent";

/** Una esfera de la escena vista como luz 2D: posición/radio en fracción del viewport, color hex. */
export interface SceneLight {
  x: number;
  y: number;
  radius: number;
  color: string;
  active: boolean;
}

/**
 * Bus mínimo (sin React) entre la escena 3D de Inicio y el relight de retratos (093). La escena
 * escribe una vez por frame; el relight lo lee desde su propio `requestAnimationFrame` y compara
 * `version` para saber si hay datos nuevos. Si la escena nunca se monta, `version` queda en 0 y
 * los retratos se quedan con su `<img>`.
 */
const lights: SceneLight[] = [];
let version = 0;

export function publishSceneLights(spheres: readonly SphereFrameState[]): void {
  spheres.forEach((sphere, index) => {
    const light = lights[index] ?? (lights[index] = { x: 0, y: 0, radius: 0, color: "#000000", active: false });
    light.x = sphere.x;
    light.y = sphere.y;
    light.radius = sphere.radius;
    light.color = sphere.color;
    light.active = sphere.active;
  });
  lights.length = spheres.length;
  version += 1;
}

export function getSceneLights(): readonly SceneLight[] {
  return lights;
}

export function getSceneLightsVersion(): number {
  return version;
}
