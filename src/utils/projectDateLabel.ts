const monthFormatter = new Intl.DateTimeFormat("es", { month: "short" });

/** `"2026-06"` → `"Jun 2026"`. Usado por el selector rápido de proyectos (037/054) — mismo formato en `[slug].astro` y en `AdminDotNav.tsx`. */
export function formatProjectDate(date: string): string {
  const [year, month] = date.split("-").map(Number);
  const label = monthFormatter.format(new Date(year, month - 1, 1)).replace(".", "");
  return `${label.charAt(0).toUpperCase()}${label.slice(1)} ${year}`;
}
