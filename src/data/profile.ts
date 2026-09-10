export interface Cta {
  label: string;
  href: string;
}

export interface HeaderData {
  /** Nombre completo; cada línea se muestra en su propio renglón del título. */
  nameLines: string[];
  /** Iniciales mostradas en vertical junto al retrato (ver `HeaderPortrait.astro`). */
  initials: string;
  tagline: string;
  primaryCta: Cta;
  /** Oculto a propósito (026): el blog sigue sin contenido (backlog en roadmap.md).
   *  Se deja el dato definido, sin borrar, para reactivarlo con solo volver a pasarlo
   *  a `HeaderTextBlock` — mismo criterio de reversibilidad que 011. */
  secondaryCta?: Cta;
}

export interface StudyItem {
  institution: string;
  period: string;
}

export type SocialPlatform = "instagram" | "linkedin" | "email";

export interface SocialLink {
  platform: SocialPlatform;
  label: string;
  href: string;
}

export interface AboutData {
  bio: string;
  study: StudyItem;
  social: SocialLink[];
}

export interface ProfileData {
  header: HeaderData;
  about: AboutData;
}

/** Contenido placeholder — reemplázalo poco a poco, sin tocar los componentes de sección. */
export const profile: ProfileData = {
  header: {
    nameLines: ["Sebastián Garzón", "Arias"],
    initials: "SGA",
    tagline: "Estudiante de Ingeniería de Sistemas",
    // 026: apunta al listado /proyectos (todos los proyectos), no al ancla de esta misma página.
    primaryCta: { label: "Proyectos", href: "/proyectos" },
    secondaryCta: { label: "Blog", href: "/blog" },
  },
  about: {
    bio: "Cuéntanos aquí quién eres, qué te apasiona de tu trabajo y qué te diferencia. Un par de párrafos cortos son suficientes.",
    study: {
      institution: "Universidad de Caldas",
      period: "2024-2 — Actualidad",
    },
    social: [
      { platform: "instagram", label: "@sga_28_", href: "https://instagram.com/sga_28_" },
      { platform: "linkedin", label: "Pendiente", href: "#" },
      {
        platform: "email",
        label: "sebastian.garzon54795@ucaldas.edu.co",
        href: "mailto:sebastian.garzon54795@ucaldas.edu.co",
      },
    ],
  },
};
