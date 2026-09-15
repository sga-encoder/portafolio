import { getFile, putFile } from "./github";
import { uploadImage, destroyImage, type CloudinaryUploadResult } from "./cloudinary";

// Lee/actualiza src/data/cloudinaryManifest.json desde el panel /admin
// (feature 043) vía GitHub — mismo archivo que consume el build
// (src/utils/cloudinaryManifest.ts) y que escribe el watcher local (036).
// Ver .claude/spec/features/043-panel-administrativo/plan.md.

const MANIFEST_PATH = "src/data/cloudinaryManifest.json";

// Colores dominantes reales requieren `sharp` (Node) — no disponible en el
// navegador. Una imagen subida desde el panel queda con este par fijo hasta
// que alguien la reprocese corriendo el watcher local (limitación conocida,
// documentada en plan.md).
const FALLBACK_COLORS: [string, string] = ["#C0009D", "#0033FF"];

export interface CloudinaryManifestEntry {
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

export interface CloudinaryManifest {
  $schemaVersion: number;
  images: Record<string, CloudinaryManifestEntry>;
}

interface LoadedManifest {
  manifest: CloudinaryManifest;
  sha: string | null;
}

export async function loadManifest(): Promise<LoadedManifest> {
  const file = await getFile(MANIFEST_PATH);
  if (!file) return { manifest: { $schemaVersion: 1, images: {} }, sha: null };
  return { manifest: JSON.parse(file.content) as CloudinaryManifest, sha: file.sha };
}

async function saveManifest(manifest: CloudinaryManifest, sha: string | null, message: string): Promise<void> {
  await putFile(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`, message, sha ?? undefined);
}

export async function addImage(
  manifest: CloudinaryManifest,
  sha: string | null,
  file: File,
  key: string,
): Promise<CloudinaryManifest> {
  const result: CloudinaryUploadResult = await uploadImage(file, key);
  const next: CloudinaryManifest = {
    ...manifest,
    images: {
      ...manifest.images,
      [key]: {
        publicId: result.publicId,
        url: result.url,
        hash: "",
        width: result.width,
        height: result.height,
        format: result.format,
        colors: FALLBACK_COLORS,
        sourcePath: "admin:upload",
        uploadedAt: new Date().toISOString(),
      },
    },
  };
  await saveManifest(next, sha, `admin: subir imagen ${key}`);
  return next;
}

// Reemplaza la clave por un asset de Cloudinary que ya existe (subido antes,
// sin usar en ningún otro lugar del manifest) — no sube ni borra nada en
// Cloudinary, solo reescribe el manifest. Ver 060.
export async function replaceImageWithExisting(
  manifest: CloudinaryManifest,
  sha: string | null,
  key: string,
  resource: { public_id: string; secure_url: string; width: number; height: number; format: string },
): Promise<CloudinaryManifest> {
  const next: CloudinaryManifest = {
    ...manifest,
    images: {
      ...manifest.images,
      [key]: {
        publicId: resource.public_id,
        url: resource.secure_url,
        hash: "",
        width: resource.width,
        height: resource.height,
        format: resource.format,
        colors: FALLBACK_COLORS,
        sourcePath: "admin:replace-existing",
        uploadedAt: new Date().toISOString(),
      },
    },
  };
  await saveManifest(next, sha, `admin: reemplazar imagen ${key} (existente)`);
  return next;
}

export async function removeImage(manifest: CloudinaryManifest, sha: string | null, key: string): Promise<CloudinaryManifest> {
  const entry = manifest.images[key];
  if (!entry) return manifest;
  await destroyImage(entry.publicId);
  const rest = { ...manifest.images };
  delete rest[key];
  const next: CloudinaryManifest = { ...manifest, images: rest };
  await saveManifest(next, sha, `admin: borrar imagen ${key}`);
  return next;
}
