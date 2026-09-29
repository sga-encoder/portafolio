import { doc, getDoc, serverTimestamp, setDoc, type Timestamp } from "firebase/firestore";
import { db } from "../../firebase";
import { getFile, putFile, resolveRef, type RepoRef } from "../github";
import { draftIdOf, etapasPathOf, type ManagedProject } from "./registry";

// Borrador/publicación del `etapas.md` de un proyecto gestionado (feature 087). Mismo patrón exacto
// que `drafts.ts` (043) — autoguardado en Firestore, "Publicar" hace el commit real — con una sola
// diferencia: el commit va al repo DEL PROYECTO, no al del portafolio. Ver
// .claude/spec/features/087-gestor-proyectos-etapas/plan.md.

interface EtapasDraftDoc {
  content: string;
  updatedAt: Timestamp | null;
  publishedAt: Timestamp | null;
  createdAt: Timestamp | null;
}

export interface LoadedEtapas {
  /** Markdown crudo (borrador pendiente si lo hay, si no el del repo). */
  content: string;
  sha: string | null;
  isDraft: boolean;
  /** `false` cuando el archivo todavía no existe en el repo → el panel ofrece crearlo. */
  exists: boolean;
  ref: RepoRef;
  path: string;
}

function isDraftPending(draft: EtapasDraftDoc | null): boolean {
  return draft != null && (!draft.publishedAt || (draft.updatedAt?.toMillis() ?? 0) > draft.publishedAt.toMillis());
}

/**
 * Resuelve la rama real del repo antes de pedir el archivo: varios repos viejos del autor están en
 * `master`, y asumir `main` daría un 404 indistinguible de "el archivo no existe".
 */
export async function loadEtapas(project: ManagedProject): Promise<LoadedEtapas> {
  const ref = await resolveRef(project.repo, project.branch);
  const path = etapasPathOf(project);

  const draftSnap = await getDoc(doc(db, "adminDrafts", draftIdOf(project)));
  const draft = draftSnap.exists() ? (draftSnap.data() as EtapasDraftDoc) : null;

  const file = await getFile(path, ref);
  const pending = isDraftPending(draft);

  if (pending && draft) {
    return { content: draft.content, sha: file?.sha ?? null, isDraft: true, exists: file != null, ref, path };
  }

  return { content: file?.content ?? "", sha: file?.sha ?? null, isDraft: false, exists: file != null, ref, path };
}

export async function saveEtapasDraft(project: ManagedProject, content: string): Promise<void> {
  await setDoc(
    doc(db, "adminDrafts", draftIdOf(project)),
    { content, updatedAt: serverTimestamp() },
    { merge: true },
  );
}

/** Devuelve el sha nuevo del archivo, para que el siguiente "Publicar" no choque con un 409. */
export async function publishEtapas(
  project: ManagedProject,
  content: string,
  sha: string | null,
  ref: RepoRef,
): Promise<string | null> {
  const newSha = await putFile(etapasPathOf(project), content, `gestor: actualizar etapas`, sha ?? undefined, ref);

  const draftId = draftIdOf(project);
  const draftSnap = await getDoc(doc(db, "adminDrafts", draftId));
  const hasCreatedAt = draftSnap.exists() && (draftSnap.data() as EtapasDraftDoc).createdAt != null;

  await setDoc(
    doc(db, "adminDrafts", draftId),
    {
      content,
      publishedAt: serverTimestamp(),
      ...(hasCreatedAt ? {} : { createdAt: serverTimestamp() }),
    },
    { merge: true },
  );

  return newSha;
}
