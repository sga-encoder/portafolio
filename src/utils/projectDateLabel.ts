const monthFormatters = {
  es: new Intl.DateTimeFormat("es", { month: "short" }),
  en: new Intl.DateTimeFormat("en", { month: "short" }),
};

/** `"2026-06"` → `"Jun 2026"`. Usado por el selector rápido de proyectos (037/054) — mismo formato en `[slug].astro` y en `AdminDotNav.tsx`. `lang` (100) solo lo pasa el sitio público; `/admin` queda en español. */
export function formatProjectDate(date: string, lang: keyof typeof monthFormatters = "es"): string {
  const [year, month] = date.split("-").map(Number);
  const label = monthFormatters[lang].format(new Date(year, month - 1, 1)).replace(".", "");
  return `${label.charAt(0).toUpperCase()}${label.slice(1)} ${year}`;
}
