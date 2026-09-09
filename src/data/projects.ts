import type { ImageMetadata } from "astro";
import proyecto01 from "../assets/projects/proyecto-01.jpg";
import proyecto02 from "../assets/projects/proyecto-02.jpg";
import proyecto03 from "../assets/projects/proyecto-03.jpg";

export interface ProjectItem {
  id: string;
  title: string;
  description: string;
  /** Preview del proyecto; opcional mientras no haya foto real (se muestra un fallback). */
  image?: ImageMetadata;
  link: string;
}

/** Contenido placeholder — reemplaza título/descripción/link con los datos reales cuando los tengas. */
export const PROJECTS: ProjectItem[] = [
  {
    id: "proyecto-1",
    title: "Proyecto de ejemplo uno",
    description: "Descripción breve de qué resuelve este proyecto y con qué lo construiste.",
    image: proyecto01,
    link: "/proyectos/proyecto-1",
  },
  {
    id: "proyecto-2",
    title: "Proyecto de ejemplo dos",
    description: "Descripción breve de qué resuelve este proyecto y con qué lo construiste.",
    image: proyecto02,
    link: "/proyectos/proyecto-2",
  },
  {
    id: "proyecto-3",
    title: "Proyecto de ejemplo tres",
    description: "Descripción breve de qué resuelve este proyecto y con qué lo construiste.",
    image: proyecto03,
    link: "/proyectos/proyecto-3",
  },
];
