import type { ImageMetadata } from "astro";
import proyecto01 from "../assets/projects/proyecto-01.jpg";

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

export const PROJECTS: ProjectItem[] = [
  {
    id: "pelis",
    title: "Pelis",
    description:
      "Mi primera web: la hice siguiendo un curso de YouTube (HTML, CSS y JS puro). La subo para mostrar mi evolución con el tiempo.",
    // Portada temporal mientras integro un servicio de imágenes (p. ej. Cloudinary) para las capturas reales.
    image: proyecto01,
    link: "/proyectos/pelis",
    date: "2020-10",
  },
  {
    id: "practica-estilos",
    title: "Práctica de estilos",
    description:
      "Segundo proyecto de aprendizaje: practiqué mucho CSS con React, siguiendo tutoriales de YouTube.",
    // Portada temporal mientras integro un servicio de imágenes (p. ej. Cloudinary) para las capturas reales.
    image: proyecto01,
    link: "/proyectos/practica-estilos",
    date: "2021-03",
  },
  {
    id: "blog-semillero",
    title: "Blog del Semillero",
    description:
      "Blog hecho para un semillero de investigación universitario, para mostrar sus avances (Next.js + Strapi).",
    // Portada temporal mientras integro un servicio de imágenes (p. ej. Cloudinary) para las capturas reales.
    image: proyecto01,
    link: "/proyectos/blog-semillero",
    date: "2022-11",
  },
  {
    id: "city-builder",
    title: "City Builder",
    description:
      "Juego de construcción de ciudad hecho para la universidad, con patrones de diseño y renderización reactiva propia (sin frameworks).",
    // Portada temporal mientras integro un servicio de imágenes (p. ej. Cloudinary) para las capturas reales.
    image: proyecto01,
    link: "/proyectos/city-builder",
    date: "2026-04",
  },
  {
    id: "class-manager",
    title: "Class Manager",
    description:
      "Aplicación para gestionar clases, cursos y estudiantes — solo frontend, hecha con React.",
    // Portada temporal mientras integro un servicio de imágenes (p. ej. Cloudinary) para las capturas reales.
    image: proyecto01,
    link: "/proyectos/class-manager",
    date: "2026-05",
  },
];
