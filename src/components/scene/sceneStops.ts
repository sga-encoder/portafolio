import { resolveStarts, type ResolvedZoneStop, type ZoneStop } from "./engine/zoneStops";

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
 * siguiente (salvo que quieras continuidad automática, dejando `start` sin definir).
 */
export const sceneStops: readonly ZoneStop<SphereId>[] = [
  {
    zoneId: "header",
    spheres: {
      // Esquina superior izquierda.
      a: { end: { position: [-1, 1, 0.1], screenFraction: SPHERE_SCREEN_FRACTION.a, color: "#6a00ff" } },
      // Esquina inferior derecha.
      b: { end: { position: [1, -1, 0.1], screenFraction: SPHERE_SCREEN_FRACTION.b, color: "#0033ff" } },
      // Todavía no aparece: tamaño 0, esperando en la esquina inferior derecha (donde nace en "proyectos").
      c: { end: { position: [1, -1, 0.15], screenFraction: 0, color: "#00C080" } },
    },
  },
  {
    zoneId: "habilidades",
    spheres: {
      // Esquina superior derecha.
      a: { end: { position: [1, 1, 0.1], screenFraction: SPHERE_SCREEN_FRACTION.a, color: "#6a00ff" } },
      // Esquina inferior izquierda.
      b: { end: { position: [-1, -1, 0.1], screenFraction: SPHERE_SCREEN_FRACTION.b, color: "#0033ff" } },
      c: { end: { position: [1, -1, 0.15], screenFraction: 0, color: "#00C080" } },
    },
  },
  {
    zoneId: "proyectos",
    spheres: {
      // Sigue el mismo rumbo (arriba-izquierda → arriba-derecha) y sale de la pantalla por la derecha.
      a: { end: { position: [2.4, 1, 0.1], screenFraction: SPHERE_SCREEN_FRACTION.a, color: "#c0009d" } },
      // Esquina superior izquierda.
      b: { end: { position: [-1, 1, 0.1], screenFraction: SPHERE_SCREEN_FRACTION.b, color: "#0033ff" } },
      // Nace aquí: crece de tamaño 0 (heredado de "habilidades") a su tamaño final, en la esquina inferior derecha.
      c: {
        end: { position: [1, -1, 0.15], screenFraction: SPHERE_SCREEN_FRACTION.b, color: "#00C080" },
      },
    },
  },
  {
    zoneId: "sobre-mi",
    spheres: {
      // Esquina inferior derecha.
      a: { end: { position: [1, -1, 0.1], screenFraction: SPHERE_SCREEN_FRACTION.a, color: "#6a00ff" } },
      // Sigue el rumbo hacia arriba-izquierda y sale de la pantalla por la izquierda.
      b: { end: { position: [-2.4, 1, 0.1], screenFraction: SPHERE_SCREEN_FRACTION.b, color: "#0033ff" } },
      // Esquina superior izquierda, grande y verde.
      c: {
        end: { position: [-1, 1, 0.15], screenFraction: SPHERE_SCREEN_FRACTION.b, color: "#00C080" },
      },
    },
  },
];

/** `sceneStops` con todos los `start` resueltos — esto es lo que consume `Scene3D.tsx`. */
export const resolvedSceneStops: readonly ResolvedZoneStop<SphereId>[] = resolveStarts(SPHERE_IDS, sceneStops);
