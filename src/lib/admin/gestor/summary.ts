import { listCommits, type RepoCommit } from "../github";
import { parseEtapas, progressOfDoc, type DocProgress } from "./etapas";
import { loadEtapas } from "./etapasStore";
import type { ManagedProject } from "./registry";

// Resumen de una tarjeta del listado de `/admin/gestor` (feature 087): 3 llamadas a GitHub por
// proyecto (rama por defecto — cacheada —, archivo de etapas y último commit). El detalle de
// commits NO se pide acá: se trae al abrir el proyecto, para no gastar el límite de tasa en datos
// que nadie está mirando.

export interface ProjectSummary {
  project: ManagedProject;
  progress: DocProgress | null;
  /** `false` → el repo todavía no tiene el archivo de etapas; el panel ofrece crearlo. */
  exists: boolean;
  isDraft: boolean;
  lastCommit: RepoCommit | null;
  error: string | null;
}

/** Nunca lanza: un proyecto que falla se muestra con su error, sin tumbar el resto del listado. */
export async function loadSummary(project: ManagedProject): Promise<ProjectSummary> {
  try {
    const loaded = await loadEtapas(project);
    const doc = loaded.content.trim() ? parseEtapas(loaded.content) : null;

    let lastCommit: RepoCommit | null = null;
    try {
      lastCommit = (await listCommits(loaded.ref, 1))[0] ?? null;
    } catch {
      // Un repo sin commits todavía (o sin permiso de lectura de commits) no invalida el progreso.
      lastCommit = null;
    }

    return {
      project,
      progress: doc ? progressOfDoc(doc) : null,
      exists: loaded.exists,
      isDraft: loaded.isDraft,
      lastCommit,
      error: null,
    };
  } catch (err) {
    return {
      project,
      progress: null,
      exists: false,
      isDraft: false,
      lastCommit: null,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
