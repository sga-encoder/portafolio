import { useEffect, useRef } from "react";
import { useSectionScroll } from "../scene/useSectionScroll";
import { SECTION_IDS } from "../scene/sceneStops";
import { SCROLL_NAV_ITEMS } from "../../data/scrollNav";
import NavIcon from "./NavIcon";
import { attachHoldToNavigate } from "./holdToNavigate";
import {
  NAV_BAR_MOBILE,
  NAV_BAR_MOBILE_LIST,
  NAV_BAR_MOBILE_SECONDARY,
  NAV_ITEM_HIT_AREA,
  NAV_RAIL_FRAME,
  NAV_RAIL_LIST,
} from "./navRailClasses";
import { NavModeToggle, type NavMode } from "./NavModeToggle";
import { LangToggle } from "./LangToggle";
import { isHomePath, localizePath, type Lang } from "../../i18n/config";
import { useTranslations } from "../../i18n/ui";

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
 * (`group-hover`/`group-focus-within`), sin estado React adicional. En
 * mobile, mantener presionado hace lo mismo (clase `is-pressed` vía
 * `holdToNavigate.ts`) y la navegación solo ocurre al soltar encima (037).
 */
type NavSide = "left" | "secondary";

interface Props {
  side?: NavSide;
  /** Idioma de la página (100). Solo el sitio público lo pasa — y con él aparece el toggle ES/EN;
   *  en `/admin` (`AdminNavBridge`) queda en español y sin toggle, porque el panel no tiene `/en/`. */
  lang?: Lang;
  toggle?: {
    page: NavMode;
    enabled: boolean;
    onToggle: () => void;
  };
}

export default function ScrollDotNav({ side = "left", toggle, lang }: Props) {
  const t = useTranslations(lang ?? "es");
  const homeHref = localizePath("/", lang ?? "es");
  const { activeIndex } = useSectionScroll(SECTION_IDS);
  const mobileListRef = useRef<HTMLUListElement>(null);
  const desktopClassName =
    side === "secondary"
      ? "fixed left-20 top-1/2 z-50 hidden -translate-y-1/2 flex-col gap-4 md:left-28 md:flex"
      : "fixed left-4 top-1/2 z-40 hidden -translate-y-1/2 flex-col gap-4 md:left-6 md:flex";
  const mobileClassName = side === "secondary" ? NAV_BAR_MOBILE_SECONDARY : NAV_BAR_MOBILE;

  const handleSectionClick = (id: string) => {
    if (!isHomePath(window.location.pathname)) {
      window.location.href = `${homeHref}#${id}`;
      return;
    }

    scrollToSection(id);
  };

  useEffect(() => {
    const list = mobileListRef.current;
    if (!list) return;
    return attachHoldToNavigate(list, (id) => {
      if (!isHomePath(window.location.pathname)) {
        window.location.href = `${homeHref}#${id}`;
        return;
      }
      scrollToSection(id);
    });
  }, [homeHref]);

  return (
    <>
      <nav aria-label={t("nav.sections")} className={desktopClassName}>
        <div className={NAV_RAIL_FRAME} data-home-main-rail={side === "left" ? "desktop" : undefined}>
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
                    aria-label={t(item.labelKey)}
                    aria-current={isActive ? "true" : undefined}
                    onClick={() => handleSectionClick(item.id)}
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
                    {t(item.labelKey)}
                  </span>
                </li>
              );
            })}
            {toggle && <NavModeToggle page={toggle.page} enabled={toggle.enabled} onToggle={toggle.onToggle} variant="desktop" placement="start" />}
            {lang && <LangToggle lang={lang} variant="desktop" />}
          </ul>
        </div>
      </nav>

      <nav aria-label={t("nav.sections")} className={mobileClassName}>
        <ul
          ref={mobileListRef}
          className={NAV_BAR_MOBILE_LIST}
          data-home-main-rail={side === "left" ? "mobile" : undefined}
        >
          {SCROLL_NAV_ITEMS.map((item, index) => {
            const isActive = index === activeIndex;
            const color = isActive
              ? "var(--sphere-left-color, var(--color-brand))"
              : "var(--color-ink-muted)";
            return (
              <li key={item.id} className="group relative flex items-center">
                <button
                  type="button"
                  aria-label={t(item.labelKey)}
                  aria-current={isActive ? "true" : undefined}
                  data-hold-nav={item.id}
                  onClick={() => handleSectionClick(item.id)}
                  className={NAV_ITEM_HIT_AREA}
                >
                  <span
                    className="flex h-9 w-9 items-center justify-center rounded-full transition-transform duration-200 active:scale-95"
                    style={circleStyle(color)}
                  >
                    <NavIcon icon={item.icon} />
                  </span>
                </button>
                <span
                  className="scroll-dot-label pointer-events-none absolute bottom-full left-0 mb-2 whitespace-nowrap rounded-lg px-3 py-1.5 font-body text-base font-semibold"
                  style={{
                    backgroundColor: "#000622",
                    color: "var(--sphere-left-color, var(--color-brand))",
                    boxShadow: "0 4px 16px -2px var(--sphere-left-color, var(--color-brand))",
                  }}
                >
                  {t(item.labelKey)}
                </span>
              </li>
            );
          })}
          {toggle && <NavModeToggle page={toggle.page} enabled={toggle.enabled} onToggle={toggle.onToggle} variant="mobile" placement="start" />}
          {lang && <LangToggle lang={lang} variant="mobile" />}
        </ul>
      </nav>
    </>
  );
}
