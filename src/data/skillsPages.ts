import skillsPagesJson from "./skillsPages.json";

export type SkillCategory = "lenguajes" | "herramientas" | "diseño" | "frameworks";

export interface Skill {
  name: string;
  percentage: number;
  /** Clave del manifest de Cloudinary (src/data/cloudinaryManifest.json). */
  imageKey: string;
  category: SkillCategory;
}

export type SkillsColumnType = "skills" | "image";

export interface SkillsColumn {
  type: SkillsColumnType;
  /** Solo si type === "skills". `[]` es válido (columna presente, sin habilidades todavía). */
  skills?: Skill[];
  /** Solo si type === "image". Clave del manifest de Cloudinary. */
  imageKey?: string;
}

export interface SkillsPage {
  /** 1 a 3 columnas. Sin mínimo fijo — el orden del array es el orden visual izq→der en desktop. */
  columns: SkillsColumn[];
}

/**
 * Editable desde `/admin/contenido` (pestaña "Habilidades", `069`): este archivo solo tipa e
 * importa `skillsPages.json`. Reemplaza a `skills.ts`/`skills.json` (`065`, eliminados en `068`) —
 * `side: "left" | "right"` desaparece del `Skill`: la posición la da el índice de la columna
 * dentro de `page.columns`, no un campo propio. Ver
 * .claude/spec/features/068-habilidades-carrusel-columnas/plan.md.
 */
export const skillsPages: SkillsPage[] = skillsPagesJson as SkillsPage[];
