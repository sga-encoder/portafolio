import { useEffect, useRef, useState, type RefObject } from "react";
import { useSectionScroll } from "../scene/useSectionScroll";
import { SECTION_IDS } from "../scene/sceneStops";
import NavIcon from "./NavIcon";
import { NAV_BAR_MOBILE_SECONDARY, NAV_RAIL_DESKTOP_SECONDARY } from "./navRailClasses";
import { localizePath, type Lang } from "../../i18n/config";
import { useTranslations } from "../../i18n/ui";

const PROYECTOS_INDEX = SECTION_IDS.indexOf("proyectos");

interface RailSize {
  width: number;
  height: number;
}

/**
 * Mide el riel desktop y la barra mobile de `ScrollDotNav` (marcados con `data-home-main-rail`)
 * para que el botón tenga exactamente su mismo tamaño (096), aunque el riel crezca (p. ej. el
 * toggle de admin). `offsetWidth/Height` ignora los `transform` de la animación idle (049).
 */
function useMainRailSize(kind: "desktop" | "mobile"): RailSize | null {
  const [size, setSize] = useState<RailSize | null>(null);

  useEffect(() => {
    const el = document.querySelector<HTMLElement>(`[data-home-main-rail="${kind}"]`);
    if (!el) return;
    const measure = () => setSize({ width: el.offsetWidth, height: el.offsetHeight });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [kind]);

  return size;
}

/**
 * El riel principal arranca su animación idle + borde (`.nav-rail-glow`, 049) al cargar la
 * página y `BaseLayout.astro` registra la pausa por interacción una sola vez; este botón se monta
 * después (al llegar a "Proyectos"), así que su animación arrancaría desfasada y no se pausaría
 * con el menú. Al montarse copia el `currentTime` de las animaciones del riel (por nombre y
 * pseudo-elemento), espeja su `.is-paused`, y reenvía sus propios hover/focus al riel para que
 * pausar uno pause a los dos (096).
 */
function useSyncWithMainRail(ref: RefObject<HTMLElement | null>, kind: "desktop" | "mobile", active: boolean) {
  useEffect(() => {
    const target = ref.current;
    const source = document.querySelector<HTMLElement>(`[data-home-main-rail="${kind}"]`);
    if (!active || !target || !source) return;

    const sync = () => {
      const sourceAnimations = source.getAnimations({ subtree: true }) as CSSAnimation[];
      for (const animation of target.getAnimations({ subtree: true }) as CSSAnimation[]) {
        const pseudo = (animation.effect as KeyframeEffect | null)?.pseudoElement ?? null;
        const match = sourceAnimations.find(
          (candidate) =>
            candidate.animationName === animation.animationName &&
            ((candidate.effect as KeyframeEffect | null)?.pseudoElement ?? null) === pseudo,
        );
        if (match?.currentTime != null) animation.currentTime = match.currentTime;
      }
    };

    const mirrorPause = () => target.classList.toggle("is-paused", source.classList.contains("is-paused"));
    mirrorPause();
    sync();

    const observer = new MutationObserver(mirrorPause);
    observer.observe(source, { attributes: true, attributeFilter: ["class"] });

    // Cruzar el breakpoint `md` cambia el keyframe (x ↔ y) y reinicia la animación.
    const media = window.matchMedia("(min-width: 768px)");
    const resync = () => requestAnimationFrame(sync);
    media.addEventListener("change", resync);

    const forward = (event: Event) =>
      source.dispatchEvent(new Event(event.type, { bubbles: event.type.startsWith("focus") }));
    const types = ["pointerenter", "pointerleave", "focusin", "focusout"] as const;
    types.forEach((type) => target.addEventListener(type, forward));

    return () => {
      observer.disconnect();
      media.removeEventListener("change", resync);
      types.forEach((type) => target.removeEventListener(type, forward));
    };
  }, [ref, kind, active]);
}

/**
 * Segundo riel/barra (081) que solo aparece mientras la sección "Proyectos" de Inicio está activa
 * — reemplaza el botón "Ver todos los proyectos →" que vivía dentro de `ProjectsSection.astro`
 * (debajo del carrusel). Desde 096 ya no es un círculo: es un rectángulo redondeado del mismo
 * tamaño que el menú principal, con el ícono y el texto visibles — girados -90° en el riel
 * vertical de escritorio, horizontales en la barra inferior de mobile.
 */
export default function ProjectsAllDotNav({ lang = "es" }: { lang?: Lang }) {
  const label = useTranslations(lang)("nav.allProjects");
  const href = localizePath("/proyectos", lang);
  const { activeIndex } = useSectionScroll(SECTION_IDS);
  const desktopSize = useMainRailSize("desktop");
  const mobileSize = useMainRailSize("mobile");
  const desktopRef = useRef<HTMLAnchorElement>(null);
  const mobileRef = useRef<HTMLAnchorElement>(null);
  const isActive = activeIndex === PROYECTOS_INDEX;
  useSyncWithMainRail(desktopRef, "desktop", isActive);
  useSyncWithMainRail(mobileRef, "mobile", isActive);
  if (!isActive) return null;

  const color = "var(--sphere-left-color, var(--color-brand))";
  const buttonStyle = {
    border: `2px solid ${color}`,
    color,
    backgroundColor: "color-mix(in srgb, var(--color-surface) 80%, transparent)",
  } as const;

  return (
    <>
      <nav aria-label={label} className={NAV_RAIL_DESKTOP_SECONDARY}>
        <a
          ref={desktopRef}
          href={href}
          className="nav-rail-glow flex items-center justify-center rounded-2xl transition-transform duration-200 hover:scale-[1.03] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-(--color-brand)"
          style={{
            ...buttonStyle,
            width: desktopSize ? `${desktopSize.width}px` : "3.75rem",
            height: desktopSize ? `${desktopSize.height}px` : "16rem",
          }}
        >
          {/* vertical-rl + 180° = texto girado -90° (se lee de abajo hacia arriba); el SVG no
              rota con writing-mode, así que lleva 90° extra para quedar también a -90°. */}
          <span
            className="flex items-center gap-2 whitespace-nowrap font-body text-sm font-semibold"
            style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
          >
            <span className="flex" style={{ transform: "rotate(90deg)" }}>
              <NavIcon icon="layers" />
            </span>
            {label}
          </span>
        </a>
      </nav>

      <nav aria-label={label} className={NAV_BAR_MOBILE_SECONDARY}>
        <a
          ref={mobileRef}
          href={href}
          className="nav-rail-glow flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl font-body text-sm font-semibold transition-transform duration-200 active:scale-95"
          style={{
            ...buttonStyle,
            width: mobileSize ? `${mobileSize.width}px` : "auto",
            height: mobileSize ? `${mobileSize.height}px` : "2.75rem",
            paddingInline: mobileSize ? undefined : "1rem",
          }}
        >
          <NavIcon icon="layers" />
          {label}
        </a>
      </nav>
    </>
  );
}
