import { getSceneLights, getSceneLightsVersion } from "../sceneLightBus";
import {
  ALPHA_BLUR_PX,
  ALPHA_TEXTURE_HEIGHT,
  MAX_BACKING_SIZE,
  MAX_DPR,
  PORTRAIT_LIGHT_THEMES,
  SHADOW_DISTANCE_RATIO,
  SHADOW_PAD_RATIO,
  SHADOW_SMOOTHING_RATE,
  TONE_FALLOFF_RADII,
  TONE_SMOOTHING_RATE,
} from "./portraitLightConfig";

/** Mismo margen que `headerFrameVars.ts`: una esfera todavía cuenta como "en pantalla" un poco fuera de [0,1]. */
const ON_SCREEN_MARGIN = 0.25;
import type { PortraitRenderer } from "./portraitMaterial";
import type { Texture } from "three";

/**
 * Relight de retratos de Inicio (093): cada `<img data-portrait-relight>` recibe un `<canvas>`
 * hermano, posicionado exactamente sobre el contenido visible de la imagen (más un margen para la
 * sombra), donde se dibuja el retrato iluminado por las esferas de la escena 3D. El `<img>` queda
 * en el DOM con `opacity: 0` (alt/SEO/lectores de pantalla) y vuelve a verse si algo falla o al
 * salir de la página. `three` y el shader se importan de forma diferida y solo pasan el gate.
 */

type Rgb = [number, number, number];

interface SlotLayout {
  /** Canvas en px CSS (incluye el margen de sombra, recortado al viewport en horizontal). */
  width: number;
  height: number;
  /** Ancho del rectángulo completo sin recortar y cuánto se recortó a la izquierda. */
  fullWidth: number;
  clipOffset: number;
  pad: number;
  contentWidth: number;
  contentHeight: number;
  backingWidth: number;
  backingHeight: number;
}

interface ToneState {
  shadowTone: Rgb;
  shadowAmount: number;
  lightTone: Rgb;
  lightAmount: number;
}

interface ScreenLight {
  x: number;
  y: number;
  radius: number;
  color: Rgb;
}

interface Slot {
  img: HTMLImageElement;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  visible: boolean;
  status: "idle" | "loading" | "ready" | "error";
  natural: { width: number; height: number };
  image: Texture | null;
  alpha: Texture | null;
  alphaTexel: [number, number];
  layout: SlotLayout | null;
  styleKey: string;
  shadow: { x: number; y: number; initialized: boolean };
  /** Tinte suavizado en el tiempo (sombras ← esfera izquierda, luces ← esfera derecha). */
  tone: ToneState | null;
  drawn: boolean;
}

interface Controller {
  dispose(): void;
}

let current: Controller | null = null;

function supportsWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return !!(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

function hexToRgb(hex: string): Rgb {
  const value = hex.trim().replace("#", "");
  const full = value.length === 3 ? value.replace(/./g, (c) => c + c) : value;
  const n = Number.parseInt(full.slice(0, 6), 16);
  if (Number.isNaN(n)) return [0, 0, 0];
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

/** `object-position` computado ("100% 100%", "50% 0%", "12px 4px") → offset en px dentro de la caja. */
function objectPositionOffset(value: string, freeX: number, freeY: number): [number, number] {
  const parts = value.trim().split(/\s+/);
  const resolve = (token: string | undefined, free: number): number => {
    if (!token) return free / 2;
    if (token.endsWith("%")) return (Number.parseFloat(token) / 100) * free;
    if (token.endsWith("px")) return Number.parseFloat(token);
    return free / 2;
  };
  return [resolve(parts[0], freeX), resolve(parts[1], freeY)];
}

/**
 * Alfa difuminado del retrato (una vez, en CPU), con el mismo margen proporcional que el canvas del
 * slot: así el shader lo muestrea con las mismas UV del canvas para las pseudo-normales y la sombra.
 */
function buildAlphaCanvas(image: HTMLImageElement): HTMLCanvasElement {
  const height = ALPHA_TEXTURE_HEIGHT;
  const width = Math.max(1, Math.round((image.naturalWidth / image.naturalHeight) * height));
  const pad = Math.round(SHADOW_PAD_RATIO * height);
  const canvas = document.createElement("canvas");
  canvas.width = width + pad * 2;
  canvas.height = height + pad * 2;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  if (typeof ctx.filter === "string") {
    ctx.filter = `blur(${ALPHA_BLUR_PX}px)`;
    ctx.drawImage(image, pad, pad, width, height);
    return canvas;
  }

  // Sin `ctx.filter` (Safari viejo): reducir y volver a ampliar con suavizado da un blur equivalente.
  const factor = Math.max(2, ALPHA_BLUR_PX);
  const small = document.createElement("canvas");
  small.width = Math.max(1, Math.round(canvas.width / factor));
  small.height = Math.max(1, Math.round(canvas.height / factor));
  const smallCtx = small.getContext("2d");
  if (!smallCtx) return canvas;
  smallCtx.drawImage(image, pad / factor, pad / factor, width / factor, height / factor);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(small, 0, 0, canvas.width, canvas.height);
  return canvas;
}

/** Intensidad 0..1 del tinte de una esfera según qué tan cerca está su centro del centro del retrato. */
function proximity(light: ScreenLight, x: number, y: number): number {
  const reach = light.radius * TONE_FALLOFF_RADII;
  const distanceSq = (light.x - x) ** 2 + (light.y - y) ** 2;
  return 1 / (1 + distanceSq / (reach * reach));
}

function lerpRgb(a: Rgb, b: Rgb, t: number): Rgb {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

function blendTone(from: ToneState, to: ToneState, t: number): ToneState {
  return {
    shadowTone: lerpRgb(from.shadowTone, to.shadowTone, t),
    shadowAmount: from.shadowAmount + (to.shadowAmount - from.shadowAmount) * t,
    lightTone: lerpRgb(from.lightTone, to.lightTone, t),
    lightAmount: from.lightAmount + (to.lightAmount - from.lightAmount) * t,
  };
}

function loadCorsImage(src: string): Promise<HTMLImageElement> {
  const image = new Image();
  image.crossOrigin = "anonymous";
  image.decoding = "async";
  image.src = src;
  return image.decode().then(() => image);
}

function createSlot(img: HTMLImageElement): Slot | null {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  canvas.className = "portrait-relight-canvas";
  canvas.setAttribute("aria-hidden", "true");
  Object.assign(canvas.style, {
    position: "absolute",
    pointerEvents: "none",
    visibility: "hidden",
    maxWidth: "none",
  });
  img.after(canvas);
  return {
    img,
    canvas,
    ctx,
    visible: false,
    status: "idle",
    natural: { width: 0, height: 0 },
    image: null,
    alpha: null,
    alphaTexel: [0, 0],
    layout: null,
    styleKey: "",
    shadow: { x: 0, y: 0, initialized: false },
    tone: null,
    drawn: false,
  };
}

/** Recalcula (cada frame, solo lecturas salvo que algo cambie) dónde va el canvas sobre el contenido real del `<img>`. */
function updateLayout(slot: Slot): SlotLayout | null {
  const { img, canvas, natural } = slot;
  const parent = canvas.offsetParent as HTMLElement | null;
  const rect = img.getBoundingClientRect();
  if (!parent || rect.width < 1 || rect.height < 1 || natural.width < 1) return null;

  const style = getComputedStyle(img);
  let contentWidth = rect.width;
  let contentHeight = rect.height;
  if (style.objectFit === "contain" || style.objectFit === "scale-down") {
    const scale = Math.min(rect.width / natural.width, rect.height / natural.height);
    contentWidth = natural.width * scale;
    contentHeight = natural.height * scale;
  }
  const [offsetX, offsetY] = objectPositionOffset(
    style.objectPosition,
    rect.width - contentWidth,
    rect.height - contentHeight,
  );

  const parentRect = parent.getBoundingClientRect();
  const pad = SHADOW_PAD_RATIO * contentHeight;
  const fullWidth = contentWidth + pad * 2;
  const fullHeight = contentHeight + pad * 2;
  // El margen de sombra no debe salirse del viewport en horizontal (crearía scroll lateral):
  // el canvas se recorta a [0, ancho del viewport] y el shader recibe qué parte del rectángulo ve.
  const fullLeft = rect.left + offsetX - pad;
  const clipLeft = Math.max(fullLeft, 0);
  const clipRight = Math.min(fullLeft + fullWidth, document.documentElement.clientWidth);
  if (clipRight - clipLeft < 1) return null;
  const left = clipLeft - parentRect.left - parent.clientLeft;
  const top = rect.top + offsetY - pad - parentRect.top - parent.clientTop;
  const width = clipRight - clipLeft;
  const height = fullHeight;

  const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
  const cap = Math.min(1, MAX_BACKING_SIZE / (Math.max(width, height) * dpr));
  const backingWidth = Math.max(1, Math.round(width * dpr * cap));
  const backingHeight = Math.max(1, Math.round(height * dpr * cap));

  const styleKey = `${left.toFixed(1)}|${top.toFixed(1)}|${width.toFixed(1)}|${height.toFixed(1)}`;
  if (styleKey !== slot.styleKey) {
    slot.styleKey = styleKey;
    canvas.style.left = `${left}px`;
    canvas.style.top = `${top}px`;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
  }
  if (canvas.width !== backingWidth || canvas.height !== backingHeight) {
    canvas.width = backingWidth;
    canvas.height = backingHeight;
  }

  return {
    width,
    height,
    fullWidth,
    clipOffset: clipLeft - fullLeft,
    pad,
    contentWidth,
    contentHeight,
    backingWidth,
    backingHeight,
  };
}

/** Un retrato con `opacity: 0` en su contenedor (frame inactivo de la rotación del Header) no se dibuja. */
function isFadedOut(slot: Slot): boolean {
  const host = slot.img.parentElement;
  return !!host && Number.parseFloat(getComputedStyle(host).opacity) === 0;
}

function startRelight(renderer: PortraitRenderer, imgs: HTMLImageElement[]): Controller {
  const slots = imgs.map(createSlot).filter((slot): slot is Slot => slot !== null);
  let disposed = false;
  let raf = 0;
  let lastTime = 0;

  const load = (slot: Slot) => {
    if (slot.status !== "idle") return;
    slot.status = "loading";
    loadCorsImage(slot.img.currentSrc || slot.img.src)
      .then((image) => {
        if (disposed) return;
        const alphaCanvas = buildAlphaCanvas(image);
        slot.natural = { width: image.naturalWidth, height: image.naturalHeight };
        slot.image = renderer.createImageTexture(image);
        slot.alpha = renderer.createAlphaTexture(alphaCanvas);
        slot.alphaTexel = [1.5 / alphaCanvas.width, 1.5 / alphaCanvas.height];
        slot.status = "ready";
        schedule();
      })
      .catch(() => {
        // Sin CORS o sin red: ese retrato se queda con su `<img>`.
        slot.status = "error";
      });
  };

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const slot = slots.find((candidate) => candidate.img === entry.target);
        if (!slot) continue;
        slot.visible = entry.isIntersecting;
        if (slot.visible) load(slot);
      }
      schedule();
    },
    { rootMargin: "120px" },
  );
  slots.forEach((slot) => observer.observe(slot.img));

  function schedule() {
    if (!raf && !disposed && slots.some((slot) => slot.visible)) {
      raf = requestAnimationFrame(tick);
    }
  }

  function tick(now: number) {
    raf = 0;
    if (disposed) return;
    const dt = lastTime ? Math.min((now - lastTime) / 1000, 0.1) : 0;
    lastTime = now;

    const version = getSceneLightsVersion();
    // La escena nunca publicó (sin montar): los retratos se quedan con su `<img>`.
    if (version > 0) renderVisible(dt);
    schedule();
  }

  function renderVisible(dt: number) {
    const root = document.documentElement;
    const viewportWidth = root.clientWidth;
    const viewportHeight = root.clientHeight;
    const dark = root.classList.contains("dark");
    const theme = PORTRAIT_LIGHT_THEMES[dark ? "dark" : "light"];
    const surface = hexToRgb(getComputedStyle(root).getPropertyValue("--color-surface") || "#000000");
    const shadowColor: Rgb = [
      surface[0] * theme.shadowShade,
      surface[1] * theme.shadowShade,
      surface[2] * theme.shadowShade,
    ];

    // Solo esferas activas y en pantalla (mismo margen que `headerFrameVars`): una esfera dormida o
    // fuera de cuadro no tiñe nada.
    const lights: ScreenLight[] = getSceneLights()
      .filter((light) => light.active && light.x >= -ON_SCREEN_MARGIN && light.x <= 1 + ON_SCREEN_MARGIN)
      .map((light) => ({
        x: light.x * viewportWidth,
        y: light.y * viewportHeight,
        radius: Math.max(light.radius * viewportHeight, 1),
        color: hexToRgb(light.color),
      }));
    // La más a la izquierda en pantalla tiñe las sombras de la foto; la más a la derecha, las luces.
    // Con una sola esfera en pantalla, esa hace las dos cosas.
    const leftLight = lights.length > 0 ? lights.reduce((min, light) => (light.x < min.x ? light : min)) : null;
    const rightLight = lights.length > 0 ? lights.reduce((max, light) => (light.x > max.x ? light : max)) : null;
    const smoothing = 1 - Math.exp(-TONE_SMOOTHING_RATE * dt);

    for (const slot of slots) {
      if (!slot.visible || slot.status !== "ready" || !slot.image || !slot.alpha) continue;
      if (isFadedOut(slot)) continue;
      const layout = updateLayout(slot);
      if (!layout) continue;
      slot.layout = layout;

      const canvasRect = slot.canvas.getBoundingClientRect();
      const centerX = canvasRect.left - layout.clipOffset + layout.fullWidth / 2;
      const centerY = canvasRect.top + layout.height / 2;

      // Sombra: opuesta a la luz dominante (ponderada por cercanía), con suavizado temporal.
      let sumX = 0;
      let sumY = 0;
      for (const light of lights) {
        const dx = light.x - centerX;
        const dy = light.y - centerY;
        const dist = Math.hypot(dx, dy) || 1;
        const weight = 1 / (1 + (dist * dist) / (light.radius * light.radius * 4));
        sumX += (dx / dist) * weight;
        sumY += (dy / dist) * weight;
      }
      const magnitude = Math.hypot(sumX, sumY);
      const distance = SHADOW_DISTANCE_RATIO * layout.contentHeight;
      const targetX = magnitude > 0.0001 ? (-sumX / magnitude) * distance : 0;
      const targetY = magnitude > 0.0001 ? (-sumY / magnitude) * distance : 0;
      if (!slot.shadow.initialized) {
        slot.shadow = { x: targetX, y: targetY, initialized: true };
      } else {
        const k = 1 - Math.exp(-SHADOW_SMOOTHING_RATE * dt);
        slot.shadow.x += (targetX - slot.shadow.x) * k;
        slot.shadow.y += (targetY - slot.shadow.y) * k;
      }

      const target: ToneState = {
        shadowTone: leftLight?.color ?? [0, 0, 0],
        shadowAmount: leftLight ? proximity(leftLight, centerX, centerY) : 0,
        lightTone: rightLight?.color ?? [0, 0, 0],
        lightAmount: rightLight ? proximity(rightLight, centerX, centerY) : 0,
      };
      slot.tone = slot.tone ? blendTone(slot.tone, target, smoothing) : target;

      renderer.render(slot.ctx, layout.backingWidth, layout.backingHeight, {
        image: slot.image,
        alpha: slot.alpha,
        padRect: [layout.clipOffset / layout.fullWidth, 0, layout.width / layout.fullWidth, 1],
        imgRect: [
          layout.pad / layout.fullWidth,
          layout.pad / layout.height,
          layout.contentWidth / layout.fullWidth,
          layout.contentHeight / layout.height,
        ],
        alphaTexel: slot.alphaTexel,
        shadowTone: slot.tone.shadowTone,
        shadowToneAmount: slot.tone.shadowAmount,
        lightTone: slot.tone.lightTone,
        lightToneAmount: slot.tone.lightAmount,
        shadowOffset: [slot.shadow.x / layout.fullWidth, -slot.shadow.y / layout.height],
        shadowColor,
        theme,
      });

      if (!slot.drawn) {
        slot.drawn = true;
        slot.canvas.style.visibility = "";
        slot.img.style.opacity = "0";
      }
    }
  }

  const onResize = () => schedule();
  window.addEventListener("resize", onResize, { passive: true });

  return {
    dispose() {
      disposed = true;
      if (raf) cancelAnimationFrame(raf);
      observer.disconnect();
      window.removeEventListener("resize", onResize);
      for (const slot of slots) {
        slot.canvas.remove();
        slot.img.style.opacity = "";
        slot.image?.dispose();
        slot.alpha?.dispose();
      }
      renderer.dispose();
    },
  };
}

/**
 * Punto de entrada (idempotente) desde el `<script>` de Inicio. Mismo gate que la escena
 * (`engine/Scene3D.tsx`): sin WebGL o con `prefers-reduced-motion` no se importa nada y se ve el
 * `<img>` de siempre.
 */
export function initPortraitRelight(): void {
  if (current) return;
  const imgs = Array.from(document.querySelectorAll<HTMLImageElement>("img[data-portrait-relight]"));
  if (imgs.length === 0) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !supportsWebGL()) return;

  let cancelled = false;
  let controller: Controller | null = null;
  current = {
    dispose() {
      cancelled = true;
      controller?.dispose();
      current = null;
    },
  };
  document.addEventListener("astro:before-swap", () => current?.dispose(), { once: true });

  import("./portraitMaterial")
    .then(({ createPortraitRenderer }) => {
      if (cancelled) return;
      controller = startRelight(createPortraitRenderer(), imgs);
    })
    .catch(() => {
      // Sin el chunk de `three` (offline, etc.): queda el `<img>`.
      current = null;
    });
}
