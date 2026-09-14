import { useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";
import { Color, Vector3, type PerspectiveCamera } from "three";
import { getGradientTexture } from "../gradientTexture";
import GradientBlob, { type GradientBlobHandle } from "../GradientBlob";
import { DEFAULT_COLLISION_MARGIN, type ResolvedZoneStop } from "./zoneStops";
import { normalizedToWorld, radiusForScreenFraction } from "../viewport";
import { projectToScreenFraction } from "./screenProjection";
import { useZoneScrollRefs } from "./useZoneScrollRefs";

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

/** Colores por pose (hex fijo): memoizados para no crear un `Color` nuevo cada frame. */
const colorCache = new Map<string, Color>();
function getColor(hex: string): Color {
  let color = colorCache.get(hex);
  if (!color) {
    color = new Color(hex);
    colorCache.set(hex, color);
  }
  return color;
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
  displayColor: Color;
  radius: number;
  /** Si `screenFraction` en este frame es > 0 — esferas "dormidas" (aún no nacidas) no cuentan como on-screen. */
  active: boolean;
  motionFactor: number;
  trail: Vector3[];
  mainRef: { current: GradientBlobHandle | null };
  ghostRefs: { current: GradientBlobHandle | null }[];
}

/** Estado resuelto de una esfera al final de un frame, lo que recibe `onFrame`. */
export interface SphereFrameState {
  id: string;
  x: number;
  y: number;
  color: string;
  active: boolean;
}

export type OnFrameCallback = (spheres: readonly SphereFrameState[], camera: PerspectiveCamera) => void;

interface Props {
  sphereIds: readonly string[];
  zoneStops: readonly ResolvedZoneStop[];
  /** Factor de escala de tamaño según aspect ratio (ej. `mobilePortraitSizeScale` de Inicio); por defecto no escala. */
  sizeScale?: (aspect: number) => number;
  /** Llamado una vez por frame con el estado resuelto de cada esfera — cada escenario decide qué variables CSS publicar. */
  onFrame?: OnFrameCallback;
}

const IDENTITY_SCALE = () => 1;

/**
 * Bucle de animación genérico del fondo 3D: interpola posición/color/tamaño por zona de scroll,
 * aplica anti-colisión entre esferas, dibuja una estela sutil y una deriva idle de cámara. Sin
 * conocimiento de cuántas esferas hay ni de dónde sale su color — eso lo define `zoneStops`
 * (motor compartido por Inicio, detalle de proyecto y listado de proyectos, ver
 * 034-unificar-escenas-threejs/plan.md).
 */
export default function SceneContent({ sphereIds, zoneStops, sizeScale = IDENTITY_SCALE, onFrame }: Props) {
  const { camera } = useThree((state) => ({ camera: state.camera as PerspectiveCamera }));

  const texture = useStableRef(() => getGradientTexture());

  const runtime = useStableRef<Record<string, SphereRuntime>>(() => {
    const result: Record<string, SphereRuntime> = {};
    for (const id of sphereIds) {
      // Arranca directo en la posición inicial de la primera zona, sin animación de "vuelo".
      const initialPose = zoneStops[0].spheres[id].start;
      const initialPosition = new Vector3(...normalizedToWorld(camera, initialPose.position));
      result[id] = {
        current: initialPosition.clone(),
        previous: initialPosition.clone(),
        displayColor: getColor(initialPose.color).clone(),
        radius: 0,
        active: initialPose.screenFraction > 0,
        motionFactor: 0,
        trail: Array.from({ length: TRAIL_LENGTH }, () => new Vector3()),
        mainRef: { current: null },
        ghostRefs: Array.from({ length: TRAIL_LENGTH }, () => ({ current: null as GradientBlobHandle | null })),
      };
    }
    return result;
  });

  const frameCount = useStableRef(() => ({ value: 0 }));
  const { activeIndexRef, progressRef } = useZoneScrollRefs(zoneStops.map((stop) => stop.zoneId));

  const frameStates = useStableRef<SphereFrameState[]>(() =>
    sphereIds.map((id) => ({ id, x: 0, y: 0, color: "#000000", active: true })),
  );

  useFrame((state, delta) => {
    const stop = zoneStops[activeIndexRef.current];
    const progress = progressRef.current;

    frameCount.current.value += 1;
    const shouldSampleTrail = frameCount.current.value % TRAIL_SAMPLE_EVERY_N_FRAMES === 0;

    // La transición de `start` a `end` ocurre rápido, en el primer tramo del scroll de la zona;
    // el resto del scroll se queda en reposo exactamente en `end`.
    const zoneProgress = smoothstep(0, TRANSITION_RANGE, progress);
    const scale = sizeScale(camera.aspect);

    for (const id of sphereIds) {
      const sphere = runtime.current[id];
      const { start, end } = stop.spheres[id];

      sphere.previous.copy(sphere.current);

      const targetNormalized = lerpPosition(start.position, end.position, zoneProgress);
      const [tx, ty, tz] = normalizedToWorld(camera, targetNormalized);
      const positionSmoothing = 1 - Math.exp(-POSITION_SMOOTHING_RATE * delta);
      sphere.current.lerp(new Vector3(tx, ty, tz), positionSmoothing);

      const speed = delta > 0 ? sphere.previous.distanceTo(sphere.current) / delta : 0;
      sphere.motionFactor = smoothstep(MIN_MOTION_SPEED, MAX_MOTION_SPEED, speed);

      const targetColor = getColor(start.color).clone().lerp(getColor(end.color), zoneProgress);
      sphere.displayColor.copy(targetColor);

      const rawScreenFraction = lerp(start.screenFraction, end.screenFraction, zoneProgress);
      sphere.active = rawScreenFraction > 0;
      const screenFraction = rawScreenFraction * scale;
      sphere.radius = radiusForScreenFraction(camera, sphere.current.z, screenFraction) + 0.001;
    }

    // Anti-colisión: separar pares que queden más cerca que la suma de sus radios,
    // ANTES de aplicar las posiciones a los sprites (si no, el render de este frame
    // usa la posición sin corregir y el solapamiento nunca desaparece visualmente).
    const collisionMargin = stop.collisionMargin ?? DEFAULT_COLLISION_MARGIN;
    for (let i = 0; i < sphereIds.length; i += 1) {
      for (let j = i + 1; j < sphereIds.length; j += 1) {
        const sphereA = runtime.current[sphereIds[i]];
        const sphereB = runtime.current[sphereIds[j]];
        const minDistance = (sphereA.radius + sphereB.radius) * (1 + collisionMargin);
        const delta3 = sphereB.current.clone().sub(sphereA.current);
        const distance = delta3.length();
        if (distance > 0.0001 && distance < minDistance) {
          const overlap = (minDistance - distance) / 2;
          const direction = delta3.normalize();
          sphereA.current.addScaledVector(direction, -overlap);
          sphereB.current.addScaledVector(direction, overlap);
        }
      }
    }

    sphereIds.forEach((id, index) => {
      const sphere = runtime.current[id];
      const { radius, motionFactor } = sphere;

      const mainHandle = sphere.mainRef.current;
      if (mainHandle?.group && mainHandle.material) {
        mainHandle.group.position.copy(sphere.current);
        mainHandle.group.scale.setScalar(radius * SPRITE_SIZE_FACTOR);
        mainHandle.material.color.copy(sphere.displayColor);
        mainHandle.material.opacity = 0.9;
      }

      if (shouldSampleTrail) {
        sphere.trail.pop();
        sphere.trail.unshift(sphere.current.clone());
      }

      sphere.ghostRefs.forEach((ghostRef, ghostIndex) => {
        const ghostHandle = ghostRef.current;
        if (!ghostHandle?.group || !ghostHandle.material) return;
        const trailPos = sphere.trail[ghostIndex];
        const fade = 1 - (ghostIndex + 1) / (TRAIL_LENGTH + 1);
        ghostHandle.group.position.copy(trailPos);
        ghostHandle.group.scale.setScalar(radius * SPRITE_SIZE_FACTOR * (0.55 + 0.35 * fade));
        ghostHandle.material.color.copy(sphere.displayColor);
        ghostHandle.material.opacity = 0.35 * fade * motionFactor;
      });

      if (onFrame) {
        const screen = projectToScreenFraction(camera, sphere.current);
        const frameState = frameStates.current[index];
        frameState.x = screen.x;
        frameState.y = screen.y;
        frameState.color = `#${sphere.displayColor.getHexString()}`;
        frameState.active = sphere.active;
      }
    });

    if (onFrame) {
      onFrame(frameStates.current, camera);
    }

    // Deriva idle muy sutil de cámara, para que la escena no se sienta congelada entre scrolls.
    const t = state.clock.elapsedTime;
    camera.position.x = Math.sin(t * 0.05) * 0.08;
    camera.position.y = Math.cos(t * 0.04) * 0.05;
    camera.lookAt(0, 0, 0);
  });

  return (
    <>
      {sphereIds.map((id) => (
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
