import { useEffect, useRef } from "react";
import { useSectionScroll } from "../../scene/useSectionScroll";
import NavIcon from "../../nav/NavIcon";
import { attachHoldToNavigate } from "../../nav/holdToNavigate";
import {
  NAV_BAR_MOBILE,
  NAV_BAR_MOBILE_LIST,
  NAV_ITEM_HIT_AREA,
  NAV_RAIL_DESKTOP,
  NAV_RAIL_FRAME,
  NAV_RAIL_LIST,
} from "../../nav/navRailClasses";

const circleStyle = (color: string) =>
  ({
    border: `2px solid ${color}`,
    color,
    backgroundColor: "color-mix(in srgb, var(--color-surface) 80%, transparent)",
  }) as const;

interface Props {
  /** Años ya ordenados de más nuevo a más viejo — mismo orden que las zonas del fondo 3D (`projects-year-{year}`). */
  years: readonly string[];
}

/** Id reservado (no coincide con ningún `projects-year-{year}`) para el círculo "volver al inicio" en `data-hold-nav`. */
const HOME_ID = "__home__";

function scrollToZone(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  el.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
}

/**
 * Dot-nav vertical de `/proyectos` (listado): mismo mecanismo que `ScrollDotNav.tsx`
 * de Inicio (un círculo por zona, activo coloreado con el fondo 3D, label en hover),
 * pero cada círculo es un año en vez de una sección fija — muestra los últimos 2
 * dígitos del año como texto (el label en hover sigue mostrando el año completo). El
 * primer círculo no es un año: siempre vuelve a "/" con el ícono de casa, color fijo
 * que no cambia con el scroll. En mobile, mantener presionado hace lo mismo que el
 * hover de desktop (label visible) y la navegación solo ocurre al soltar encima (037).
 */
export default function YearDotNav({ years }: Props) {
  const zoneIds = years.map((year) => `projects-year-${year}`);
  const { activeIndex } = useSectionScroll(zoneIds);
  const mobileListRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const list = mobileListRef.current;
    if (!list) return;
    return attachHoldToNavigate(list, (id) => {
      if (id === HOME_ID) {
        window.location.href = "/";
      } else {
        scrollToZone(id);
      }
    });
  }, []);

  return (
    <>
      <nav aria-label="Navegación de la línea de tiempo" className={NAV_RAIL_DESKTOP}>
        <div className={NAV_RAIL_FRAME}>
          <ul className={NAV_RAIL_LIST}>
            <li className="group relative flex items-center">
              <a
                href="/"
                aria-label="Volver al inicio"
                className="relative z-10 flex h-9 w-9 items-center justify-center rounded-full transition-transform duration-200 hover:scale-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-(--color-brand)"
                style={circleStyle("var(--color-ink-muted)")}
              >
                <NavIcon icon="home" />
              </a>
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
              const color = isActive
                ? "var(--project-left-color, var(--color-brand))"
                : "var(--color-ink-muted)";
              return (
                <li key={year} className="group relative flex items-center">
                  <button
                    type="button"
                    aria-label={year}
                    aria-current={isActive ? "true" : undefined}
                    onClick={() => scrollToZone(zoneIds[index])}
                    className="relative z-10 flex h-9 w-9 items-center justify-center rounded-full font-body text-sm font-semibold transition-transform duration-200 hover:scale-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-(--color-brand)"
                    style={circleStyle(color)}
                  >
                    {year.slice(-2)}
                  </button>
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
        </div>
      </nav>

      <nav aria-label="Navegación de la línea de tiempo" className={NAV_BAR_MOBILE}>
        <ul ref={mobileListRef} className={NAV_BAR_MOBILE_LIST}>
          <li className="group relative flex items-center">
            <a
              href="/"
              aria-label="Volver al inicio"
              data-hold-nav={HOME_ID}
              className={NAV_ITEM_HIT_AREA}
            >
              <span
                className="flex h-9 w-9 items-center justify-center rounded-full transition-transform duration-200 active:scale-95"
                style={circleStyle("var(--color-ink-muted)")}
              >
                <NavIcon icon="home" />
              </span>
            </a>
            <span
              className="scroll-dot-label pointer-events-none absolute bottom-full left-0 mb-2 whitespace-nowrap rounded-lg px-3 py-1.5 font-body text-base font-semibold"
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
            const color = isActive
              ? "var(--project-left-color, var(--color-brand))"
              : "var(--color-ink-muted)";
            return (
              <li key={year} className="group relative flex items-center">
                <button
                  type="button"
                  aria-label={year}
                  aria-current={isActive ? "true" : undefined}
                  data-hold-nav={zoneIds[index]}
                  onClick={() => scrollToZone(zoneIds[index])}
                  className={NAV_ITEM_HIT_AREA}
                >
                  <span
                    className="flex h-9 w-9 items-center justify-center rounded-full font-body text-sm font-semibold transition-transform duration-200 active:scale-95"
                    style={circleStyle(color)}
                  >
                    {year.slice(-2)}
                  </span>
                </button>
                <span
                  className="scroll-dot-label pointer-events-none absolute bottom-full left-0 mb-2 whitespace-nowrap rounded-lg px-3 py-1.5 font-body text-base font-semibold"
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
    </>
  );
}
