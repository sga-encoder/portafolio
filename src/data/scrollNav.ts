import type { SectionId } from "../components/scene/sceneStops";
import type { UiKey } from "../i18n/ui";

export interface ScrollNavItem {
  id: SectionId;
  /** Clave de `src/i18n/ui.ts` (100). */
  labelKey: UiKey;
  icon: "home" | "gear" | "folder" | "user";
}

/** Un ítem por sección del CV, en el mismo orden que `SECTION_IDS` (mismo índice = misma sección). */
export const SCROLL_NAV_ITEMS: readonly ScrollNavItem[] = [
  { id: "header", labelKey: "nav.home", icon: "home" },
  { id: "habilidades", labelKey: "nav.skills", icon: "gear" },
  { id: "proyectos", labelKey: "nav.projects", icon: "folder" },
  { id: "sobre-mi", labelKey: "nav.about", icon: "user" },
];
