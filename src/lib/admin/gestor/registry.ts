import { loadJsonContent, publishJson, saveJsonDraft, type LoadedJsonContent } from "../jsonContent";
import type { ManagedProject } from "../../../data/managedProjects";

// Registro de proyectos en construcción del gestor (feature 087). Vive como archivo en ESTE repo
// (`src/data/managedProjects.json`) con el mismo mecanismo borrador(Firestore)/publicar(commit) que
// ya usan las pestañas de `/admin/contenido` (064), reusando `jsonContent.ts`.
//
// Prefijo de doc-id reservado en `adminDrafts`: `gestor:` — `gestor:index` para este registro y
// `gestor:<id>` para el `etapas.md` de cada proyecto (análogo al prefijo `home:` de 064). No hace
// falta tocar `firestore.rules`: ya permite cualquier doc-id de `adminDrafts` al admin.

export const REGISTRY_DRAFT_ID = "gestor:index";
export const REGISTRY_FILE_PATH = "src/data/managedProjects.json";

export const DEFAULT_ETAPAS_PATH = ".claude/spec/etapas.md";

export type { ManagedProject };

export function loadManagedProjects(): Promise<LoadedJsonContent<ManagedProject[]>> {
  return loadJsonContent<ManagedProject[]>(REGISTRY_DRAFT_ID, REGISTRY_FILE_PATH);
}

export function saveManagedDraft(projects: ManagedProject[]): Promise<void> {
  return saveJsonDraft(REGISTRY_DRAFT_ID, projects);
}

export function publishManaged(projects: ManagedProject[], sha: string | null): Promise<string | null> {
  return publishJson(REGISTRY_DRAFT_ID, REGISTRY_FILE_PATH, projects, sha);
}

export function etapasPathOf(project: ManagedProject): string {
  return project.etapasPath?.trim() || DEFAULT_ETAPAS_PATH;
}

export function draftIdOf(project: ManagedProject): string {
  return `gestor:${project.id}`;
}

/** `owner/repo` a partir de lo que se pegue en el alta: URL completa, `git@…` o ya normalizado. */
export function normalizeRepo(raw: string): string {
  return raw
    .trim()
    .replace(/^git@github\.com:/, "")
    .replace(/^https?:\/\/(www\.)?github\.com\//, "")
    .replace(/\.git$/, "")
    .replace(/^\/+|\/+$/g, "");
}
