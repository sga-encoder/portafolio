import { CanvasTexture, LinearFilter } from "three";

let cachedTexture: CanvasTexture | null = null;

/**
 * Textura de degradado radial suave (centro opaco → borde transparente),
 * generada una sola vez en un <canvas> 2D y reutilizada por todos los blobs
 * (el color/tinte de cada uno lo aporta `material.color`, no la textura).
 */
export function getGradientTexture(size = 512): CanvasTexture {
  if (cachedTexture) return cachedTexture;

  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No se pudo crear el contexto 2D para la textura del blob");

  const center = size / 2;
  const gradient = ctx.createRadialGradient(center, center, 0, center, center, center);
  // Muchas paradas con una curva suave (sin quiebres de pendiente) para que el
  // degradado no muestre anillos/bandas al escalar la esfera a tamaños grandes.
  const STOPS = 48;
  for (let i = 0; i <= STOPS; i += 1) {
    const t = i / STOPS;
    const alpha = Math.pow(1 - t, 0.8);
    gradient.addColorStop(t, `rgba(255,255,255,${alpha})`);
  }

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  const texture = new CanvasTexture(canvas);
  texture.minFilter = LinearFilter;
  texture.magFilter = LinearFilter;
  texture.needsUpdate = true;
  cachedTexture = texture;
  return texture;
}
