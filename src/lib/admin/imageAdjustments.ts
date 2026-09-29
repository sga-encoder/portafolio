import { getFile, putFile } from "./github";
import { loadJsonContent, publishJson, saveJsonDraft, type LoadedJsonContent } from "./jsonContent";
import type { ImageAdjustments, ImageAdjustmentsFile } from "../../data/imageAdjustments";
import { cleanAdjustments } from "../../utils/imageAdjustments";

// Ajustes de imagen del panel (092): `src/data/imageAdjustments.json` con el mismo mecanismo
// borrador(Firestore)/publicar(commit) de `064`. Ver
// .claude/spec/features/092-editor-ajustes-imagen/plan.md.

const DRAFT_ID = "home:imageAdjustments";
const FILE_PATH = "src/data/imageAdjustments.json";

export const EMPTY_ADJUSTMENTS_FILE: ImageAdjustmentsFile = { $schemaVersion: 1, images: {} };

/** Sin archivo remoto todavía (primera vez), arranca vacío en vez de fallar. */
export async function loadAdjustments(): Promise<LoadedJsonContent<ImageAdjustmentsFile>> {
  try {
    return await loadJsonContent<ImageAdjustmentsFile>(DRAFT_ID, FILE_PATH);
  } catch (err) {
    console.error(err);
    return { data: EMPTY_ADJUSTMENTS_FILE, sha: null, isDraft: false };
  }
}

/** Devuelve el archivo con los ajustes de `key` reemplazados (o quitados si quedan vacíos). */
export function withAdjustments(
  file: ImageAdjustmentsFile,
  key: string,
  adjustments: ImageAdjustments,
): ImageAdjustmentsFile {
  const clean = cleanAdjustments(adjustments);
  const images = { ...file.images };
  if (Object.keys(clean).length > 0) images[key] = clean;
  else delete images[key];
  return { ...file, images };
}

export function saveAdjustmentsDraft(file: ImageAdjustmentsFile): Promise<void> {
  return saveJsonDraft(DRAFT_ID, file);
}

export function publishAdjustments(file: ImageAdjustmentsFile, sha: string | null): Promise<string | null> {
  return publishJson(DRAFT_ID, FILE_PATH, file, sha);
}

/**
 * Al borrar una imagen, quita su clave del archivo publicado (commit directo, sin arrastrar
 * borradores de otras imágenes) y, si hay un borrador pendiente, también de ese borrador — así
 * una re-subida con la misma clave no hereda ajustes viejos. Devuelve el estado local nuevo.
 */
export async function removeAdjustments(
  key: string,
  local: LoadedJsonContent<ImageAdjustmentsFile>,
): Promise<LoadedJsonContent<ImageAdjustmentsFile>> {
  let sha = local.sha;
  const remote = await getFile(FILE_PATH);
  if (remote) {
    const published = JSON.parse(remote.content) as ImageAdjustmentsFile;
    sha = remote.sha;
    if (key in published.images) {
      const images = { ...published.images };
      delete images[key];
      sha = await putFile(
        FILE_PATH,
        `${JSON.stringify({ ...published, images }, null, 2)}\n`,
        `admin: quitar ajustes de imagen ${key}`,
        remote.sha,
      );
    }
  }

  const images = { ...local.data.images };
  delete images[key];
  const data = { ...local.data, images };
  if (local.isDraft) await saveJsonDraft(DRAFT_ID, data);
  return { data, sha, isDraft: local.isDraft };
}
