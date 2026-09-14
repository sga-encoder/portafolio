import { useEffect, useRef } from "react";

export interface ZoneScrollRefs {
  activeIndexRef: { current: number };
  progressRef: { current: number };
}

function clamp01(value: number): number {
  return Math.min(Math.max(value, 0), 1);
}

/**
 * Igual que `useSectionScroll` (`scene/useSectionScroll.ts`) pero devuelve refs en vez de estado:
 * el consumidor es el bucle `useFrame` de R3F, que corre fuera del ciclo de render de React y no
 * puede depender de un re-render para ver el valor más reciente (y no le conviene forzar uno en
 * cada evento de scroll).
 */
export function useZoneScrollRefs(zoneIds: readonly string[]): ZoneScrollRefs {
  const activeIndexRef = useRef(0);
  const progressRef = useRef(0);

  useEffect(() => {
    let ticking = false;

    function measure() {
      ticking = false;
      const zones = zoneIds
        .map((id) => document.getElementById(id))
        .filter((el): el is HTMLElement => el !== null);
      if (zones.length === 0) return;

      const referenceY = window.scrollY + window.innerHeight / 2;
      let activeIndex = 0;
      let progress = 0;
      zones.forEach((el, index) => {
        const top = el.offsetTop;
        if (referenceY >= top) {
          activeIndex = index;
          progress = el.offsetHeight > 0 ? (referenceY - top) / el.offsetHeight : 0;
        }
      });
      activeIndexRef.current = activeIndex;
      progressRef.current = clamp01(progress);
    }

    function onScrollOrResize() {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(measure);
      }
    }

    measure();
    window.addEventListener("scroll", onScrollOrResize, { passive: true });
    window.addEventListener("resize", onScrollOrResize);
    return () => {
      window.removeEventListener("scroll", onScrollOrResize);
      window.removeEventListener("resize", onScrollOrResize);
    };
    // `zoneIds` no cambia durante la vida de la página — se omite del array de deps a propósito.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { activeIndexRef, progressRef };
}
