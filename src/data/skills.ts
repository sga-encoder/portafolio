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
export const skills: Skill[] = [
  { name: "JavaScript", percentage: 85, imageKey: "skills/javascript", side: "left", category: "lenguajes" },
  { name: "Python", percentage: 60, imageKey: "skills/python", side: "left", category: "lenguajes" },
  { name: "Java", percentage: 55, imageKey: "skills/java", side: "left", category: "lenguajes" },
  { name: "TypeScript", percentage: 65, imageKey: "skills/typescript", side: "left", category: "lenguajes" },
  { name: "Figma", percentage: 90, imageKey: "skills/figma", side: "left", category: "herramientas" },
  { name: "Tailwind", percentage: 70, imageKey: "skills/tailwind", side: "right", category: "diseño" },
  { name: "CSS", percentage: 80, imageKey: "skills/css", side: "right", category: "diseño" },
  { name: "Node.js", percentage: 75, imageKey: "skills/nodejs", side: "right", category: "frameworks" },
  { name: "Next.js", percentage: 65, imageKey: "skills/nextjs", side: "right", category: "frameworks" },
  { name: "React", percentage: 70, imageKey: "skills/react", side: "right", category: "frameworks" },
];

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
