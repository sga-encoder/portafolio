export type SphereId = "a" | "b" | "c";

export type SectionId = "header" | "habilidades" | "proyectos" | "sobre-mi";

/** Las 4 secciones del CV, en el orden en que aparecen en la página. */
export const SECTION_IDS: readonly SectionId[] = [
  "header",
  "habilidades",
  "proyectos",
  "sobre-mi",
];

/** Estado completo de una esfera en un punto concreto (inicio o fin de una sección). */
export interface SpherePose {
  /** Posición normalizada: x,y en [-1,1] (fracción del viewport visible), z = profundidad relativa. */
  position: readonly [number, number, number];
  /** Tamaño como fracción del alto visible. 0 = invisible (así "nace"/"desaparece" una esfera, sin lógica aparte). */
  screenFraction: number;
  /** Color fijo, en hex. */
  color: string;
}

export interface SphereStop {
  /**
   * Punto de inicio de esta esfera en esta sección. Si se omite, se usa el `end` de esta misma
   * esfera en la sección anterior (continuidad automática, sin salto); en la primera sección, si
   * también se omite, se usa su propio `end` (arranca quieta, sin animación).
   */
  start?: SpherePose;
  /** Punto de llegada de esta esfera al final de esta sección. */
  end: SpherePose;
}

export interface SceneStop {
  sectionId: SectionId;
  spheres: Record<SphereId, SphereStop>;
  /** Separación extra entre esferas en esta sección, como fracción de la suma de sus radios. */
  collisionMargin?: number;
}

/**
 * Separación por defecto entre esferas cuando una sección no define `collisionMargin`.
 * `-1` la desactiva por completo (las esferas se pueden solapar libremente) — con tamaños
 * (`screenFraction`) grandes como los de este sitio, cualquier margen positivo casi siempre
 * termina empujándolas a una posición distinta de la que pusiste en `position`. Si quieres
 * repulsión en una sección concreta, ponle `collisionMargin` ahí (ej. `0.1`) para reactivarla
 * solo ahí.
 */
export const DEFAULT_COLLISION_MARGIN = -1;

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
export const sceneStops: readonly SceneStop[] = [
  {
    sectionId: "header",
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
    sectionId: "habilidades",
    spheres: {
      // Esquina superior derecha.
      a: { end: { position: [1, 1, 0.1], screenFraction: SPHERE_SCREEN_FRACTION.a, color: "#6a00ff" } },
      // Esquina inferior izquierda.
      b: { end: { position: [-1, -1, 0.1], screenFraction: SPHERE_SCREEN_FRACTION.b, color: "#0033ff" } },
      c: { end: { position: [1, -1, 0.15], screenFraction: 0, color: "#00C080" } },
    },
  },
  {
    sectionId: "proyectos",
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
    sectionId: "sobre-mi",
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

export interface ResolvedSphereStop {
  start: SpherePose;
  end: SpherePose;
}

export interface ResolvedSceneStop {
  sectionId: SectionId;
  spheres: Record<SphereId, ResolvedSphereStop>;
  collisionMargin: number;
}

const SPHERE_IDS: readonly SphereId[] = ["a", "b", "c"];

/** Rellena los `start` que no se definieron a mano con el `end` de la sección anterior (o su propio `end` si es la primera). */
function resolveStarts(stops: readonly SceneStop[]): readonly ResolvedSceneStop[] {
  const previousEnd: Partial<Record<SphereId, SpherePose>> = {};

  return stops.map((stop) => {
    const spheres = {} as Record<SphereId, ResolvedSphereStop>;
    for (const id of SPHERE_IDS) {
      const sphereStop = stop.spheres[id];
      const start = sphereStop.start ?? previousEnd[id] ?? sphereStop.end;
      spheres[id] = { start, end: sphereStop.end };
      previousEnd[id] = sphereStop.end;
    }
    return { sectionId: stop.sectionId, spheres, collisionMargin: stop.collisionMargin ?? DEFAULT_COLLISION_MARGIN };
  });
}

/** `sceneStops` con todos los `start` resueltos — esto es lo que consume `SceneContent.tsx`. */
export const resolvedSceneStops: readonly ResolvedSceneStop[] = resolveStarts(sceneStops);
