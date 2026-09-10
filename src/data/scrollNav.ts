import type { SectionId } from "../components/scene/sceneStops";

export interface ScrollNavItem {
  id: SectionId;
  label: string;
  icon: "home" | "gear" | "folder" | "user";
}

/** Un ítem por sección del CV, en el mismo orden que `SECTION_IDS` (mismo índice = misma sección). */
export const SCROLL_NAV_ITEMS: readonly ScrollNavItem[] = [
  { id: "header", label: "Inicio", icon: "home" },
  { id: "habilidades", label: "Habilidades", icon: "gear" },
  { id: "proyectos", label: "Proyectos", icon: "folder" },
  { id: "sobre-mi", label: "Sobre mí", icon: "user" },
];
