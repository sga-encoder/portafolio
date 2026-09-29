import {
  CanvasTexture,
  ClampToEdgeWrapping,
  LinearFilter,
  Mesh,
  NoBlending,
  OrthographicCamera,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  Texture,
  Vector2,
  Vector3,
  Vector4,
  WebGLRenderer,
} from "three";
import type { PortraitLightTheme } from "./portraitLightConfig";
import { HAIR_PROTECTION, SHADOW_SOFTNESS_TEXELS, SKIN_PROTECTION } from "./portraitLightConfig";

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

/**
 * Todo en espacio "canvas UV" (0..1 sobre el canvas, y hacia arriba). Las fotos ya traen su propia
 * iluminación (luz desde la izquierda, sombras a la derecha), así que no se simula una luz
 * direccional: se hace un split-toning por luminancia — las zonas oscuras de la foto toman el color
 * de una esfera y las claras el de otra, con la intensidad que llega calculada desde JS según la
 * cercanía de cada esfera. Salida premultiplicada: el retrato va encima de su propia sombra.
 */
const fragmentShader = /* glsl */ `
  precision highp float;
  varying vec2 vUv;

  uniform sampler2D uImage;
  uniform sampler2D uAlpha;
  uniform vec4 uPadRect;
  uniform vec4 uImgRect;
  uniform vec2 uAlphaTexel;

  uniform vec3 uShadowTone;
  uniform float uShadowToneAmount;
  uniform vec3 uLightTone;
  uniform float uLightToneAmount;
  uniform vec4 uToneRanges;
  uniform float uSkinProtection;
  uniform float uHairProtection;

  uniform vec2 uShadowOffset;
  uniform vec3 uShadowColor;
  uniform float uShadowOpacity;
  uniform float uShadowSoftness;

  float blurredAlpha(vec2 uv) {
    return texture2D(uAlpha, uv).a;
  }

  // 9 muestras en disco sobre el alfa ya difuminado, para que la sombra proyectada no se lea como una segunda figura.
  float softShadow(vec2 uv) {
    vec2 r = uAlphaTexel * uShadowSoftness;
    float sum = blurredAlpha(uv) * 0.2;
    sum += blurredAlpha(uv + vec2(r.x, 0.0)) * 0.1;
    sum += blurredAlpha(uv - vec2(r.x, 0.0)) * 0.1;
    sum += blurredAlpha(uv + vec2(0.0, r.y)) * 0.1;
    sum += blurredAlpha(uv - vec2(0.0, r.y)) * 0.1;
    sum += blurredAlpha(uv + r * 0.7071) * 0.1;
    sum += blurredAlpha(uv - r * 0.7071) * 0.1;
    sum += blurredAlpha(uv + vec2(r.x, -r.y) * 0.7071) * 0.1;
    sum += blurredAlpha(uv + vec2(-r.x, r.y) * 0.7071) * 0.1;
    return sum;
  }

  // Protección de tonos cálidos naturales por crominancia (YCbCr, rango clásico de piel Cb 77–127 /
  // Cr 133–173 sobre 255) con bordes suaves. Grises (Cb = Cr = 0.5) y violetas/azules (Cb alto)
  // quedan fuera. Con luminancia media/alta es piel (protección fuerte); oscuro y cálido es pelo
  // castaño (protección intermedia, para que tome algo de la escena sin perder su color).
  float naturalToneProtection(vec3 rgb, float luma) {
    float cb = 0.5 - 0.168736 * rgb.r - 0.331264 * rgb.g + 0.5 * rgb.b;
    float cr = 0.5 + 0.5 * rgb.r - 0.418688 * rgb.g - 0.081312 * rgb.b;
    float inCb = smoothstep(0.27, 0.30, cb) * (1.0 - smoothstep(0.49, 0.51, cb));
    float inCr = smoothstep(0.505, 0.525, cr) * (1.0 - smoothstep(0.67, 0.70, cr));
    return inCb * inCr * mix(uHairProtection, uSkinProtection, smoothstep(0.14, 0.26, luma));
  }


  void main() {
    // El canvas puede estar recortado al viewport: uv es la posición dentro del rectángulo completo (retrato + margen).
    vec2 uv = uPadRect.xy + vUv * uPadRect.zw;
    vec2 imgUv = (uv - uImgRect.xy) / uImgRect.zw;
    vec4 base = vec4(0.0);
    if (imgUv.x >= 0.0 && imgUv.x <= 1.0 && imgUv.y >= 0.0 && imgUv.y <= 1.0) {
      base = texture2D(uImage, imgUv);
    }

    float shadow = softShadow(uv - uShadowOffset) * uShadowOpacity;
    if (base.a < 0.004) {
      gl_FragColor = vec4(uShadowColor * shadow, shadow);
      return;
    }

    vec3 color = base.rgb;
    float luma = dot(color, vec3(0.2126, 0.7152, 0.0722));
    // Sobre la piel el tinte casi no actúa y sobre el pelo castaño actúa a medias.
    float keep = 1.0 - naturalToneProtection(color, luma);

    // Sombras de la foto: se recolorean hacia la esfera izquierda conservando su luminancia.
    float shadowWeight = 1.0 - smoothstep(uToneRanges.x, uToneRanges.y, luma);
    float toneLuma = max(dot(uShadowTone, vec3(0.2126, 0.7152, 0.0722)), 0.05);
    vec3 tintedShadow = uShadowTone * (luma / toneLuma);
    color = mix(color, clamp(tintedShadow, 0.0, 1.0), shadowWeight * uShadowToneAmount * keep);

    // Luces de la foto: se suman (screen) el color de la esfera derecha.
    float lightWeight = smoothstep(uToneRanges.z, uToneRanges.w, luma);
    vec3 lightAdd = uLightTone * lightWeight * uLightToneAmount * keep;
    color = 1.0 - (1.0 - color) * (1.0 - clamp(lightAdd, 0.0, 1.0));

    float alpha = base.a + shadow * (1.0 - base.a);
    gl_FragColor = vec4(color * base.a + uShadowColor * shadow * (1.0 - base.a), alpha);
  }
`;

