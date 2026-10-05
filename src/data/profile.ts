import profileJson from "./profile.json";

export interface Cta {
  label: string;
  href: string;
}

export interface HeaderPortraitFrame {
  /** Clave del manifest de Cloudinary (src/data/cloudinaryManifest.json), mismo criterio que el
   *  resto de `imageKey` del sitio (065/068). */
  imageKey: string;
  /** Palabra vertical del retrato (ver HeaderPortrait.astro): sobre la pierna en PC, detrás de la
   *  persona en móvil (094). Puede repetirse
   *  o quedar vacía; sin validación de longitud (mismo criterio permisivo que el resto del panel). */
  word: string;
  /** Lado de la palabra (094), visto de frente a la foto: depende de hacia dónde mira la persona.
   *  PC: sobre la pierna izquierda o derecha. Ausente = "right". */
  wordSideDesktop?: PortraitWordSide;
  /** Móvil (vertical y horizontal): costado del cuerpo por el que asoma, detrás de la persona.
   *  Ausente = "left". */
  wordSideMobile?: PortraitWordSide;
}

export type PortraitWordSide = "left" | "right";

export interface HeaderData {
  /** Nombre completo; cada línea se muestra en su propio renglón del título. */
  nameLines: string[];
  /** 1 a N frames que rotan en bucle (ver `HeaderPortrait.astro`). Con 1 solo frame no hay
   *  rotación visible. */
  portraitFrames: HeaderPortraitFrame[];
  /** Segundos entre cambio de frame. Ignorado (sin temporizador) si `portraitFrames.length <= 1`. */
  portraitIntervalSeconds: number;
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
  /** Clave del manifest de Cloudinary del retrato de Sobre mí (091); sin valor → `about/persona03`. */
  portraitKey?: string;
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
