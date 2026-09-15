import skillsJson from "./skills.json";

export type SkillCategory = "lenguajes" | "herramientas" | "diseño" | "frameworks";

export interface Skill {
  name: string;
  percentage: number;
  /** Clave del manifest de Cloudinary (src/data/cloudinaryManifest.json). */
  imageKey: string;
  side: "left" | "right";
  category: SkillCategory;
}

/** Orden exacto de `spec.md`: define tanto el orden vertical/chevron dentro de su columna en desktop como el orden dentro de su categoría en mobile. */
export const skills: Skill[] = skillsJson as Skill[];

export const leftSkills = skills.filter((skill) => skill.side === "left");
export const rightSkills = skills.filter((skill) => skill.side === "right");

/** Orden fijo de categorías para el layout mobile (una fila por categoría). */
export const MOBILE_CATEGORY_ORDER: SkillCategory[] = ["lenguajes", "herramientas", "frameworks", "diseño"];

export const skillsByCategory: Record<SkillCategory, Skill[]> = {
  lenguajes: skills.filter((skill) => skill.category === "lenguajes"),
  herramientas: skills.filter((skill) => skill.category === "herramientas"),
  diseño: skills.filter((skill) => skill.category === "diseño"),
  frameworks: skills.filter((skill) => skill.category === "frameworks"),
};
