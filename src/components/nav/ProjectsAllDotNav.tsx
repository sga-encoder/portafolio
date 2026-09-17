import { useSectionScroll } from "../scene/useSectionScroll";
import { SECTION_IDS } from "../scene/sceneStops";
import NavIcon from "./NavIcon";
import {
  NAV_BAR_MOBILE_LIST,
  NAV_BAR_MOBILE_SECONDARY,
  NAV_ITEM_HIT_AREA,
  NAV_RAIL_DESKTOP_SECONDARY,
  NAV_RAIL_FRAME,
  NAV_RAIL_LIST,
} from "./navRailClasses";

const circleStyle = (color: string) =>
  ({
    border: `2px solid ${color}`,
    color,
    backgroundColor: "color-mix(in srgb, var(--color-surface) 80%, transparent)",
  }) as const;

const PROYECTOS_INDEX = SECTION_IDS.indexOf("proyectos");

/**
 * Segundo riel/barra (081) que solo aparece mientras la sección "Proyectos" de Inicio está activa
 * — reemplaza el botón "Ver todos los proyectos →" que vivía dentro de `ProjectsSection.astro`
 * (debajo del carrusel), ahora como un punto al lado de `ScrollDotNav`, mismo mecanismo que el
 * dot-nav de sub-páginas de `/admin` (`SubPageDotNav.tsx`) — un control que solo tiene sentido
 * mientras esa sección concreta está en pantalla, así que aparece/desaparece con ella en vez de
 * quedar siempre visible en el riel principal.
 */
export default function ProjectsAllDotNav() {
  const { activeIndex } = useSectionScroll(SECTION_IDS);
  if (activeIndex !== PROYECTOS_INDEX) return null;

  const color = "var(--sphere-left-color, var(--color-brand))";

  return (
    <>
      <nav aria-label="Ver todos los proyectos" className={NAV_RAIL_DESKTOP_SECONDARY}>
        <div className={NAV_RAIL_FRAME}>
          <ul className={NAV_RAIL_LIST}>
            <li className="group relative flex items-center">
              <a
                href="/proyectos"
                aria-label="Ver todos los proyectos"
                className="relative z-10 flex h-9 w-9 items-center justify-center rounded-full transition-transform duration-200 hover:scale-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-(--color-brand)"
                style={circleStyle(color)}
              >
                <NavIcon icon="layers" />
              </a>
              <span
                className="scroll-dot-label pointer-events-none absolute left-full ml-3 whitespace-nowrap rounded-lg px-3 py-1.5 font-body text-base font-semibold"
                style={{ backgroundColor: "#000622", color, boxShadow: `0 4px 16px -2px ${color}` }}
              >
                Ver todos los proyectos
              </span>
            </li>
          </ul>
        </div>
      </nav>

      <nav aria-label="Ver todos los proyectos" className={NAV_BAR_MOBILE_SECONDARY}>
        <ul className={NAV_BAR_MOBILE_LIST}>
          <li className="group relative flex items-center">
            <a href="/proyectos" aria-label="Ver todos los proyectos" className={NAV_ITEM_HIT_AREA}>
              <span
                className="flex h-9 w-9 items-center justify-center rounded-full transition-transform duration-200 active:scale-95"
                style={circleStyle(color)}
              >
                <NavIcon icon="layers" />
              </span>
            </a>
            <span
              className="scroll-dot-label pointer-events-none absolute bottom-full left-0 mb-2 whitespace-nowrap rounded-lg px-3 py-1.5 font-body text-base font-semibold"
              style={{ backgroundColor: "#000622", color, boxShadow: `0 4px 16px -2px ${color}` }}
            >
              Ver todos los proyectos
            </span>
          </li>
        </ul>
      </nav>
    </>
  );
}
