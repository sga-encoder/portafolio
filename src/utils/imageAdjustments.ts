import type { ImageAdjustments } from "../data/imageAdjustments";

// Fuente única de los ajustes de imagen (092): la usan el sitio (`getCloudinaryUrl`, en build) y
// el editor del panel (vista previa + publicación). Ver
// .claude/spec/features/092-editor-ajustes-imagen/plan.md.

export type NumericAdjustment = Exclude<keyof ImageAdjustments, "auto">;

export interface AdjustmentControl {
  key: NumericAdjustment;
  label: string;
  min: number;
  max: number;
}

/** Orden de los deslizadores del editor, que es también el orden de la cadena de Cloudinary. */
export const ADJUSTMENT_CONTROLS: readonly AdjustmentControl[] = [
  // Cloudinary rechaza `e_brightness:-100` (400 "Brightness must be > -100"), verificado con curl.
  { key: "brightness", label: "Brillo", min: -99, max: 100 },
  { key: "contrast", label: "Contraste", min: -100, max: 100 },
  { key: "gamma", label: "Gamma", min: -50, max: 150 },
  { key: "saturation", label: "Saturación", min: -100, max: 100 },
  { key: "vibrance", label: "Intensidad", min: -100, max: 100 },
  { key: "temperature", label: "Temperatura", min: -100, max: 100 },
  { key: "tint", label: "Tinte", min: -100, max: 100 },
  { key: "sharpen", label: "Nitidez", min: 0, max: 400 },
];

function clampRound(value: number, min: number, max: number): number {
  return Math.round(Math.min(Math.max(value, min), max));
}

/** Descarta ceros/valores fuera de rango: lo que queda es exactamente lo que se publica. */
export function cleanAdjustments(input: ImageAdjustments): ImageAdjustments {
  const out: ImageAdjustments = {};
  if (input.auto) out.auto = true;
  for (const { key, min, max } of ADJUSTMENT_CONTROLS) {
    const raw = input[key];
    if (typeof raw !== "number" || !Number.isFinite(raw)) continue;
    const value = clampRound(raw, min, max);
    if (value !== 0) out[key] = value;
  }
  return out;
}

export function hasAdjustments(input: ImageAdjustments | undefined): boolean {
  return input != null && Object.keys(cleanAdjustments(input)).length > 0;
}

/**
 * Cadena de Cloudinary: un efecto por componente (Cloudinary solo acepta un `e_` por componente),
 * p. ej. `e_brightness:10/e_red:8/e_blue:-8`. Sin ajustes devuelve `""`.
 */
export function adjustmentsToTransformation(input: ImageAdjustments | undefined): string {
  if (!input) return "";
  const adj = cleanAdjustments(input);
  const parts: string[] = [];
  if (adj.auto) parts.push("e_improve");
  if (adj.brightness) parts.push(`e_brightness:${adj.brightness}`);
  if (adj.contrast) parts.push(`e_contrast:${adj.contrast}`);
  if (adj.gamma) parts.push(`e_gamma:${adj.gamma}`);
  if (adj.saturation) parts.push(`e_saturation:${adj.saturation}`);
  if (adj.vibrance) parts.push(`e_vibrance:${adj.vibrance}`);
  // Cloudinary no tiene un parámetro de temperatura en Kelvin: se aproxima subiendo rojo y
  // bajando azul (cálido) o al revés (frío), a la mitad cada uno para no saturar un canal.
  if (adj.temperature) {
    const half = Math.round(adj.temperature / 2);
    if (half) parts.push(`e_red:${half}`, `e_blue:${-half}`);
  }
  // Tinte positivo = magenta = menos verde.
  if (adj.tint) {
    const green = Math.round(-adj.tint / 2);
    if (green) parts.push(`e_green:${green}`);
  }
  if (adj.sharpen) parts.push(`e_sharpen:${adj.sharpen}`);
  return parts.join("/");
}

/** Inserta ajustes + transformación extra (ej. `w_900,q_auto,f_auto`) tras `/image/upload/`. */
export function applyCloudinaryTransformations(
  url: string,
  adjustments: ImageAdjustments | undefined,
  transformation?: string,
): string {
  const chain = [adjustmentsToTransformation(adjustments), transformation].filter(Boolean).join("/");
  return chain ? url.replace("/image/upload/", `/image/upload/${chain}/`) : url;
}

// ---------------------------------------------------------------------------------------------
// Vista previa local (solo editor): aproximación con un filtro SVG, sin red ni cuota de Cloudinary.
// No reproduce `auto` ni `sharpen`; para eso el editor ofrece "Resultado real".
// ---------------------------------------------------------------------------------------------

export interface PreviewFilter {
  /** `values` de un `<feColorMatrix type="matrix">` (4×5): saturación + ganancia por canal. */
  colorMatrix: string;
  /** Exponente por canal de un `<feFuncX type="gamma">`. */
  gammaExponent: number;
  /** `slope`/`intercept` de un `<feFuncX type="linear">`: brillo + contraste. */
  slope: number;
  intercept: number;
}

const LUMA = [0.2126, 0.7152, 0.0722] as const;

export function adjustmentsToPreviewFilter(input: ImageAdjustments): PreviewFilter {
  const adj = cleanAdjustments(input);
  const saturation = Math.max(0, 1 + (adj.saturation ?? 0) / 100) * (1 + (adj.vibrance ?? 0) / 200);
  const warm = (adj.temperature ?? 0) / 200;
  const gains = [1 + warm, 1 - (adj.tint ?? 0) / 200, 1 - warm];

  const rows: number[] = [];
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      const identity = row === col ? 1 : 0;
      const value = LUMA[col] * (1 - saturation) + identity * saturation;
      rows.push(value * gains[row]);
    }
    rows.push(0, 0);
  }
  rows.push(0, 0, 0, 1, 0);

  const gamma = adj.gamma ?? 0;
  const gammaExponent = 1 / Math.max(0.1, 1 + gamma / 100);
  const brightness = 1 + (adj.brightness ?? 0) / 100;
  const contrast = Math.max(0, 1 + (adj.contrast ?? 0) / 100);
  const slope = brightness * contrast;
  const intercept = 0.5 * (1 - contrast);

  return {
    colorMatrix: rows.map((value) => value.toFixed(4)).join(" "),
    gammaExponent,
    slope,
    intercept,
  };
}
