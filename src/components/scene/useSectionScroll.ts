import { useEffect, useState } from "react";
import { SECTION_IDS } from "./sceneStops";

export interface SectionScrollState {
  /** Índice (0-3) de la sección activa dentro de SECTION_IDS. */
  activeIndex: number;
  /** Progreso 0-1 dentro de la sección activa. */
  progress: number;
}

/** Calcula, a partir del scroll nativo, qué sección del CV está activa y el progreso dentro de ella. */
export function useSectionScroll(): SectionScrollState {
  const [state, setState] = useState<SectionScrollState>({ activeIndex: 0, progress: 0 });

  useEffect(() => {
    let ticking = false;

    function measure() {
      ticking = false;
      const sections = SECTION_IDS.map((id) => document.getElementById(id)).filter(
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
  }, []);

  return state;
}
