import { mkdirSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

export interface CloudinaryManifestEntry {
  publicId: string;
  url: string;
  hash: string;
  width: number;
  height: number;
  format: string;
  colors: [string, string];
  sourcePath: string;
  uploadedAt: string;
}

export interface CloudinaryManifest {
  $schemaVersion: number;
  images: Record<string, CloudinaryManifestEntry>;
}

export const MANIFEST_PATH = resolve(process.cwd(), "src/data/cloudinaryManifest.json");

const EMPTY_MANIFEST: CloudinaryManifest = { $schemaVersion: 1, images: {} };

export function readManifest(): CloudinaryManifest {
  if (!existsSync(MANIFEST_PATH)) return structuredClone(EMPTY_MANIFEST);
  try {
    return JSON.parse(readFileSync(MANIFEST_PATH, "utf-8")) as CloudinaryManifest;
  } catch {
    return structuredClone(EMPTY_MANIFEST);
  }
}

export function writeManifest(manifest: CloudinaryManifest): void {
  mkdirSync(dirname(MANIFEST_PATH), { recursive: true });
  writeFileSync(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`, "utf-8");
}
