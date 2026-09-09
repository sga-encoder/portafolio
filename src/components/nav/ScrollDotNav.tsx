import { useSectionScroll } from "../scene/useSectionScroll";
import { SECTION_IDS } from "../scene/sceneStops";
import { SCROLL_NAV_ITEMS } from "../../data/scrollNav";

function scrollToSection(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  el.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
}

/**
 * Dot-nav vertical fijo en el lateral izquierdo: un punto por sección del CV
 * (gris salvo el activo, que toma el color dinámico del fondo 3D). El label
 * de cada punto solo aparece en hover/focus de ese punto, vía CSS
 * (`group-hover`/`group-focus-within`), sin estado React adicional.
 */
export default function ScrollDotNav() {
  const { activeIndex } = useSectionScroll(SECTION_IDS);

  return (
    <nav
      aria-label="Navegación de secciones"
      className="fixed left-4 top-1/2 z-30 hidden -translate-y-1/2 flex-col gap-4 md:flex md:left-6"
    >
      <ul className="flex flex-col gap-4">
        {SCROLL_NAV_ITEMS.map((item, index) => {
          const isActive = index === activeIndex;
          return (
            <li key={item.id} className="group relative flex items-center">
              <button
                type="button"
                aria-label={item.label}
                aria-current={isActive ? "true" : undefined}
                onClick={() => scrollToSection(item.id)}
                className="relative z-10 h-3 w-3 rounded-full transition-colors duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-(--color-brand)"
                style={{
                  backgroundColor: isActive
                    ? "var(--sphere-left-color, var(--color-brand))"
                    : "var(--color-ink-muted)",
                }}
              />
              <span
                className="scroll-dot-label pointer-events-none absolute left-full ml-3 whitespace-nowrap rounded-lg px-3 py-1.5 font-body text-base font-semibold"
                style={{
                  backgroundColor: "#000622",
                  color: "var(--sphere-left-color, var(--color-brand))",
                  boxShadow: "0 4px 16px -2px var(--sphere-left-color, var(--color-brand))",
                }}
              >
                {item.label}
              </span>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