export interface PortraitFrameInput {
  image: Texture;
  alpha: Texture;
  /** Parte visible del rectángulo completo (retrato + margen) que ocupa el canvas, en UV de ese rectángulo. */
  padRect: readonly [number, number, number, number];
  /** Rectángulo del retrato dentro del rectángulo completo, en UV (y hacia arriba): x, y, ancho, alto. */
  imgRect: readonly [number, number, number, number];
  alphaTexel: readonly [number, number];
  /** Color (RGB 0..1, sRGB) e intensidad 0..1 que tiñe las sombras de la foto (esfera más a la izquierda). */
  shadowTone: readonly [number, number, number];
  shadowToneAmount: number;
  /** Color e intensidad que tiñe las luces de la foto (esfera más a la derecha). */
  lightTone: readonly [number, number, number];
  lightToneAmount: number;
  shadowOffset: readonly [number, number];
  shadowColor: readonly [number, number, number];
  theme: PortraitLightTheme;
}

function prepareTexture<T extends Texture>(texture: T): T {
  texture.minFilter = LinearFilter;
  texture.magFilter = LinearFilter;
  texture.wrapS = ClampToEdgeWrapping;
  texture.wrapT = ClampToEdgeWrapping;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;
  return texture;
}

export interface PortraitRenderer {
  createImageTexture(image: HTMLImageElement): Texture;
  createAlphaTexture(canvas: HTMLCanvasElement): Texture;
  /** Dibuja un retrato en `target` (canvas 2D del slot), con backing de `width`×`height` px. */
  render(target: CanvasRenderingContext2D, width: number, height: number, input: PortraitFrameInput): void;
  dispose(): void;
}

