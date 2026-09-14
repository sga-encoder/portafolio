// Motor genérico de zonas/esferas, compartido por los 3 escenarios Three.js del sitio
// (Inicio, detalle de proyecto, listado de proyectos) — ver
// 034-unificar-escenas-threejs/plan.md. Antes esta lógica ("rellenar `start` con el `end`
// de la zona anterior") vivía duplicada en `scene/sceneStops.ts` y
// `projects/detail/scene/projectSceneStops.ts`.

/** Posición/tamaño de una esfera, sin color — lo que necesita cualquier escenario para ubicarla. */
export interface SphereGeometry {
  /** Posición normalizada: x,y en [-1,1] (fracción del viewport visible), z = profundidad relativa. */
  position: readonly [number, number, number];
  /** Tamaño como fracción del alto visible. 0 = invisible (así "nace"/"desaparece" una esfera). */
  screenFraction: number;
}

/** Pose completa (con color) — lo que consume el bucle de animación del motor en cada frame. */
export interface SpherePose extends SphereGeometry {
  /** Color fijo, en hex. */
  color: string;
}

export interface SphereStop<TPose extends SphereGeometry = SpherePose> {
  /**
   * Punto de inicio de esta esfera en esta zona. Si se omite, se usa el `end` de esta misma
   * esfera en la zona anterior (continuidad automática, sin salto); en la primera zona, si
   * también se omite, se usa su propio `end` (arranca quieta, sin animación).
   */
  start?: TPose;
  /** Punto de llegada de esta esfera al final de esta zona. */
  end: TPose;
}

export interface ZoneStop<TSphereId extends string = string, TPose extends SphereGeometry = SpherePose> {
  zoneId: string;
  spheres: Record<TSphereId, SphereStop<TPose>>;
  /** Separación extra entre esferas en esta zona, como fracción de la suma de sus radios. */
  collisionMargin?: number;
}

/**
 * Separación por defecto entre esferas cuando una zona no define `collisionMargin`.
 * `-1` la desactiva por completo (las esferas se pueden solapar libremente) — con tamaños
 * (`screenFraction`) grandes, cualquier margen positivo casi siempre termina empujándolas a una
 * posición distinta de la que pusiste en `position`.
 */
export const DEFAULT_COLLISION_MARGIN = -1;

export interface ResolvedSphereStop<TPose extends SphereGeometry = SpherePose> {
  start: TPose;
  end: TPose;
}

export interface ResolvedZoneStop<TSphereId extends string = string, TPose extends SphereGeometry = SpherePose> {
  zoneId: string;
  spheres: Record<TSphereId, ResolvedSphereStop<TPose>>;
  collisionMargin: number;
}

/** Rellena los `start` que no se definieron a mano con el `end` de la zona anterior (o su propio `end` si es la primera). */
export function resolveStarts<TSphereId extends string, TPose extends SphereGeometry>(
  sphereIds: readonly TSphereId[],
  stops: readonly ZoneStop<TSphereId, TPose>[],
): readonly ResolvedZoneStop<TSphereId, TPose>[] {
  const previousEnd: Partial<Record<TSphereId, TPose>> = {};

  return stops.map((stop) => {
    const spheres = {} as Record<TSphereId, ResolvedSphereStop<TPose>>;
    for (const id of sphereIds) {
      const sphereStop = stop.spheres[id];
      const start = sphereStop.start ?? previousEnd[id] ?? sphereStop.end;
      spheres[id] = { start, end: sphereStop.end };
      previousEnd[id] = sphereStop.end;
    }
    return { zoneId: stop.zoneId, spheres, collisionMargin: stop.collisionMargin ?? DEFAULT_COLLISION_MARGIN };
  });
}
