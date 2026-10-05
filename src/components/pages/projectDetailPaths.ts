import { getCollection } from "astro:content";
import { PROJECTS } from "../../data/projects";

/** `getStaticPaths` de `/proyectos/[slug]` y `/en/proyectos/[slug]` (100): mismos slugs en ambos idiomas. */
export async function getProjectDetailPaths() {
  const projects = await getCollection("projects");
  const order = PROJECTS.map((item) => item.id);

  return projects.map((project) => {
    const index = order.indexOf(project.id);
    const prevSlug = index > 0 ? order[index - 1] : undefined;
    const nextSlug = index >= 0 && index < order.length - 1 ? order[index + 1] : undefined;
    return {
      params: { slug: project.id },
      props: { project, prevSlug, nextSlug },
    };
  });
}
