import { readFileSync, readdirSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { sha1Hex } from "./hash.js";
import { extractDominantColors } from "./colors.js";
import { readManifest, writeManifest, MANIFEST_PATH, type CloudinaryManifestEntry } from "./manifest.js";

export const SOURCE_DIR_NAME = "cloudinary-images";

/** Solo lo que `syncFile` necesita del SDK de cloudinary — evita importar sus tipos estáticamente. */
export interface CloudinaryUploaderLike {
  uploader: {
    upload(
      filePath: string,
      options: Record<string, unknown>,
    ): Promise<{ public_id: string; secure_url: string; width: number; height: number; format: string }>;
  };
}

export interface SyncLogger {
  info(message: string): void;
  warn(message: string): void;
  error(message: string): void;
}

/** El SDK de Cloudinary a veces rechaza con un objeto plano `{message, http_code}` y a veces
 * con `{error: {message, http_code}}` — probar ambas formas evita loguear "undefined". */
export function formatUploadError(error: unknown): string {
  const err = error as { message?: string; error?: { message?: string } } | undefined;
  return err?.message ?? err?.error?.message ?? String(error);
}

/** Recorre `sourceDir` recursivamente y devuelve las rutas absolutas de los archivos existentes (sin dotfiles). */
export function listImageFiles(dir: string): string[] {
  const results: string[] = [];
  let entries: ReturnType<typeof readdirSync>;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return results;
  }
  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...listImageFiles(full));
    } else if (entry.isFile()) {
      results.push(full);
    }
  }
  return results;
}

/** Deriva la clave del manifest (y del `public_id`) a partir de la ruta relativa a `cloudinary-images/`, sin extensión. */
export function deriveKey(sourceDir: string, absPath: string): string {
  const rel = relative(sourceDir, absPath);
  return rel.replace(/\.[^./\\]+$/, "").split(sep).join("/");
}

export async function syncFile(
  absPath: string,
  sourceDir: string,
  cloudinary: CloudinaryUploaderLike,
  logger: SyncLogger,
): Promise<void> {
  const key = deriveKey(sourceDir, absPath);
  let buffer: Buffer;
  try {
    buffer = readFileSync(absPath);
  } catch {
    // Archivo borrado/movido entre el evento y esta lectura — nada que hacer.
    return;
  }

  const hash = sha1Hex(buffer);
  const manifest = readManifest();
  const existing = manifest.images[key];

  if (existing?.hash === hash) {
    logger.info(`${key}: sin cambios, se omite`);
    return;
  }

  const publicId = `portafolio/${key}`;
  const result = await cloudinary.uploader.upload(absPath, {
    public_id: publicId,
    overwrite: true,
    resource_type: "image",
  });

  const colors = await extractDominantColors(buffer);

  const entry: CloudinaryManifestEntry = {
    publicId: result.public_id,
    url: result.secure_url,
    hash,
    width: result.width,
    height: result.height,
    format: result.format,
    colors,
    sourcePath: relative(sourceDir, absPath).split(sep).join("/"),
    uploadedAt: new Date().toISOString(),
  };

  manifest.images[key] = entry;
  writeManifest(manifest);
  logger.info(`${key}: subido -> ${entry.url}`);
}

export async function syncAll(
  filePaths: string[],
  sourceDir: string,
  cloudinary: CloudinaryUploaderLike,
  logger: SyncLogger,
): Promise<void> {
  // Secuencial a propósito: evita ráfagas de subidas en paralelo contra los límites de tasa de Cloudinary.
  for (const absPath of filePaths) {
    try {
      await syncFile(absPath, sourceDir, cloudinary, logger);
    } catch (error) {
      logger.error(`${deriveKey(sourceDir, absPath)}: error al sincronizar — ${formatUploadError(error)}`);
    }
  }
}

export { MANIFEST_PATH };
