import manifest from "../data/cloudinaryManifest.json";
import { imageAdjustments } from "../data/imageAdjustments";
import { applyCloudinaryTransformations } from "./imageAdjustments";

interface CloudinaryManifestEntry {
  publicId: string;
  url: string;
  hash: string;
  width: number;
  height: number;
  format: string;
  colors: [string, string];
  sourcePath: string;
  uploadedAt: string;
}

interface CloudinaryManifest {
  $schemaVersion: number;
  images: Record<string, CloudinaryManifestEntry>;
}

const typedManifest = manifest as CloudinaryManifest;

export function hasCloudinaryImage(key: string): boolean {
  return key in typedManifest.images;
}

export function getCloudinaryEntry(key: string): CloudinaryManifestEntry {
  const entry = typedManifest.images[key];
  if (!entry) {
    throw new Error(
      `Clave de imagen "${key}" no existe en cloudinaryManifest.json. Colócala en cloudinary-images/ y corre "npm run dev" para subirla.`,
    );
  }
  return entry;
}

export function getCloudinaryColors(key: string): [string, string] {
  return getCloudinaryEntry(key).colors;
}

/**
 * Inserta transformaciones (ej. "w_900,q_auto,f_auto") en la URL guardada — cero llamadas de red.
 * Antepone los ajustes publicados de esa clave (092, `imageAdjustments.json`); sin ajustes, la URL
 * es idéntica a la de antes de 092.
 */
export function getCloudinaryUrl(key: string, transformation?: string): string {
  const { url } = getCloudinaryEntry(key);
  return applyCloudinaryTransformations(url, imageAdjustments.images[key], transformation);
}
