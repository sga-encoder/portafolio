import { doc, getDoc, serverTimestamp, setDoc, type Timestamp } from "firebase/firestore";
import { db } from "../firebase";
import { getFile, putFile } from "./github";

// Generaliza `drafts.ts` (atado a Markdown de `src/content/projects/*.md`) a contenido JSON con
// path/doc-id arbitrarios — usado por el panel "Contenido" (064) para editar `profile.ts`,
// `skills.ts`, `projects.ts` y `sceneStops.ts` sin duplicar la lógica de borrador(Firestore)/
// publicar(GitHub commit). Reusa la misma colección `adminDrafts` (las reglas ya permiten
// cualquier doc id para el admin, ver firestore.rules) con doc-ids prefijados `home:` para no
// colisionar con slugs de proyecto reales. Ver .claude/spec/features/064-panel-contenido-secciones/plan.md.

interface JsonDraftDoc {
  content: string;
  updatedAt: Timestamp | null;
  publishedAt: Timestamp | null;
  createdAt: Timestamp | null;
}

export interface LoadedJsonContent<T> {
  data: T;
  sha: string | null;
  isDraft: boolean;
}

function isDraftPending(draft: JsonDraftDoc | null): boolean {
  return draft != null && (!draft.publishedAt || (draft.updatedAt?.toMillis() ?? 0) > draft.publishedAt.toMillis());
}

/**
 * Si hay un borrador más nuevo que su última publicación, se precarga ese. Si no, se trae el
 * archivo real desde GitHub — nunca se edita a ciegas contenido desactualizado.
 */
export async function loadJsonContent<T>(draftId: string, filePath: string): Promise<LoadedJsonContent<T>> {
  const draftSnap = await getDoc(doc(db, "adminDrafts", draftId));
  const draft = draftSnap.exists() ? (draftSnap.data() as JsonDraftDoc) : null;

  const pending = isDraftPending(draft);

  const file = await getFile(filePath);

  if (pending && draft) {
    return { data: JSON.parse(draft.content) as T, sha: file?.sha ?? null, isDraft: true };
  }

  if (!file) {
    throw new Error(`No se encontró ${filePath} en el repositorio.`);
  }

  return { data: JSON.parse(file.content) as T, sha: file.sha, isDraft: false };
}

function serialize(data: unknown): string {
  return `${JSON.stringify(data, null, 2)}\n`;
}

export async function saveJsonDraft(draftId: string, data: unknown): Promise<void> {
  await setDoc(
    doc(db, "adminDrafts", draftId),
    { content: serialize(data), updatedAt: serverTimestamp() },
    { merge: true },
  );
}

export async function publishJson(draftId: string, filePath: string, data: unknown, sha: string | null): Promise<void> {
  const content = serialize(data);
  await putFile(filePath, content, `admin: actualizar ${filePath}`, sha ?? undefined);

  const draftSnap = await getDoc(doc(db, "adminDrafts", draftId));
  const hasCreatedAt = draftSnap.exists() && (draftSnap.data() as JsonDraftDoc).createdAt != null;

  await setDoc(
    doc(db, "adminDrafts", draftId),
    {
      content,
      publishedAt: serverTimestamp(),
      ...(hasCreatedAt ? {} : { createdAt: serverTimestamp() }),
    },
    { merge: true },
  );
}
