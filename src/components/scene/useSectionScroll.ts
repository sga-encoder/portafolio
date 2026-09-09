import { useEffect, useState } from "react";
import { SECTION_IDS } from "./sceneStops";

export interface SectionScrollState {
  /** Índice de la sección/zona activa dentro de los ids pasados. */
  activeIndex: number;
  /** Progreso 0-1 dentro de la sección/zona activa. */
  progress: number;
}

/**
 * Calcula, a partir del scroll nativo, cuál de `ids` está activo y el progreso dentro de él.
 * `ids` por defecto son las 4 secciones de Inicio (`SECTION_IDS`) — otros callers (ej.
 * `YearDotNav.tsx` de `/proyectos`) pasan sus propios ids de zona.
 */
export function useSectionScroll(ids: readonly string[] = SECTION_IDS): SectionScrollState {
  const [state, setState] = useState<SectionScrollState>({ activeIndex: 0, progress: 0 });

  useEffect(() => {
    let ticking = false;

    function measure() {
      ticking = false;
      const sections = ids.map((id) => document.getElementById(id)).filter(
        (el): el is HTMLElement => el !== null,
      );
      if (sections.length === 0) return;

      const referenceY = window.scrollY + window.innerHeight / 2;
      let activeIndex = 0;
      let progress = 0;

      sections.forEach((el, index) => {
        const top = el.offsetTop;
        const bottom = top + el.offsetHeight;
        if (referenceY >= top) {
          activeIndex = index;
          progress = el.offsetHeight > 0 ? (referenceY - top) / el.offsetHeight : 0;
        }
        if (referenceY >= top && referenceY < bottom) {
          progress = Math.min(Math.max(progress, 0), 1);
        }
      });

      setState({ activeIndex, progress: Math.min(Math.max(progress, 0), 1) });
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
    // `ids` no cambia durante la vida de la página (secciones/zonas fijas del DOM) — se omite del array de deps a propósito.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return state;
}
