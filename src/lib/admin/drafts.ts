import { doc, getDoc, serverTimestamp, setDoc, type Timestamp } from "firebase/firestore";
import { db } from "../firebase";
import { getFile, putFile } from "./github";

// Borradores de Markdown del panel /admin (feature 043): autoguardado en
// Firestore, "Publicar" hace el commit real vía GitHub. Ver
// .claude/spec/features/043-panel-administrativo/plan.md.

interface DraftDoc {
  content: string;
  updatedAt: Timestamp | null;
  publishedAt: Timestamp | null;
}

export interface LoadedContent {
  content: string;
  sha: string | null;
  isDraft: boolean;
}

function contentPath(slug: string): string {
  return `src/content/projects/${slug}.md`;
}

/**
 * Si hay un borrador más nuevo que su última publicación, se precarga ese.
 * Si no, se trae el archivo real desde GitHub — nunca se edita a ciegas
 * contenido desactualizado.
 */
export async function loadContent(slug: string): Promise<LoadedContent> {
  const draftSnap = await getDoc(doc(db, "adminDrafts", slug));
  const draft = draftSnap.exists() ? (draftSnap.data() as DraftDoc) : null;

  const hasPendingDraft =
    draft != null && (!draft.publishedAt || (draft.updatedAt?.toMillis() ?? 0) > draft.publishedAt.toMillis());

  const file = await getFile(contentPath(slug));

  if (hasPendingDraft && draft) {
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
  await setDoc(
    doc(db, "adminDrafts", slug),
    { content, publishedAt: serverTimestamp() },
    { merge: true },
  );
}
