import type { PerspectiveCamera } from "three";

/** Alto visible (en unidades de mundo) del frustum de una cámara en perspectiva, a una profundidad dada. */
export function visibleHeightAtDepth(camera: PerspectiveCamera, depth: number): number {
  const distance = Math.abs(camera.position.z - depth);
  const verticalFovRad = (camera.fov * Math.PI) / 180;
  return 2 * Math.tan(verticalFovRad / 2) * distance;
}

export function visibleWidthAtDepth(camera: PerspectiveCamera, depth: number): number {
  return visibleHeightAtDepth(camera, depth) * camera.aspect;
}

/**
 * Convierte una posición normalizada ([-1,1] en x/y, fracción del viewport visible
 * en esa profundidad) a coordenadas de mundo.
 */
export function normalizedToWorld(
  camera: PerspectiveCamera,
  normalized: readonly [number, number, number],
): [number, number, number] {
  const [nx, ny, z] = normalized;
  const width = visibleWidthAtDepth(camera, z);
  const height = visibleHeightAtDepth(camera, z);
  return [(nx * width) / 2, (ny * height) / 2, z];
}

/** Radio en unidades de mundo para que una esfera ocupe `screenFraction` del alto visible. */
export function radiusForScreenFraction(
  camera: PerspectiveCamera,
  depth: number,
  screenFraction: number,
): number {
  return (visibleHeightAtDepth(camera, depth) * screenFraction) / 2;
}
