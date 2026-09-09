import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
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
 * Resuelve la ruta absoluta en disco de una imagen local referenciada en el frontmatter
 * de una entrada de content collection (ej. `coverImage: "../../assets/projects/x.jpg"`).
 *
 * Necesario porque `entry.data.coverImage` (ya procesado por el helper `image()` de Zod)
 * solo expone la URL pública optimizada (`/_astro/x.HASH.jpg`), cuyo archivo aún no existe
 * en disco en el momento en que se renderiza la página (se genera después, en la fase
 * "generating optimized images" del build) — no sirve para leer bytes con `sharp`.
 * Se relee el frontmatter crudo en vez de eso para obtener la ruta relativa original.
 */
function resolveContentImagePath(entryFilePath: string, field: string): string {
  const raw = readFileSync(resolve(process.cwd(), entryFilePath), "utf-8");
  const match = raw.match(new RegExp(`^${field}:\\s*"([^"]+)"`, "m"));
  if (!match) {
    throw new Error(`No se encontró el campo "${field}" en el frontmatter de ${entryFilePath}`);
  }
  return resolve(dirname(resolve(process.cwd(), entryFilePath)), match[1]);
}

/**
 * Extrae los 2 colores dominantes de la imagen de portada de una entrada de content
 * collection, en build-time, vía cuantización simple + filtro de saturación. Cae a
 * `FALLBACK` si no puede leer el archivo o si la imagen no tiene suficiente color
 * (ej. casi todo gris/blanco/negro).
 */
export async function getDominantColors(entryFilePath: string, field = "coverImage"): Promise<[string, string]> {
  try {
    const imagePath = resolveContentImagePath(entryFilePath, field);
    const { data, info } = await sharp(imagePath)
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
    // negro) y casi blancos: el fondo debe quedarse con el color "principal"
    // vívido de la imagen, no con sombras.
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
