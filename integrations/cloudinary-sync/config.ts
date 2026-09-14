import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

export interface CloudinaryConfig {
  cloud_name: string;
  api_key: string;
  api_secret: string;
}

/**
 * Loader mínimo de `.env` (subconjunto `KEY=VALUE` por línea, sin soporte
 * multilínea/`export`). No pisa vars ya definidas por el proceso/host —
 * inofensivo si Astro ya puebla `process.env` por su cuenta.
 */
function loadEnvFileIfNeeded(): void {
  const envPath = resolve(process.cwd(), ".env");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf-8").split("\n")) {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*?)\s*$/);
    if (!match) continue;
    const [, key, rawValue] = match;
    if (process.env[key] !== undefined) continue;
    process.env[key] = rawValue.replace(/^["']|["']$/g, "");
  }
}

/** Lanza si faltan credenciales — el llamador (integrations/cloudinary-sync/index.ts) debe capturarlo y degradar con gracia. */
export function getCloudinaryConfig(): CloudinaryConfig {
  loadEnvFileIfNeeded();
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error(
      "Faltan CLOUDINARY_CLOUD_NAME/CLOUDINARY_API_KEY/CLOUDINARY_API_SECRET en .env — ver .env.example.",
    );
  }
  return { cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret };
}
