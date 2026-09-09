import type { SectionId } from "../components/scene/sceneStops";

export interface ScrollNavItem {
  id: SectionId;
  label: string;
}

/** Un ítem por sección del CV, en el mismo orden que `SECTION_IDS` (mismo índice = misma sección). */
export const SCROLL_NAV_ITEMS: readonly ScrollNavItem[] = [
  { id: "header", label: "Inicio" },
  { id: "habilidades", label: "Habilidades" },
  { id: "proyectos", label: "Proyectos" },
  { id: "sobre-mi", label: "Sobre mí" },
];
