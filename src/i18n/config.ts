/**
 * Idiomas del sitio público (100): español por defecto en las URLs de siempre, inglés bajo `/en/`.
 * No usa el `i18n` de `astro.config.mjs` — el idioma sale del pathname (receta "manual" de la guía
 * de i18n de Astro), así el middleware de Astro no toca `/admin` ni los endpoints on-demand.
 */
export const LANGS = ["es", "en"] as const;
export type Lang = (typeof LANGS)[number];
export const DEFAULT_LANG: Lang = "es";

/** Clave de `localStorage` con la elección manual del toggle (ver `LangToggle.tsx`/`BaseLayout`). */
export const LANG_STORAGE_KEY = "lang";

const EN_PREFIX = /^\/en(\/|$)/;

export function getLangFromPath(pathname: string): Lang {
  return EN_PREFIX.test(pathname) ? "en" : "es";
}

export function getLang(url: URL): Lang {
  return getLangFromPath(url.pathname);
}

/** Quita el prefijo de idioma: `/en/proyectos/x` → `/proyectos/x`, `/en` → `/`. */
export function stripLangPrefix(pathname: string): string {
  return pathname.replace(EN_PREFIX, "/");
}

/**
 * Antepone `/en` a rutas internas absolutas (`/…`). Externas, `mailto:`, `#ancla` y rutas ya
 * localizadas quedan igual, así se puede pasar cualquier `href` del contenido sin revisarlo antes.
 */
export function localizePath(path: string, lang: Lang): string {
  if (lang === DEFAULT_LANG || !path.startsWith("/") || path.startsWith("//") || EN_PREFIX.test(path)) {
    return path;
  }
  return path === "/" ? "/en/" : `/en${path}`;
}

export function switchLangPath(pathname: string, target: Lang): string {
  return localizePath(stripLangPrefix(pathname), target);
}

/** `/` o `/en`/`/en/` — usado por el dot-nav de Inicio para decidir entre scroll y navegar. */
export function isHomePath(pathname: string): boolean {
  return stripLangPrefix(pathname) === "/";
}
