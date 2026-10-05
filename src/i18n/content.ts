import { getEntry, render, type CollectionEntry } from "astro:content";
import { profile, type ProfileData } from "../data/profile";
import { PROJECTS, type ProjectItem } from "../data/projects";
import { localizePath, type Lang } from "./config";
import { contentEn } from "./content.en";

function replaceWords(value: string, map: Record<string, string>): string {
  return Object.entries(map).reduce((text, [from, to]) => text.split(from).join(to), value);
}

/** `profile.json` en el idioma pedido, con los `href` internos ya localizados (100). */
export function getProfile(lang: Lang): ProfileData {
  const { header, about } = profile;
  const isEn = lang === "en";
  const en = contentEn.profile;
  const localizeCta = <T extends { label: string; href: string }>(cta: T): T => ({
    ...cta,
    label: isEn ? (en.ctaLabels[cta.label] ?? cta.label) : cta.label,
    href: localizePath(cta.href, lang),
  });

  return {
    header: {
      ...header,
      tagline: isEn ? en.tagline : header.tagline,
      primaryCta: localizeCta(header.primaryCta),
      secondaryCta: header.secondaryCta && localizeCta(header.secondaryCta),
    },
    about: {
      ...about,
      bio: isEn ? en.bio : about.bio,
      study: {
        ...about.study,
        period: isEn ? replaceWords(about.study.period, en.studyPeriod) : about.study.period,
      },
      social: about.social.map((link) => ({
        ...link,
        label: isEn ? (en.socialLabels[link.label] ?? link.label) : link.label,
      })),
    },
  };
}

/** `projects.json` (listado de `/proyectos`) en el idioma pedido, con `link` localizado. */
export function getProjects(lang: Lang): ProjectItem[] {
  return PROJECTS.map((project) => {
    const en = lang === "en" ? contentEn.projects[project.id] : undefined;
    return {
      ...project,
      title: en?.title ?? project.title,
      description: en?.description ?? project.description,
      link: localizePath(project.link, lang),
    };
  });
}

export function skillCategoryLabel(category: string, lang: Lang): string {
  return lang === "en" ? (contentEn.skillCategories[category] ?? category) : category;
}

type ProjectData = CollectionEntry<"projects">["data"];

/**
 * Combina un proyecto en español con su traducción de `projectsEn` (si existe): textos del inglés,
 * todo lo demás (valores copiables, hrefs, imágenes, servidores) del español. Los pasos se combinan
 * por índice, así que un paso o etiqueta sin traducir queda en español.
 */
export function localizeProjectData(data: ProjectData, en?: CollectionEntry<"projectsEn">["data"]): ProjectData {
  if (!en) return data;
  return {
    ...data,
    title: en.title ?? data.title,
    summary: en.summary ?? data.summary,
    steps: data.steps.map((step, index) => {
      const enStep = en.steps?.[index];
      if (!enStep) return step;
      return {
        ...step,
        text: enStep.text ?? step.text,
        copyText: step.copyText?.map((item, i) => ({ ...item, label: enStep.copyLabels?.[i] ?? item.label })),
        buttons: step.buttons?.map((button, i) => ({ ...button, label: enStep.buttonLabels?.[i] ?? button.label })),
      };
    }),
  };
}

/** Datos + cuerpo Markdown ("Contexto") de un proyecto en el idioma pedido. */
export async function getLocalizedProject(entry: CollectionEntry<"projects">, lang: Lang) {
  const enEntry = lang === "en" ? await getEntry("projectsEn", entry.id) : undefined;
  const { Content } = await render(enEntry ?? entry);
  return { data: localizeProjectData(entry.data, enEntry?.data), Content };
}
