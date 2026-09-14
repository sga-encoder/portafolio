import type { Camera, Vector3 } from "three";

/** Proyecta una posición de mundo a fracción de pantalla [0,1] (y hacia abajo, como CSS). */
export function projectToScreenFraction(camera: Camera, position: Vector3): { x: number; y: number } {
  const ndc = position.clone().project(camera);
  return { x: (ndc.x + 1) / 2, y: (1 - ndc.y) / 2 };
}
