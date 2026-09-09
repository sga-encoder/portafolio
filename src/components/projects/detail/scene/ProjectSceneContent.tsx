import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { Color, Vector3, type PerspectiveCamera } from "three";
import { getGradientTexture } from "../../../scene/gradientTexture";
import GradientBlob, { type GradientBlobHandle } from "../../../scene/GradientBlob";
import { projectToScreenFraction } from "../../../scene/headerFrameVars";
import { normalizedToWorld, radiusForScreenFraction } from "../../../scene/viewport";
import { DEFAULT_COLLISION_MARGIN, type ProjectSphereId, type ResolvedProjectZoneStop } from "./projectSceneStops";

interface Props {
  colorA: string;
  colorB: string;
  /** Zonas de scroll a recorrer (ids de DOM + pose de cada esfera por zona, ya resueltas vía `resolveStarts`). */
  zoneStops: readonly ResolvedProjectZoneStop[];
}

const SPHERE_IDS: readonly ProjectSphereId[] = ["a", "b"];
/** El sprite del degradado tiene medio-ancho 0.5 en reposo: para que `radius` sea el radio visible real, hay que escalar al doble. */
const SPRITE_SIZE_FACTOR = 2;
const TRAIL_LENGTH = 5;
const TRAIL_SAMPLE_EVERY_N_FRAMES = 4;
const MIN_MOTION_SPEED = 0.02;
const MAX_MOTION_SPEED = 0.6;
/** Fracción del scroll de una zona donde termina la transición hacia `end`; el resto del scroll queda en reposo ahí. */
const TRANSITION_RANGE = 0.25;
/** Suavizado de posición muy leve (solo para limar el "salto" entre eventos de scroll, no para crear inercia). */
const POSITION_SMOOTHING_RATE = 14;

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function clamp01(value: number): number {
  return Math.min(Math.max(value, 0), 1);
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

function lerpPosition(
  start: readonly [number, number, number],
  end: readonly [number, number, number],
  t: number,
): readonly [number, number, number] {
  return [lerp(start[0], end[0], t), lerp(start[1], end[1], t), lerp(start[2], end[2], t)];
}

/** Ref "estable" (mismo objeto durante toda la vida del componente) sin usar hooks condicionales. */
function useStableRef<T>(factory: () => T): { current: T } {
  const ref = useRef<T | null>(null);
  if (ref.current === null) {
    ref.current = factory();
  }
  return ref as { current: T };
}

interface SphereRuntime {
  current: Vector3;
  previous: Vector3;
  radius: number;
  motionFactor: number;
  trail: Vector3[];
  mainRef: { current: GradientBlobHandle | null };
  ghostRefs: { current: GradientBlobHandle | null }[];
}

export default function ProjectSceneContent({ colorA, colorB, zoneStops }: Props) {
  const { camera } = useThree((state) => ({ camera: state.camera as PerspectiveCamera }));

  const texture = useStableRef(() => getGradientTexture());
  const colors = useStableRef<Record<ProjectSphereId, Color>>(() => ({
    a: new Color(colorA),
    b: new Color(colorB),
  }));

  const runtime = useStableRef<Record<ProjectSphereId, SphereRuntime>>(() => {
    const build = (id: ProjectSphereId): SphereRuntime => {
      // Arranca directo en la posición inicial de la primera zona, sin animación de "vuelo".
      const initialPose = zoneStops[0].spheres[id].start;
      const initialPosition = new Vector3(...normalizedToWorld(camera, initialPose.position));
      return {
        current: initialPosition.clone(),
        previous: initialPosition.clone(),
        radius: 0,
        motionFactor: 0,
        trail: Array.from({ length: TRAIL_LENGTH }, () => new Vector3()),
        mainRef: { current: null },
        ghostRefs: Array.from({ length: TRAIL_LENGTH }, () => ({ current: null as GradientBlobHandle | null })),
      };
    };
    return { a: build("a"), b: build("b") };
  });

  const frameCount = useStableRef(() => ({ value: 0 }));
  const activeIndexRef = useStableRef(() => ({ value: 0 }));
  const progressRef = useStableRef(() => ({ value: 0 }));

  // Zona activa vía scroll nativo (se lee del DOM directamente, sin pasar por props de Astro).
  // Tolera zonas de `zoneStops` que no existan en el DOM (ej. "project-zone-gallery" en
  // proyectos sin galería).
  useEffect(() => {
    let ticking = false;

    function measure() {
      ticking = false;
      const zones = zoneStops
        .map((stop) => document.getElementById(stop.zoneId))
        .filter((el): el is HTMLElement => el !== null);
      if (zones.length === 0) return;

      const referenceY = window.scrollY + window.innerHeight / 2;
      let activeIndex = 0;
      let progress = 0;
      zones.forEach((el, index) => {
        const top = el.offsetTop;
        if (referenceY >= top) {
          activeIndex = index;
          progress = el.offsetHeight > 0 ? (referenceY - top) / el.offsetHeight : 0;
        }
      });
      activeIndexRef.current.value = activeIndex;
      progressRef.current.value = clamp01(progress);
    }

    function onScrollOrResize() {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(measure);
      }
    }

    measure();
    window.addEventListener("scroll", onScrollOrResize, { passive: true });
    window.addEventListener("resize", onScrollOrResize);
    return () => {
      window.removeEventListener("scroll", onScrollOrResize);
      window.removeEventListener("resize", onScrollOrResize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useFrame((state, delta) => {
    const activeIndex = activeIndexRef.current.value;
    const progress = progressRef.current.value;
    const stop = zoneStops[activeIndex];

    frameCount.current.value += 1;
    const shouldSampleTrail = frameCount.current.value % TRAIL_SAMPLE_EVERY_N_FRAMES === 0;

    // La transición de `start` a `end` ocurre rápido, en el primer tramo del scroll de la zona;
    // el resto del scroll se queda en reposo exactamente en `end`.
    const sectionProgress = smoothstep(0, TRANSITION_RANGE, progress);

    for (const id of SPHERE_IDS) {
      const sphere = runtime.current[id];
      const { start, end } = stop.spheres[id];

      sphere.previous.copy(sphere.current);

      const targetNormalized = lerpPosition(start.position, end.position, sectionProgress);
      const [tx, ty, tz] = normalizedToWorld(camera, targetNormalized);
      const positionSmoothing = 1 - Math.exp(-POSITION_SMOOTHING_RATE * delta);
      sphere.current.lerp(new Vector3(tx, ty, tz), positionSmoothing);

      const speed = delta > 0 ? sphere.previous.distanceTo(sphere.current) / delta : 0;
      sphere.motionFactor = smoothstep(MIN_MOTION_SPEED, MAX_MOTION_SPEED, speed);

      const screenFraction = lerp(start.screenFraction, end.screenFraction, sectionProgress);
      sphere.radius = radiusForScreenFraction(camera, sphere.current.z, screenFraction) + 0.001;
    }

    // Anti-colisión: separar el par si queda más cerca que la suma de sus radios,
    // ANTES de aplicar las posiciones a los sprites.
    const collisionMargin = stop.collisionMargin ?? DEFAULT_COLLISION_MARGIN;
    const sphereA = runtime.current.a;
    const sphereB = runtime.current.b;
    const minDistance = (sphereA.radius + sphereB.radius) * (1 + collisionMargin);
    const delta3 = sphereB.current.clone().sub(sphereA.current);
    const distance = delta3.length();
    if (distance > 0.0001 && distance < minDistance) {
      const overlap = (minDistance - distance) / 2;
      const direction = delta3.normalize();
      sphereA.current.addScaledVector(direction, -overlap);
      sphereB.current.addScaledVector(direction, overlap);
    }

    for (const id of SPHERE_IDS) {
      const sphere = runtime.current[id];
      const { radius, motionFactor } = sphere;
      const displayColor = colors.current[id];

      const mainHandle = sphere.mainRef.current;
      if (mainHandle?.group && mainHandle.material) {
        mainHandle.group.position.copy(sphere.current);
        mainHandle.group.scale.setScalar(radius * SPRITE_SIZE_FACTOR);
        mainHandle.material.color.copy(displayColor);
        mainHandle.material.opacity = 0.9;
      }

      if (shouldSampleTrail) {
        sphere.trail.pop();
        sphere.trail.unshift(sphere.current.clone());
      }

      sphere.ghostRefs.forEach((ghostRef, index) => {
        const ghostHandle = ghostRef.current;
        if (!ghostHandle?.group || !ghostHandle.material) return;
        const trailPos = sphere.trail[index];
        const fade = 1 - (index + 1) / (TRAIL_LENGTH + 1);
        ghostHandle.group.position.copy(trailPos);
        ghostHandle.group.scale.setScalar(radius * SPRITE_SIZE_FACTOR * (0.55 + 0.35 * fade));
        ghostHandle.material.color.copy(displayColor);
        ghostHandle.material.opacity = 0.35 * fade * motionFactor;
      });
    }

    // El resto de la página (marco del encabezado, botones, divisor, galería) sigue en vivo
    // cuál de las 2 esferas está más a la izquierda en pantalla — mismas 2 variables CSS que
    // ya consumían esos componentes desde el ajuste post-014 (--project-left/-right-color).
    if (typeof document !== "undefined") {
      const screenA = projectToScreenFraction(camera, sphereA.current);
      const screenB = projectToScreenFraction(camera, sphereB.current);
      const isAOnLeft = screenA.x <= screenB.x;
      const root = document.documentElement;
      root.style.setProperty("--project-left-color", isAOnLeft ? colorA : colorB);
      root.style.setProperty("--project-right-color", isAOnLeft ? colorB : colorA);
    }

    // Deriva idle muy sutil de cámara, para que la escena no se sienta congelada entre scrolls.
    const t = state.clock.elapsedTime;
    camera.position.x = Math.sin(t * 0.05) * 0.08;
    camera.position.y = Math.cos(t * 0.04) * 0.05;
    camera.lookAt(0, 0, 0);
  });

  return (
    <>
      {SPHERE_IDS.map((id) => (
        <group key={id}>
          <GradientBlob ref={runtime.current[id].mainRef} texture={texture.current} color="#ffffff" />
          {runtime.current[id].ghostRefs.map((ghostRef, index) => (
            <GradientBlob key={index} ref={ghostRef} texture={texture.current} color="#ffffff" opacity={0} />
          ))}
        </group>
      ))}
    </>
  );
}
