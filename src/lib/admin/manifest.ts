import { getFile, isShaConflict, putFile } from "./github";
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

/**
 * Resultado de cada escritura: el manifest nuevo **y el sha nuevo** del archivo. Quien llama debe
 * guardar ese sha — con el viejo, la segunda operación de la misma sesión recibe 409 de GitHub
 * después de que Cloudinary ya sobrescribió la imagen, y el manifest queda apuntando a la versión
 * anterior (el navegador sigue mostrando la foto vieja cacheada). Mismo criterio que `publishJson`.
 */
export type SavedManifest = LoadedManifest;

export async function loadManifest(): Promise<LoadedManifest> {
  const file = await getFile(MANIFEST_PATH);
  if (!file) return { manifest: { $schemaVersion: 1, images: {} }, sha: null };
  return { manifest: JSON.parse(file.content) as CloudinaryManifest, sha: file.sha };
}

type ImagesChange = (images: CloudinaryManifest["images"]) => CloudinaryManifest["images"];

async function putManifest(manifest: CloudinaryManifest, sha: string | null, message: string): Promise<SavedManifest> {
  const newSha = await putFile(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`, message, sha ?? undefined);
  return { manifest, sha: newSha };
}

/**
 * Aplica `change` sobre el manifest que tiene el panel y lo commitea. Si GitHub responde conflicto
 * de sha (otro commit llegó antes: otra pestaña, el watcher local, o un sha viejo), relee el
 * manifest fresco, aplica **el mismo cambio de una clave** sobre él y reintenta una vez — así no se
 * pisan cambios ajenos y la imagen que Cloudinary ya sobrescribió no queda sin su versión nueva.
 */
async function commitManifestChange(
  manifest: CloudinaryManifest,
  sha: string | null,
  change: ImagesChange,
  message: string,
): Promise<SavedManifest> {
  try {
    return await putManifest({ ...manifest, images: change(manifest.images) }, sha, message);
  } catch (error) {
    if (!isShaConflict(error)) throw error;
    const fresh = await loadManifest();
    return putManifest({ ...fresh.manifest, images: change(fresh.manifest.images) }, fresh.sha, message);
  }
}

export async function addImage(
  manifest: CloudinaryManifest,
  sha: string | null,
  file: File,
  key: string,
): Promise<SavedManifest> {
  const result: CloudinaryUploadResult = await uploadImage(file, key);
  const entry: CloudinaryManifestEntry = {
    publicId: result.publicId,
    url: result.url,
    hash: "",
    width: result.width,
    height: result.height,
    format: result.format,
    colors: FALLBACK_COLORS,
    sourcePath: "admin:upload",
    uploadedAt: new Date().toISOString(),
  };
  return commitManifestChange(manifest, sha, (images) => ({ ...images, [key]: entry }), `admin: subir imagen ${key}`);
}

// Reemplaza la clave por un asset de Cloudinary que ya existe (subido antes,
// sin usar en ningún otro lugar del manifest) — no sube ni borra nada en
// Cloudinary, solo reescribe el manifest. Ver 060.
export async function replaceImageWithExisting(
  manifest: CloudinaryManifest,
  sha: string | null,
  key: string,
  resource: { public_id: string; secure_url: string; width: number; height: number; format: string },
): Promise<SavedManifest> {
  const entry: CloudinaryManifestEntry = {
    publicId: resource.public_id,
    url: resource.secure_url,
    hash: "",
    width: resource.width,
    height: resource.height,
    format: resource.format,
    colors: FALLBACK_COLORS,
    sourcePath: "admin:replace-existing",
    uploadedAt: new Date().toISOString(),
  };
  return commitManifestChange(
    manifest,
    sha,
    (images) => ({ ...images, [key]: entry }),
    `admin: reemplazar imagen ${key} (existente)`,
  );
}

export async function removeImage(manifest: CloudinaryManifest, sha: string | null, key: string): Promise<SavedManifest> {
  const entry = manifest.images[key];
  if (!entry) return { manifest, sha };
  await destroyImage(entry.publicId);
  return commitManifestChange(
    manifest,
    sha,
    (images) => {
      const rest = { ...images };
      delete rest[key];
      return rest;
    },
    `admin: borrar imagen ${key}`,
  );
}
