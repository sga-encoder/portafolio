import { doc, getDoc, serverTimestamp, setDoc, type Timestamp } from "firebase/firestore";
import { db } from "../firebase";
import { getFile, putFile } from "./github";

// Borradores de Markdown del panel /admin (feature 043): autoguardado en
// Firestore, "Publicar" hace el commit real vía GitHub. Ver
// .claude/spec/features/043-panel-administrativo/plan.md.

export interface DraftDoc {
  content: string;
  updatedAt: Timestamp | null;
  publishedAt: Timestamp | null;
  createdAt: Timestamp | null;
}

export interface LoadedContent {
  content: string;
  sha: string | null;
  isDraft: boolean;
}

function contentPath(slug: string): string {
  return `src/content/projects/${slug}.md`;
}

/** Hay cambios sin publicar si nunca se publicó, o si el borrador se editó después de la última publicación. */
export function isDraftPending(draft: DraftDoc | null): boolean {
  return draft != null && (!draft.publishedAt || (draft.updatedAt?.toMillis() ?? 0) > draft.publishedAt.toMillis());
}

/**
 * Si hay un borrador más nuevo que su última publicación, se precarga ese.
 * Si no, se trae el archivo real desde GitHub — nunca se edita a ciegas
 * contenido desactualizado.
 */
export async function loadContent(slug: string): Promise<LoadedContent> {
  const draftSnap = await getDoc(doc(db, "adminDrafts", slug));
  const draft = draftSnap.exists() ? (draftSnap.data() as DraftDoc) : null;

  const pending = isDraftPending(draft);

  const file = await getFile(contentPath(slug));

  if (pending && draft) {
    return { content: draft.content, sha: file?.sha ?? null, isDraft: true };
  }

  return { content: file?.content ?? "", sha: file?.sha ?? null, isDraft: false };
}

export async function saveDraft(slug: string, content: string): Promise<void> {
  await setDoc(
    doc(db, "adminDrafts", slug),
    { content, updatedAt: serverTimestamp() },
    { merge: true },
  );
}

export async function publish(slug: string, content: string, sha: string | null): Promise<void> {
  await putFile(contentPath(slug), content, `admin: actualizar ${slug}.md`, sha ?? undefined);

  // "Creado" (057) = primera publicación real desde el editor, no la
  // fecha del proyecto en src/data/projects.ts. Se escribe una sola vez:
  // publicaciones siguientes no la tocan, solo publishedAt.
  const draftSnap = await getDoc(doc(db, "adminDrafts", slug));
  const hasCreatedAt = draftSnap.exists() && (draftSnap.data() as DraftDoc).createdAt != null;

  await setDoc(
    doc(db, "adminDrafts", slug),
    {
      content,
      publishedAt: serverTimestamp(),
      ...(hasCreatedAt ? {} : { createdAt: serverTimestamp() }),
    },
    { merge: true },
  );
}
