import { useSectionScroll } from "../scene/useSectionScroll";
import { SECTION_IDS } from "../scene/sceneStops";
import { SCROLL_NAV_ITEMS } from "../../data/scrollNav";
import NavIcon from "./NavIcon";
import {
  NAV_BAR_MOBILE,
  NAV_BAR_MOBILE_LIST,
  NAV_ITEM_HIT_AREA,
  NAV_RAIL_DESKTOP,
  NAV_RAIL_LIST,
} from "./navRailClasses";

function scrollToSection(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  el.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
}

const circleStyle = (color: string) =>
  ({
    border: `2px solid ${color}`,
    color,
    backgroundColor: "color-mix(in srgb, var(--color-surface) 80%, transparent)",
  }) as const;

/**
 * Dot-nav vertical fijo en el lateral izquierdo: un círculo con ícono por
 * sección del CV (gris salvo el activo, que toma el color dinámico del
 * fondo 3D). El label de cada ítem solo aparece en hover/focus, vía CSS
 * (`group-hover`/`group-focus-within`), sin estado React adicional.
 */
export default function ScrollDotNav() {
  const { activeIndex } = useSectionScroll(SECTION_IDS);

  return (
    <>
      <nav aria-label="Navegación de secciones" className={NAV_RAIL_DESKTOP}>
        <ul className={NAV_RAIL_LIST}>
          {SCROLL_NAV_ITEMS.map((item, index) => {
            const isActive = index === activeIndex;
            const color = isActive
              ? "var(--sphere-left-color, var(--color-brand))"
              : "var(--color-ink-muted)";
            return (
              <li key={item.id} className="group relative flex items-center">
                <button
                  type="button"
                  aria-label={item.label}
                  aria-current={isActive ? "true" : undefined}
                  onClick={() => scrollToSection(item.id)}
                  className="relative z-10 flex h-9 w-9 items-center justify-center rounded-full transition-transform duration-200 hover:scale-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-(--color-brand)"
                  style={circleStyle(color)}
                >
                  <NavIcon icon={item.icon} />
                </button>
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

      <nav aria-label="Navegación de secciones" className={NAV_BAR_MOBILE}>
        <ul className={NAV_BAR_MOBILE_LIST}>
          {SCROLL_NAV_ITEMS.map((item, index) => {
            const isActive = index === activeIndex;
            const color = isActive
              ? "var(--sphere-left-color, var(--color-brand))"
              : "var(--color-ink-muted)";
            return (
              <li key={item.id} className="flex items-center">
                <button
                  type="button"
                  aria-label={item.label}
                  aria-current={isActive ? "true" : undefined}
                  onClick={() => scrollToSection(item.id)}
                  className={NAV_ITEM_HIT_AREA}
                >
                  <span
                    className="flex h-9 w-9 items-center justify-center rounded-full transition-transform duration-200 active:scale-95"
                    style={circleStyle(color)}
                  >
                    <NavIcon icon={item.icon} />
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
