import { useSectionScroll } from "../../scene/useSectionScroll";

interface Props {
  /** Años ya ordenados de más nuevo a más viejo — mismo orden que las zonas del fondo 3D (`projects-year-{year}`). */
  years: readonly string[];
}

function scrollToZone(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  el.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
}

/**
 * Dot-nav vertical de `/proyectos` (listado): mismo mecanismo que `ScrollDotNav.tsx`
 * de Inicio (un punto por zona, activo coloreado con el fondo 3D, label en hover),
 * pero cada punto es un año en vez de una sección fija. El primer punto no es un año:
 * es un anillo (no un punto relleno) que siempre vuelve a "/", con estilo fijo que no
 * cambia con el scroll — reemplaza al botón "Volver al inicio" suelto que tenía la página.
 */
export default function YearDotNav({ years }: Props) {
  const zoneIds = years.map((year) => `projects-year-${year}`);
  const { activeIndex } = useSectionScroll(zoneIds);

  return (
    <nav
      aria-label="Navegación de la línea de tiempo"
      className="fixed left-4 top-1/2 z-30 hidden -translate-y-1/2 flex-col gap-4 md:left-6 md:flex"
    >
      <ul className="flex flex-col gap-4">
        <li className="group relative flex items-center">
          <a
            href="/"
            aria-label="Volver al inicio"
            className="relative z-10 h-4 w-4 rounded-full border-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-(--color-brand)"
            style={{ borderColor: "var(--color-ink-muted)" }}
          />
          <span
            className="scroll-dot-label pointer-events-none absolute left-full ml-3 whitespace-nowrap rounded-lg px-3 py-1.5 font-body text-base font-semibold"
            style={{
              backgroundColor: "#000622",
              color: "var(--color-ink-muted)",
              boxShadow: "0 4px 16px -2px var(--color-ink-muted)",
            }}
          >
            Volver al inicio
          </span>
        </li>

        {years.map((year, index) => {
          const isActive = index === activeIndex;
          return (
            <li key={year} className="group relative flex items-center">
              <button
                type="button"
                aria-label={year}
                aria-current={isActive ? "true" : undefined}
                onClick={() => scrollToZone(zoneIds[index])}
                className="relative z-10 h-3 w-3 rounded-full transition-colors duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-(--color-brand)"
                style={{
                  backgroundColor: isActive
                    ? "var(--project-left-color, var(--color-brand))"
                    : "var(--color-ink-muted)",
                }}
              />
              <span
                className="scroll-dot-label pointer-events-none absolute left-full ml-3 whitespace-nowrap rounded-lg px-3 py-1.5 font-body text-base font-semibold"
                style={{
                  backgroundColor: "#000622",
                  color: "var(--project-left-color, var(--color-brand))",
                  boxShadow: "0 4px 16px -2px var(--project-left-color, var(--color-brand))",
                }}
              >
                {year}
              </span>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
