import type { ImageMetadata } from "astro";
import js from "../assets/skills/01-JavaScript-85.png";
import python from "../assets/skills/02-Python-60.png";
import java from "../assets/skills/03-Java-55.png";
import typescript from "../assets/skills/04-TypeScript-65.png";
import nodejs from "../assets/skills/05-NodeJS-75.png";
import react from "../assets/skills/06-ReacJS-70.png";
import nextjs from "../assets/skills/07-NextJS-65.png";
import tailwind from "../assets/skills/08-TailWind-70.png";
import css from "../assets/skills/09-css-80.png";
import figma from "../assets/skills/10-figma-90.png";

export type SkillCategory = "lenguajes" | "herramientas" | "diseño" | "frameworks";

export interface Skill {
  name: string;
  percentage: number;
  image: ImageMetadata;
  side: "left" | "right";
  category: SkillCategory;
}

/** Orden exacto de `spec.md`: define tanto el orden vertical/chevron dentro de su columna en desktop como el orden dentro de su categoría en mobile. */
export const skills: Skill[] = [
  { name: "JavaScript", percentage: 85, image: js, side: "left", category: "lenguajes" },
  { name: "Python", percentage: 60, image: python, side: "left", category: "lenguajes" },
  { name: "Java", percentage: 55, image: java, side: "left", category: "lenguajes" },
  { name: "TypeScript", percentage: 65, image: typescript, side: "left", category: "lenguajes" },
  { name: "Figma", percentage: 90, image: figma, side: "left", category: "herramientas" },
  { name: "Tailwind", percentage: 70, image: tailwind, side: "right", category: "diseño" },
  { name: "CSS", percentage: 80, image: css, side: "right", category: "diseño" },
  { name: "Node.js", percentage: 75, image: nodejs, side: "right", category: "frameworks" },
  { name: "Next.js", percentage: 65, image: nextjs, side: "right", category: "frameworks" },
  { name: "React", percentage: 70, image: react, side: "right", category: "frameworks" },
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
