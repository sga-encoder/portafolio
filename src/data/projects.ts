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
  /** Mes/año en que se hizo el proyecto (`"YYYY-MM"`) — usado para agrupar/ordenar el listado en `/proyectos`. */
  date: string;
}

/** Contenido placeholder — reemplaza título/descripción/link/date con los datos reales cuando los tengas. */
export const PROJECTS: ProjectItem[] = [
  {
    id: "proyecto-1",
    title: "Proyecto de ejemplo uno",
    description: "Descripción breve de qué resuelve este proyecto y con qué lo construiste.",
    image: proyecto01,
    link: "/proyectos/proyecto-1",
    date: "2025-06",
  },
  {
    id: "proyecto-2",
    title: "Proyecto de ejemplo dos",
    description: "Descripción breve de qué resuelve este proyecto y con qué lo construiste.",
    image: proyecto02,
    link: "/proyectos/proyecto-2",
    date: "2024-11",
  },
  {
    id: "proyecto-3",
    title: "Proyecto de ejemplo tres",
    description: "Descripción breve de qué resuelve este proyecto y con qué lo construiste.",
    image: proyecto03,
    link: "/proyectos/proyecto-3",
    date: "2024-02",
  },
  {
    id: "proyecto-4",
    title: "Proyecto aleja hola",
    description: "Descripción breve de qué resuelve este proyecto y con qué lo construiste.",
    image: proyecto03,
    link: "/proyectos/proyecto-4",
    date: "2024-02",
  },
];
