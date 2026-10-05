/**
 * Traducción al inglés del contenido de Inicio que se edita desde `/admin` en español (`profile.json`,
 * `projects.json`, `skillCategories.json`) — 100. El panel no edita inglés (fuera de alcance), así que
 * esto se mantiene a mano: si el español cambia y acá no, se sigue mostrando la traducción vieja; si
 * falta un campo, cae al español (`content.ts`).
 *
 * Palabras del retrato y categorías van como mapa por su valor en español (no por índice), para que
 * reordenar frames/categorías en el panel no desalinee las traducciones.
 */
export const contentEn = {
  profile: {
    tagline: "Systems Engineering Student",
    ctaLabels: {
      Proyectos: "Projects",
      Blog: "Blog",
    } as Record<string, string>,
    bio: "Let me introduce myself: I'm Sebastián Garzón Arias, a Computer Systems Engineering student at Universidad de Caldas, with prior training driven by curiosity and my passion for programming. I acquired that knowledge on my own; that's how I discovered I have a knack for learning and teaching, and it also taught me to tackle the obstacles of this kind of learning more efficiently and creatively. I'm patient in creative processes, I enjoy innovation and constant growth, and I like to closely follow how technology evolves and grow confidently along with it. What defines me most is consistency, perseverance and my ongoing drive to learn new skills.",
    studyPeriod: {
      Actualidad: "Present",
    } as Record<string, string>,
    socialLabels: {
      Pendiente: "Pending",
    } as Record<string, string>,
  },
  portraitWords: {
    INTELIGENTE: "SMART",
    CREATIVO: "CREATIVE",
    AMABLE: "KIND",
  } as Record<string, string>,
  skillCategories: {
    lenguajes: "languages",
    herramientas: "tools",
    diseño: "design",
    frameworks: "frameworks",
  } as Record<string, string>,
  projects: {
    pelis: {
      description:
        "My first website: I built it following a YouTube course (plain HTML, CSS and JS). I'm keeping it here to show how I've grown over time.",
    },
    "practica-estilos": {
      title: "Style Gallery",
      description: "My second learning project: lots of CSS practice with React, following YouTube tutorials.",
    },
    "blog-semillero": {
      title: "Research Group Blog",
      description: "A blog built for a university research group to showcase its progress (Next.js + Strapi).",
    },
    montaneros: {
      description: "A tourism directory built as a school project, with a Payload CMS backend and a Next.js frontend.",
    },
    "city-builder": {
      description:
        "A city-building game made for university, using design patterns and a custom reactive renderer (no frameworks).",
    },
    "class-manager": {
      description: "An app to manage classes, courses and students — frontend only, built with React.",
    },
    territorial: {
      description: "A frontend project made for university, featuring an interactive map (Next.js + Tailwind CSS).",
    },
  } as Record<string, { title?: string; description?: string }>,
};
