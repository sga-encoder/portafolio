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

export interface Skill {
  name: string;
  percentage: number;
  image: ImageMetadata;
  side: "left" | "right";
}

/** Orden exacto de `spec.md`: define tanto el orden vertical dentro de su columna como el lado. */
export const skills: Skill[] = [
  { name: "JavaScript", percentage: 85, image: js, side: "left" },
  { name: "Python", percentage: 60, image: python, side: "left" },
  { name: "Java", percentage: 55, image: java, side: "left" },
  { name: "TypeScript", percentage: 65, image: typescript, side: "left" },
  { name: "Node.js", percentage: 75, image: nodejs, side: "left" },
  { name: "Figma", percentage: 90, image: figma, side: "right" },
  { name: "CSS", percentage: 80, image: css, side: "right" },
  { name: "Tailwind", percentage: 70, image: tailwind, side: "right" },
  { name: "Next.js", percentage: 65, image: nextjs, side: "right" },
  { name: "React", percentage: 70, image: react, side: "right" },
];

export const leftSkills = skills.filter((skill) => skill.side === "left");
export const rightSkills = skills.filter((skill) => skill.side === "right");
