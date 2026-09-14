// Config de posición/tamaño de las 2 esferas del fondo 3D de `/proyectos/[slug]`, una entrada
// por zona de la página. Motor compartido en `src/components/scene/engine/` (ver
// 034-unificar-escenas-threejs/plan.md) — este archivo solo define geometría (sin color: el
// color de cada esfera es fijo por página, los 2 dominantes de la portada o los 2 acentos de
// marca del listado, ver `withProjectColors`), y las zonas de la página de detalle
// (encabezado/contenido/galería) en vez de las 4 secciones de Inicio — los ids ya existen en
// `[slug].astro` desde 014.
import { resolveStarts, type ResolvedZoneStop, type SphereGeometry, type ZoneStop } from "../../../scene/engine/zoneStops";

export type ProjectSphereId = "a" | "b";

export const PROJECT_SPHERE_IDS: readonly ProjectSphereId[] = ["a", "b"];

export const PROJECT_ZONE_IDS = [
  "project-zone-header",
  "project-zone-content",
  "project-zone-gallery",
] as const;

export type ProjectZoneId = (typeof PROJECT_ZONE_IDS)[number];

export const projectZoneStops: readonly ZoneStop<ProjectSphereId, SphereGeometry>[] = [
  {
    zoneId: "project-zone-header",
    spheres: {
      a: { end: { position: [-1.1, 0.85, 0.1], screenFraction: 1.3 } },
      b: { end: { position: [0.9, 0.4, 0.1], screenFraction: 1.15 } },
    },
  },
  {
    zoneId: "project-zone-content",
    spheres: {
      a: { end: { position: [0.5, -0.1, 0.1], screenFraction: 1.05 } },
      b: { end: { position: [-0.85, -0.5, 0.1], screenFraction: 1.2 } },
    },
  },
  {
    zoneId: "project-zone-gallery",
    spheres: {
      a: { end: { position: [-1.1, -0.9, 0.1], screenFraction: 1.25 } },
      b: { end: { position: [0.8, 0.6, 0.1], screenFraction: 1.1 } },
    },
  },
];

/** `projectZoneStops` con todos los `start` resueltos, sin color todavía — ver `withProjectColors`. */
export const resolvedProjectZoneStops: readonly ResolvedZoneStop<ProjectSphereId, SphereGeometry>[] =
  resolveStarts(PROJECT_SPHERE_IDS, projectZoneStops);

/**
 * Inyecta los 2 colores fijos de la página (dominantes de portada en detalle, acentos de marca en
 * el listado) en cada pose ya resuelta, produciendo el shape con color que espera el motor
 * genérico (`SpherePose`). Un solo `colorA`/`colorB` para toda la vida de la escena — el color no
 * cicla por zona en Proyectos, a diferencia de Inicio.
 */
export function withProjectColors(
  stops: readonly ResolvedZoneStop<ProjectSphereId, SphereGeometry>[],
  colorA: string,
  colorB: string,
): readonly ResolvedZoneStop<ProjectSphereId>[] {
  const colors: Record<ProjectSphereId, string> = { a: colorA, b: colorB };
  return stops.map((stop) => ({
    zoneId: stop.zoneId,
    collisionMargin: stop.collisionMargin,
    spheres: {
      a: {
        start: { ...stop.spheres.a.start, color: colors.a },
        end: { ...stop.spheres.a.end, color: colors.a },
      },
      b: {
        start: { ...stop.spheres.b.start, color: colors.b },
        end: { ...stop.spheres.b.end, color: colors.b },
      },
    },
  }));
}
