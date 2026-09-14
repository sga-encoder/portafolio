import { mkdirSync } from "node:fs";
import { basename, resolve } from "node:path";
import {
  syncAll,
  syncFile,
  listImageFiles,
  formatUploadError,
  SOURCE_DIR_NAME,
  type CloudinaryUploaderLike,
  type SyncLogger,
} from "./sync.js";

export interface ChokidarWatcherLike {
  on(event: "add" | "change" | "ready", listener: (path: string) => void): unknown;
  close(): Promise<void>;
}

export interface ChokidarModuleLike {
  watch(paths: string, options: Record<string, unknown>): ChokidarWatcherLike;
}

export interface StartWatchingOptions {
  chokidar: ChokidarModuleLike;
  cloudinary: CloudinaryUploaderLike;
  logger: SyncLogger;
}

const DEBOUNCE_MS = 300;

/**
 * Sincroniza lo que ya existe en `cloudinary-images/` (bloqueante — el llamador debe
 * esperar esta promesa) y luego arranca el watch en vivo para la sesión de dev, devolviendo
 * una función para detenerlo (`astro:server:done`).
 *
 * El bloqueo importa: Astro carga las content collections apenas el hook que llama a esto
 * resuelve, y su schema valida las claves contra el manifest — si no se espera la subida
 * inicial, la primera vez que corre (manifest vacío) esa validación falla en carrera contra
 * subidas que todavía no terminaron.
 */
export async function startWatching({ chokidar, cloudinary, logger }: StartWatchingOptions): Promise<() => void> {
  const sourceDir = resolve(process.cwd(), SOURCE_DIR_NAME);
  mkdirSync(sourceDir, { recursive: true });

  await syncAll(listImageFiles(sourceDir), sourceDir, cloudinary, logger);

  // Cola secuencial: syncFile hace read-modify-write del manifest — 2 subidas
  // concurrentes podrían pisarse la una a la otra si no se serializan.
  let queue: Promise<void> = Promise.resolve();
  const debounceTimers = new Map<string, ReturnType<typeof setTimeout>>();

  function scheduleSync(absPath: string): void {
    if (basename(absPath).startsWith(".")) return; // .gitkeep y similares

    const existingTimer = debounceTimers.get(absPath);
    if (existingTimer) clearTimeout(existingTimer);

    debounceTimers.set(
      absPath,
      setTimeout(() => {
        debounceTimers.delete(absPath);
        queue = queue
          .then(() => syncFile(absPath, sourceDir, cloudinary, logger))
          .catch((error: unknown) => {
            logger.error(`${absPath}: ${formatUploadError(error)}`);
          });
      }, DEBOUNCE_MS),
    );
  }

  // `ignoreInitial: true`: los archivos ya presentes se sincronizaron arriba, de forma
  // bloqueante — no hace falta que chokidar los vuelva a emitir como "add".
  const watcher = chokidar.watch(sourceDir, {
    ignoreInitial: true,
    awaitWriteFinish: { stabilityThreshold: 300, pollInterval: 100 },
  });

  watcher.on("add", scheduleSync);
  watcher.on("change", scheduleSync);

  logger.info(`observando ${SOURCE_DIR_NAME}/`);

  return () => {
    for (const timer of debounceTimers.values()) clearTimeout(timer);
    void watcher.close();
  };
}
