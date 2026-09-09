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

/**
 * `SPHERE_SCREEN_FRACTION`/`screenFraction` están pensados sobre el alto visible en un viewport
 * ancho (desktop/landscape, `aspect >= 1`): el ancho visible en unidades de mundo (`alto × aspect`)
 * sobra para separar 2 esferas ancladas a esquinas opuestas. En portrait (`aspect < 1`, celular
 * vertical) el ancho visible pasa a ser el lado *corto* — sin este factor, el radio (calculado
 * sobre el alto) excede varias veces el ancho real disponible y las esferas se ven enormes y
 * solapadas de borde a borde. Factor `1` para `aspect >= 1` (cero cambio en desktop/landscape,
 * donde ya se ve bien); decrece con el aspect ratio en portrait, con un piso para que las esferas
 * no desaparezcan en los celulares más angostos.
 */
const MOBILE_PORTRAIT_MIN_SCALE = 0.4;

export function mobilePortraitSizeScale(aspect: number): number {
  if (aspect >= 1) return 1;
  return Math.max(MOBILE_PORTRAIT_MIN_SCALE, aspect);
}
