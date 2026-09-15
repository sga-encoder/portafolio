import { resolveStarts, type ResolvedZoneStop, type ZoneStop } from "./engine/zoneStops";
import sceneStopsJson from "./sceneStops.json";

export type SphereId = "a" | "b" | "c";

export const SPHERE_IDS: readonly SphereId[] = ["a", "b", "c"];

export type SectionId = "header" | "habilidades" | "proyectos" | "sobre-mi";

/** Las 4 secciones del CV, en el orden en que aparecen en la página. */
export const SECTION_IDS: readonly SectionId[] = [
  "header",
  "habilidades",
  "proyectos",
  "sobre-mi",
];

/** Tamaño "de referencia" de una esfera grande, para usarlo al definir `screenFraction` a mano. */
export const SPHERE_SCREEN_FRACTION: Record<SphereId, number> = {
  a: 1.7,
  b: 1.7,
  c: 1.7,
};

/**
 * Config editable: una entrada por sección. Cada esfera define su `start`/`end` de posición,
 * tamaño y color para ESA sección únicamente — no hace falta mirar la sección anterior ni la
 * siguiente (salvo que quieras continuidad automática, dejando `start` sin definir). Editable
 * desde `/admin/contenido` (pestaña "Animación 3D", `067`) — ver `sceneStops.json`.
 */
export const sceneStops: readonly ZoneStop<SphereId>[] = sceneStopsJson as ZoneStop<SphereId>[];

/** `sceneStops` con todos los `start` resueltos — esto es lo que consume `Scene3D.tsx`. */
export const resolvedSceneStops: readonly ResolvedZoneStop<SphereId>[] = resolveStarts(SPHERE_IDS, sceneStops);
