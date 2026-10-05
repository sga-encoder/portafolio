import carouselJson from "./carousel.json";

/** Carrusel de Proyectos de Inicio: ids en orden (071) + segundos entre avances automáticos (098). */
export interface CarouselConfig {
  projectIds: string[];
  /** `0` desactiva el avance automático. */
  autoplaySeconds: number;
}

export const DEFAULT_AUTOPLAY_SECONDS = 6;
export const MAX_AUTOPLAY_SECONDS = 60;

/**
 * Antes de `098` el archivo (y los borradores de `adminDrafts/home:carousel-select`) era un
 * `string[]` plano — se acepta esa forma para que un borrador viejo sin publicar siga cargando.
 */
export function normalizeCarouselConfig(raw: unknown): CarouselConfig {
  if (Array.isArray(raw)) {
    return { projectIds: raw.map(String), autoplaySeconds: DEFAULT_AUTOPLAY_SECONDS };
  }
  const value = (raw ?? {}) as Partial<CarouselConfig>;
  const seconds = Number(value.autoplaySeconds);
  return {
    projectIds: Array.isArray(value.projectIds) ? value.projectIds.map(String) : [],
    autoplaySeconds: Number.isFinite(seconds)
      ? Math.min(MAX_AUTOPLAY_SECONDS, Math.max(0, Math.round(seconds)))
      : DEFAULT_AUTOPLAY_SECONDS,
  };
}

export const CAROUSEL_CONFIG: CarouselConfig = normalizeCarouselConfig(carouselJson);

export const CAROUSEL_PROJECT_IDS: string[] = CAROUSEL_CONFIG.projectIds;
