import { getCollection } from "astro:content";
import { getCloudinaryUrl, getCloudinaryColors } from "../../utils/cloudinaryManifest";
import { PROJECTS } from "../../data/projects";

export interface ProjectCardData {
  slug: string;
  title: string;
  date: string;
  imageSrc?: string;
  colors: [string, string];
}

export interface ProjectYearGroup {
  year: string;
  projects: ProjectCardData[];
}

// Mismo join que usa `/proyectos/[slug].astro` para el selector rápido de
// 037: la fecha vive en `PROJECTS` (src/data/projects.ts), la portada real
// en el content collection — ambos emparejados por `id === slug`. Usado
// tanto por el listado agrupado (`buildProjectCardGroups`) como por el
// selector rápido plano del dot-nav de admin (`ProjectSwitcherPanel`, 054).
export async function buildProjectCards(): Promise<ProjectCardData[]> {
  const entries = await getCollection("projects");

  const cards: ProjectCardData[] = entries.map((entry) => {
    const item = PROJECTS.find((project) => project.id === entry.id);
    return {
      slug: entry.id,
      title: entry.data.title,
      date: item?.date ?? "0000-00",
      imageSrc: getCloudinaryUrl(entry.data.coverImage, "w_400,h_300,c_fill,q_auto,f_auto"),
      // Mismo criterio que /proyectos/[slug].astro: override manual del
      // frontmatter si existe, si no los 2 colores dominantes reales de la
      // portada (Cloudinary manifest, 036).
      colors: entry.data.sphereColors ?? getCloudinaryColors(entry.data.coverImage),
    };
  });

  return [...cards].sort((a, b) => b.date.localeCompare(a.date));
}

export async function buildProjectCardGroups(): Promise<ProjectYearGroup[]> {
  const sorted = await buildProjectCards();

  const groups: ProjectYearGroup[] = [];
  for (const card of sorted) {
    const year = card.date.slice(0, 4);
    let group = groups.find((candidate) => candidate.year === year);
    if (!group) {
      group = { year, projects: [] };
      groups.push(group);
    }
    group.projects.push(card);
  }

  return groups;
}
