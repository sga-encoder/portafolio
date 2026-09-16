import projectsJson from "./projects.json";

export interface ProjectItem {
  id: string;
  title: string;
  description: string;
  /** Clave del manifest de Cloudinary (src/data/cloudinaryManifest.json); opcional mientras no haya foto real. */
  imageKey?: string;
  link: string;
  /** Mes/año en que se hizo el proyecto (`"YYYY-MM"`) — usado para agrupar/ordenar el listado en `/proyectos`. */
  date: string;
}

export const PROJECTS: ProjectItem[] = projectsJson as ProjectItem[];
