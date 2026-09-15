import profileJson from "./profile.json";

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

/**
 * Editable desde `/admin/contenido` (pestaña "Secciones", 064): este archivo solo tipa e
 * importa `profile.json` — "Publicar" en el panel reescribe ese `.json` vía un commit real de
 * GitHub, este `.ts` no cambia. Ver .claude/spec/features/064-panel-contenido-secciones/plan.md.
 */
export const profile: ProfileData = profileJson as ProfileData;
