import managedProjectsJson from "./managedProjects.json";

/**
 * Proyecto en construcción seguido desde `/admin/gestor` (feature 087). Su desglose de etapas NO
 * vive acá: vive como Markdown en el repo del propio proyecto (`etapasPath`).
 */
export interface ManagedProject {
  /** Coincide con el slug del content collection si el proyecto ya tiene página pública. */
  id: string;
  title: string;
  /** `owner/repo` en GitHub. */
  repo: string;
  /** Opcional: sin esto se usa la rama por defecto real del repo. */
  branch?: string;
  /** Opcional: por defecto `.claude/spec/etapas.md`. */
  etapasPath?: string;
  /** `YYYY-MM` en que arrancó — solo informativo en la tarjeta. */
  startedAt?: string;
}

export const MANAGED_PROJECTS: ManagedProject[] = managedProjectsJson as ManagedProject[];
