import sharp from "sharp";

/** `--color-accent` / `--color-accent-2` — usado si la extracción falla o la imagen no tiene suficiente color. */
const FALLBACK: [string, string] = ["#C0009D", "#0033FF"];

interface RgbColor {
  r: number;
  g: number;
  b: number;
  count: number;
}

function lightness({ r, g, b }: RgbColor): number {
  const max = Math.max(r, g, b) / 255;
  const min = Math.min(r, g, b) / 255;
  return (max + min) / 2;
}

function saturation({ r, g, b }: RgbColor): number {
  const max = Math.max(r, g, b) / 255;
  const min = Math.min(r, g, b) / 255;
  if (max === min) return 0;
  const l = (max + min) / 2;
  return (max - min) / (1 - Math.abs(2 * l - 1));
}

function distance(a: RgbColor, b: RgbColor): number {
  return Math.sqrt((a.r - b.r) ** 2 + (a.g - b.g) ** 2 + (a.b - b.b) ** 2);
}

function toHex({ r, g, b }: RgbColor): string {
  const channel = (value: number) => Math.round(value).toString(16).padStart(2, "0");
  return `#${channel(r)}${channel(g)}${channel(b)}`;
}

/**
 * Extrae los 2 colores dominantes de una imagen vía cuantización simple + filtro de
 * saturación/lightness, sobre un buffer ya en memoria (no toca disco). Cae a `FALLBACK`
 * si la imagen no tiene suficiente color (ej. casi todo gris/blanco/negro) o si sharp falla.
 */
export async function extractDominantColors(imageBuffer: Buffer): Promise<[string, string]> {
  try {
    const { data, info } = await sharp(imageBuffer)
      .resize(48, 48, { fit: "cover" })
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const buckets = new Map<string, RgbColor>();
    for (let i = 0; i < data.length; i += info.channels) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const key = `${r >> 4}-${g >> 4}-${b >> 4}`; // cuantiza a 16 niveles/canal
      const bucket = buckets.get(key) ?? { r: 0, g: 0, b: 0, count: 0 };
      bucket.r += r;
      bucket.g += g;
      bucket.b += b;
      bucket.count += 1;
      buckets.set(key, bucket);
    }

    // Descarta tonos oscuros (aunque tengan buena saturación, ej. rojo casi
    // negro) y casi blancos: se busca el color "principal" vívido de la
    // imagen, no las sombras.
    const candidates = [...buckets.values()]
      .map(({ r, g, b, count }) => ({ r: r / count, g: g / count, b: b / count, count }))
      .filter((color) => saturation(color) > 0.15 && lightness(color) > 0.28 && lightness(color) < 0.9)
      .sort((a, b) => b.count - a.count);

    const first = candidates[0];
    if (!first) return FALLBACK;

    const second = candidates.find((color) => distance(color, first) > 60);
    return [toHex(first), second ? toHex(second) : FALLBACK[1]];
  } catch {
    return FALLBACK;
  }
}
