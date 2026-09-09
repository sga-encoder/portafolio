// Config de posición/tamaño de las 2 esferas del fondo 3D de `/proyectos/[slug]`,
// una entrada por zona de la página. Mismo shape que `src/components/scene/sceneStops.ts`
// de Inicio (start?/end con continuidad automática, resolveStarts()), pero:
// - 2 esferas (`a`/`b`) en vez de 3, sin color por stop: el color de cada esfera es
//   fijo por proyecto (los 2 dominantes de la portada, ver `ProjectSceneContent.tsx`),
//   no cicla entre una paleta de marca.
// - Zonas de la página de detalle (encabezado/contenido/galería) en vez de las 4
//   secciones de Inicio — los ids ya existen en `[slug].astro` desde 014.

export type ProjectSphereId = "a" | "b";

export const PROJECT_ZONE_IDS = [
  "project-zone-header",
  "project-zone-content",
  "project-zone-gallery",
] as const;

export type ProjectZoneId = (typeof PROJECT_ZONE_IDS)[number];

/** Posición/tamaño de una esfera en un punto concreto (inicio o fin de una zona). */
export interface SpherePose {
  /** Posición normalizada: x,y en [-1,1] (fracción del viewport visible), z = profundidad relativa. */
  position: readonly [number, number, number];
  /** Tamaño como fracción del alto visible. */
  screenFraction: number;
}

export interface SphereStop {
  /** Si se omite, hereda el `end` de esta misma esfera en la zona anterior (continuidad automática). */
  start?: SpherePose;
  end: SpherePose;
}

export interface ProjectZoneStop {
  zoneId: ProjectZoneId;
  spheres: Record<ProjectSphereId, SphereStop>;
  /** Separación extra entre esferas en esta zona, como fracción de la suma de sus radios. */
  collisionMargin?: number;
}

/** `-1` desactiva la anti-colisión por completo — con esferas grandes, cualquier margen positivo
 * termina dominando sobre `position` (misma lección que `sceneStops.ts` de Inicio). */
export const DEFAULT_COLLISION_MARGIN = -1;

export const projectZoneStops: readonly ProjectZoneStop[] = [
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

export interface ResolvedSphereStop {
  start: SpherePose;
  end: SpherePose;
}

export interface ResolvedProjectZoneStop {
  zoneId: ProjectZoneId;
  spheres: Record<ProjectSphereId, ResolvedSphereStop>;
  collisionMargin: number;
}

const SPHERE_IDS: readonly ProjectSphereId[] = ["a", "b"];

function resolveStarts(stops: readonly ProjectZoneStop[]): readonly ResolvedProjectZoneStop[] {
  const previousEnd: Partial<Record<ProjectSphereId, SpherePose>> = {};

  return stops.map((stop) => {
    const spheres = {} as Record<ProjectSphereId, ResolvedSphereStop>;
    for (const id of SPHERE_IDS) {
      const sphereStop = stop.spheres[id];
      const start = sphereStop.start ?? previousEnd[id] ?? sphereStop.end;
      spheres[id] = { start, end: sphereStop.end };
      previousEnd[id] = sphereStop.end;
    }
    return { zoneId: stop.zoneId, spheres, collisionMargin: stop.collisionMargin ?? DEFAULT_COLLISION_MARGIN };
  });
}

/** `projectZoneStops` con todos los `start` resueltos — esto es lo que consume `ProjectSceneContent.tsx`. */
export const resolvedProjectZoneStops: readonly ResolvedProjectZoneStop[] = resolveStarts(projectZoneStops);
