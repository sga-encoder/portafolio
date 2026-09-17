import { useEffect, useRef } from "react";
import NavIcon, { type NavIconName } from "./NavIcon";
import { attachHoldToNavigate } from "./holdToNavigate";
import {
  NAV_BAR_MOBILE,
  NAV_BAR_MOBILE_LIST,
  NAV_ITEM_HIT_AREA,
  NAV_RAIL_DESKTOP,
  NAV_RAIL_FRAME,
  NAV_RAIL_LIST,
} from "./navRailClasses";

const circleStyle = (color: string) =>
  ({
    border: `2px solid ${color}`,
    color,
    backgroundColor: "color-mix(in srgb, var(--color-surface) 80%, transparent)",
  }) as const;

const MUTED = "var(--color-ink-muted)";
const ACTIVE = "var(--project-left-color, var(--color-brand))";

interface MainNavItem {
  href: string;
  label: string;
  icon: NavIconName;
  active: boolean;
}

const ITEMS: readonly MainNavItem[] = [
  { href: "/", label: "Inicio", icon: "home", active: false },
  { href: "/#habilidades", label: "Habilidades", icon: "gear", active: false },
  { href: "/proyectos", label: "Proyectos", icon: "folder", active: true },
  { href: "/#sobre-mi", label: "Sobre mí", icon: "user", active: false },
];

/**
 * Nav principal del sitio (081) fuera de Home: 3 enlaces reales — Inicio/Proyectos/Sobre mí —, mismo
 * mecanismo visual que `ScrollDotNav` (que cumple ese rol DENTRO de "/", con scroll-spy entre sus 4
 * secciones), pero sin scroll-spy: acá cada ítem es una página/ancla distinta, así que el activo es
 * fijo por página en vez de calculado. Usado en `/proyectos` y `/proyectos/[slug]` — las únicas 2
 * páginas que lo montan, siempre con "Proyectos" activo —, lo que antes era el riel único de esas
 * páginas (`YearDotNav`/`ProjectDetailNav`) pasa a ser el submenú de sub-página al lado
 * (`NAV_RAIL_DESKTOP_SECONDARY`/`NAV_BAR_MOBILE_SECONDARY`, mismo mecanismo que `SubPageDotNav` de
 * `/admin`).
 */
export default function SiteMainNav() {
  const mobileListRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const list = mobileListRef.current;
    if (!list) return;
    return attachHoldToNavigate(list, (href) => {
      window.location.href = href;
    });
  }, []);

  return (
    <>
      <nav aria-label="Navegación principal" className={NAV_RAIL_DESKTOP}>
        <div className={NAV_RAIL_FRAME}>
          <ul className={NAV_RAIL_LIST}>
            {ITEMS.map((item) => {
              const color = item.active ? ACTIVE : MUTED;
              return (
                <li key={item.href} className="group relative flex items-center">
                  <a
                    href={item.href}
                    aria-label={item.label}
                    aria-current={item.active ? "page" : undefined}
                    className="relative z-10 flex h-9 w-9 items-center justify-center rounded-full transition-transform duration-200 hover:scale-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-(--color-brand)"
                    style={circleStyle(color)}
                  >
                    <NavIcon icon={item.icon} />
                  </a>
                  <span
                    className="scroll-dot-label pointer-events-none absolute left-full ml-3 whitespace-nowrap rounded-lg px-3 py-1.5 font-body text-base font-semibold"
                    style={{ backgroundColor: "#000622", color, boxShadow: `0 4px 16px -2px ${color}` }}
                  >
                    {item.label}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>

      <nav aria-label="Navegación principal" className={NAV_BAR_MOBILE}>
        <ul ref={mobileListRef} className={NAV_BAR_MOBILE_LIST}>
          {ITEMS.map((item) => {
            const color = item.active ? ACTIVE : MUTED;
            return (
              <li key={item.href} className="group relative flex items-center">
                <a
                  href={item.href}
                  aria-label={item.label}
                  aria-current={item.active ? "page" : undefined}
                  data-hold-nav={item.href}
                  className={NAV_ITEM_HIT_AREA}
                >
                  <span
                    className="flex h-9 w-9 items-center justify-center rounded-full transition-transform duration-200 active:scale-95"
                    style={circleStyle(color)}
                  >
                    <NavIcon icon={item.icon} />
                  </span>
                </a>
                <span
                  className="scroll-dot-label pointer-events-none absolute bottom-full left-0 mb-2 whitespace-nowrap rounded-lg px-3 py-1.5 font-body text-base font-semibold"
                  style={{ backgroundColor: "#000622", color, boxShadow: `0 4px 16px -2px ${color}` }}
                >
                  {item.label}
                </span>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
