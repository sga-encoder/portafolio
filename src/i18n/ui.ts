import type { Lang } from "./config";

/**
 * Textos de interfaz del sitio público (100). `es` define las claves; `en` se tipa contra él, así una
 * clave sin traducir es un error de tipos y no un texto vacío en producción. El contenido editable
 * desde `/admin` (perfil, proyectos) no vive acá — ver `content.en.ts`.
 */
const es = {
  "site.description": "Portafolio personal: hoja de vida y blog.",
  "home.description": "Hoja de vida interactiva y blog personal.",
  "projects.title": "Proyectos",
  "projects.description": "Todos los proyectos, organizados por año y mes.",

  "nav.main": "Navegación principal",
  "nav.sections": "Navegación de secciones",
  "nav.home": "Inicio",
  "nav.skills": "Habilidades",
  "nav.projects": "Proyectos",
  "nav.about": "Sobre mí",
  "nav.allProjects": "Ver todos los proyectos",
  "nav.projectsPager": "Navegación entre proyectos",
  "nav.prevProject": "Proyecto anterior",
  "nav.nextProject": "Próximo proyecto",
  "nav.switchProject": "Cambiar de proyecto",
  "nav.langToggle": "English",
  "nav.timeline": "Navegación de la línea de tiempo",

  "home.portraitAlt": "Retrato de",
  "home.skillsTitle": "Habilidades",
  "home.projectsTitle": "Proyectos",
  "home.aboutTitle": "Sobre mí",
  "home.studies": "Estudios:",
  "home.contact": "Contacto:",
  "home.fullPortraitAlt": "Retrato de cuerpo completo del autor",
  "home.illustratedPortraitAlt": "Retrato ilustrado del autor",

  "carousel.prevProject": "Proyecto anterior",
  "carousel.nextProject": "Siguiente proyecto",
  "carousel.seeMore": "Ver más",
  "skills.prevPage": "Página anterior",
  "skills.nextPage": "Página siguiente",
  "skills.goToPage": "Ir a la página",

  "project.repo": "Repositorio",
  "project.mobile": "Móvil",
  "project.desktop": "PC",
  "project.description": "Descripción",
  "project.context": "Contexto",
  "project.content": "Contenido",
  "project.liveSteps": "Cómo verlo en vivo",
  "project.wakeStep":
    "El backend de este proyecto puede estar dormido por inactividad (plan gratuito) — despertalo antes de entrar al demo.",
  "project.demoStep": "Prueba el proyecto ya desplegado.",
  "project.demo": "Ver demo",
  "project.copy": "Copiar",
  "project.copied": "¡Copiado!",
  "project.wakeButton": "Despertar backend",
  "project.lockedHint": "Bloqueado — despertá el backend en el paso 1 para usar",
  "project.waking": "Despertando el backend…",
  "project.wakingSlow": "Esto está tardando más de lo esperado…",
  "project.wakeReady": "✓ Backend listo (respondió en {s}s)",
  "project.wakeTimeout": "No respondió a tiempo — igual podés intentar abrir el link",

  "gallery.prev": "Imagen anterior",
  "gallery.next": "Siguiente imagen",
  "gallery.enlarge": "Ver imagen en grande",
  "gallery.goTo": "Ir a la imagen",
  "gallery.close": "Cerrar imagen",
  "gallery.portrait": "Volver a posición vertical",
  "gallery.landscape": "Ver en posición horizontal",

  "like.button": "Dar like a este proyecto",
  "like.firstName": "Nombre",
  "like.lastName": "Apellido",
  "like.contactLink": "Link de contacto",
  "like.message": "Mensaje",
  "like.optional": "(opcional)",
  "like.cancel": "Cancelar",
  "like.submit": "Dar like",
};

export type UiKey = keyof typeof es;

const en: Record<UiKey, string> = {
  "site.description": "Personal portfolio: résumé and blog.",
  "home.description": "Interactive résumé and personal blog.",
  "projects.title": "Projects",
  "projects.description": "All projects, organized by year and month.",

  "nav.main": "Main navigation",
  "nav.sections": "Section navigation",
  "nav.home": "Home",
  "nav.skills": "Skills",
  "nav.projects": "Projects",
  "nav.about": "About me",
  "nav.allProjects": "See all projects",
  "nav.projectsPager": "Project navigation",
  "nav.prevProject": "Previous project",
  "nav.nextProject": "Next project",
  "nav.switchProject": "Switch project",
  "nav.langToggle": "Español",
  "nav.timeline": "Timeline navigation",

  "home.portraitAlt": "Portrait of",
  "home.skillsTitle": "Skills",
  "home.projectsTitle": "Projects",
  "home.aboutTitle": "About me",
  "home.studies": "Education:",
  "home.contact": "Contact:",
  "home.fullPortraitAlt": "Full-body portrait of the author",
  "home.illustratedPortraitAlt": "Illustrated portrait of the author",

  "carousel.prevProject": "Previous project",
  "carousel.nextProject": "Next project",
  "carousel.seeMore": "See more",
  "skills.prevPage": "Previous page",
  "skills.nextPage": "Next page",
  "skills.goToPage": "Go to page",

  "project.repo": "Repository",
  "project.mobile": "Mobile",
  "project.desktop": "Desktop",
  "project.description": "Description",
  "project.context": "Context",
  "project.content": "Content",
  "project.liveSteps": "See it live",
  "project.wakeStep":
    "This project's backend may be asleep due to inactivity (free plan) — wake it up before opening the demo.",
  "project.demoStep": "Try the deployed project.",
  "project.demo": "View demo",
  "project.copy": "Copy",
  "project.copied": "Copied!",
  "project.wakeButton": "Wake up backend",
  "project.lockedHint": "Locked — wake up the backend in step 1 to use",
  "project.waking": "Waking up the backend…",
  "project.wakingSlow": "This is taking longer than expected…",
  "project.wakeReady": "✓ Backend ready (responded in {s}s)",
  "project.wakeTimeout": "It didn't respond in time — you can still try opening the link",

  "gallery.prev": "Previous image",
  "gallery.next": "Next image",
  "gallery.enlarge": "View larger image",
  "gallery.goTo": "Go to image",
  "gallery.close": "Close image",
  "gallery.portrait": "Back to portrait",
  "gallery.landscape": "View in landscape",

  "like.button": "Like this project",
  "like.firstName": "First name",
  "like.lastName": "Last name",
  "like.contactLink": "Contact link",
  "like.message": "Message",
  "like.optional": "(optional)",
  "like.cancel": "Cancel",
  "like.submit": "Like",
};

const UI: Record<Lang, Record<UiKey, string>> = { es, en };

export function useTranslations(lang: Lang) {
  return (key: UiKey): string => UI[lang][key];
}

/** Locale de `Intl` por idioma (meses en listado/encabezado/selector rápido). */
export const INTL_LOCALE: Record<Lang, string> = { es: "es", en: "en" };
