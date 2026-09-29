import imageAdjustmentsJson from "./imageAdjustments.json";

/**
 * Ajustes no destructivos por clave del manifest de Cloudinary (092). Todos opcionales: un valor
 * ausente o en 0 no genera transformación. Se editan en `/admin/imagenes` → "Ajustar".
 */
export interface ImageAdjustments {
  /** −99 … 100 → `e_brightness` (Cloudinary no acepta −100). */
  brightness?: number;
  /** −100 … 100 → `e_contrast`. */
  contrast?: number;
  /** −100 … 100 → `e_saturation`. */
  saturation?: number;
  /** −100 … 100 → `e_vibrance` ("intensidad"). */
  vibrance?: number;
  /** −50 … 150 → `e_gamma`. */
  gamma?: number;
  /** −100 (frío) … 100 (cálido) → `e_red` y `e_blue` en sentido opuesto. */
  temperature?: number;
  /** −100 (verde) … 100 (magenta) → `e_green` invertido. */
  tint?: number;
  /** 0 … 400 → `e_sharpen`. */
  sharpen?: number;
  /** `e_improve`: corrección automática de Cloudinary, antes del resto de ajustes. */
  auto?: boolean;
}

export interface ImageAdjustmentsFile {
  $schemaVersion: number;
  images: Record<string, ImageAdjustments>;
}

export const imageAdjustments = imageAdjustmentsJson as ImageAdjustmentsFile;
