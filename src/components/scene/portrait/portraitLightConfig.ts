/**
 * Intensidades del relight de retratos (093). Constantes en código a propósito: editarlas desde el
 * panel queda fuera de alcance (ver spec). Las fotos ya vienen con su propia iluminación (luz desde
 * la izquierda, sombras a la derecha), así que el relight no agrega luz direccional: la esfera más
 * a la izquierda en pantalla tiñe las sombras de la foto y la más a la derecha sus luces, cada una
 * con una intensidad que depende de qué tan cerca esté del retrato.
 */
export interface PortraitLightTheme {
  /** Intensidad máxima del tinte de sombras (esfera izquierda pegada al retrato). */
  shadowToneStrength: number;
  /** Intensidad máxima del tinte de luces (esfera derecha pegada al retrato). */
  lightToneStrength: number;
  /**
   * Rangos de luminancia: [sombra plena hasta, sombra termina en, luz empieza en, luz plena desde].
   * Entre medio los medios tonos reciben poco de ambos.
   */
  toneRanges: readonly [number, number, number, number];
  /** Opacidad máxima de la sombra proyectada. */
  shadowOpacity: number;
  /** La sombra es `--color-surface` multiplicado por este factor (0 = negro). */
  shadowShade: number;
}

export const PORTRAIT_LIGHT_THEMES: Record<"light" | "dark", PortraitLightTheme> = {
  light: { shadowToneStrength: 0.45, lightToneStrength: 0.35, toneRanges: [0.1, 0.5, 0.4, 0.9], shadowOpacity: 0.26, shadowShade: 0.25 },
  dark: { shadowToneStrength: 0.6, lightToneStrength: 0.45, toneRanges: [0.1, 0.5, 0.4, 0.9], shadowOpacity: 0.38, shadowShade: 0.2 },
};

/**
 * Cercanía → intensidad: `1 / (1 + (d / (radio × TONE_FALLOFF_RADII))²)`, con `d` la distancia del
 * centro de la esfera al centro del retrato. Con la esfera a esa distancia el tinte queda a la mitad.
 */
export const TONE_FALLOFF_RADII = 2.2;
/**
 * Cuánto se protege la piel del tinte (0 = sin protección, 1 = la piel no se tiñe nada). Se deja
 * un poco de tinte para que la cara no quede "recortada" del resto del retrato.
 */
export const SKIN_PROTECTION = 0.85;
/** Lo mismo para tonos cálidos oscuros (pelo castaño): protección intermedia, toma algo de la escena. */
export const HAIR_PROTECTION = 0.75;
/** Velocidad del suavizado temporal de color/intensidad del tinte (1/s), para que no salte al cambiar de esfera. */
export const TONE_SMOOTHING_RATE = 6;

/** Margen del canvas alrededor del retrato (fracción del alto del retrato), para dibujar la sombra. */
export const SHADOW_PAD_RATIO = 0.12;
/** Desplazamiento máximo de la sombra (fracción del alto del retrato). */
export const SHADOW_DISTANCE_RATIO = 0.018;
/** Radio extra de difuminado de la sombra (en pasos de muestreo de la textura de alfa). */
export const SHADOW_SOFTNESS_TEXELS = 4;
/** Velocidad del suavizado temporal de la dirección de la sombra (1/s). */
export const SHADOW_SMOOTHING_RATE = 5;

/** Alto (px) de la textura de alfa difuminado de la que sale la sombra proyectada. */
export const ALPHA_TEXTURE_HEIGHT = 160;
/** Radio del blur (px de esa textura). */
export const ALPHA_BLUR_PX = 5;

/** Mismo tope de DPR que la escena (`SceneCanvas`), más un tope absoluto por lado. */
export const MAX_DPR = 1.5;
export const MAX_BACKING_SIZE = 1600;