/**
 * Un único `WebGLRenderer` (un solo contexto WebGL) para todos los retratos: cada slot se dibuja
 * en una esquina del buffer compartido y se copia a su propio canvas 2D. Así la cantidad de
 * retratos (Header rotativo ×2 variantes, páginas del carrusel de Habilidades, Sobre mí ×2) no
 * choca con el límite de contextos WebGL del navegador.
 */
export function createPortraitRenderer(): PortraitRenderer {
  const renderer = new WebGLRenderer({ alpha: true, antialias: false, premultipliedAlpha: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1);
  renderer.setClearColor(0x000000, 0);
  renderer.autoClear = false;
  const glCanvas = renderer.domElement;
  let bufferWidth = 0;
  let bufferHeight = 0;

  const uniforms = {
    uImage: { value: null as Texture | null },
    uAlpha: { value: null as Texture | null },
    uPadRect: { value: new Vector4(0, 0, 1, 1) },
    uImgRect: { value: new Vector4() },
    uAlphaTexel: { value: new Vector2() },
    uShadowTone: { value: new Vector3() },
    uShadowToneAmount: { value: 0 },
    uLightTone: { value: new Vector3() },
    uLightToneAmount: { value: 0 },
    uToneRanges: { value: new Vector4() },
    uSkinProtection: { value: SKIN_PROTECTION },
    uHairProtection: { value: HAIR_PROTECTION },
    uShadowOffset: { value: new Vector2() },
    uShadowColor: { value: new Vector3() },
    uShadowOpacity: { value: 0 },
    uShadowSoftness: { value: SHADOW_SOFTNESS_TEXELS },
  };

  const material = new ShaderMaterial({
    uniforms,
    vertexShader,
    fragmentShader,
    blending: NoBlending,
    transparent: true,
    depthTest: false,
    depthWrite: false,
  });
  const geometry = new PlaneGeometry(2, 2);
  const scene = new Scene();
  scene.add(new Mesh(geometry, material));
  const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);

  return {
    createImageTexture(image) {
      return prepareTexture(new Texture(image));
    },
    createAlphaTexture(canvas) {
      return prepareTexture(new CanvasTexture(canvas));
    },
    render(target, width, height, input) {
      if (width > bufferWidth || height > bufferHeight) {
        bufferWidth = Math.max(bufferWidth, width);
        bufferHeight = Math.max(bufferHeight, height);
        renderer.setSize(bufferWidth, bufferHeight, false);
      }

      uniforms.uImage.value = input.image;
      uniforms.uAlpha.value = input.alpha;
      uniforms.uPadRect.value.set(...input.padRect);
      uniforms.uImgRect.value.set(...input.imgRect);
      uniforms.uAlphaTexel.value.set(...input.alphaTexel);
      uniforms.uShadowTone.value.set(...input.shadowTone);
      uniforms.uShadowToneAmount.value = input.shadowToneAmount * input.theme.shadowToneStrength;
      uniforms.uLightTone.value.set(...input.lightTone);
      uniforms.uLightToneAmount.value = input.lightToneAmount * input.theme.lightToneStrength;
      uniforms.uToneRanges.value.set(...input.theme.toneRanges);
      uniforms.uShadowOffset.value.set(...input.shadowOffset);
      uniforms.uShadowColor.value.set(...input.shadowColor);
      uniforms.uShadowOpacity.value = input.theme.shadowOpacity;

      // Viewport en la esquina inferior izquierda del buffer (origen GL) = filas de abajo del canvas.
      renderer.setViewport(0, 0, width, height);
      renderer.setScissor(0, 0, width, height);
      renderer.setScissorTest(true);
      renderer.clear();
      renderer.render(scene, camera);

      target.clearRect(0, 0, width, height);
      target.drawImage(glCanvas, 0, bufferHeight - height, width, height, 0, 0, width, height);
    },
    dispose() {
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
    },
  };
}
