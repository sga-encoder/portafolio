// Zonas de scroll del fondo 3D de `/proyectos` (listado): una por grupo de año
// de la línea de tiempo, en vez de las 3 fijas (header/content/gallery) de
// `/proyectos/[slug]`. Reutiliza el mismo tipo de esferas/continuidad
// automática que `projectSceneStops.ts` (`resolveStarts`) en vez de duplicar
// esa lógica — ver 021-listado-proyectos-timeline/plan.md.
import { resolveStarts, type ProjectZoneStop, type ResolvedProjectZoneStop, type SpherePose } from "../../detail/scene/projectSceneStops";

/** 4 esquinas reutilizadas ciclando por índice de zona — no hace falta autoría manual por año, el número de años es dinámico. */
const CORNER_POSES: readonly SpherePose[] = [
  { position: [-1.1, 0.85, 0.1], screenFraction: 1.2 },
  { position: [0.9, 0.4, 0.1], screenFraction: 1.1 },
  { position: [0.5, -0.6, 0.1], screenFraction: 1.15 },
  { position: [-0.9, -0.9, 0.1], screenFraction: 1.05 },
];

/** Arma las zonas de la línea de tiempo: la esfera `b` siempre toma la esquina "opuesta" a `a` (offset de 2 sobre 4) para que no coincidan. */
export function buildTimelineZoneStops(zoneIds: readonly string[]): readonly ResolvedProjectZoneStop[] {
  const stops: ProjectZoneStop[] = zoneIds.map((zoneId, index) => ({
    zoneId,
    spheres: {
      a: { end: CORNER_POSES[index % CORNER_POSES.length] },
      b: { end: CORNER_POSES[(index + 2) % CORNER_POSES.length] },
    },
  }));
  return resolveStarts(stops);
}
