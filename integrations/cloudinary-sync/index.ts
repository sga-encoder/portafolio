import { createRequire } from "node:module";
import type { AstroIntegration } from "astro";
import { getCloudinaryConfig } from "./config.js";
import { startWatching, type ChokidarModuleLike } from "./watcher.js";
import type { CloudinaryUploaderLike } from "./sync.js";

interface CloudinaryV2Like extends CloudinaryUploaderLike {
  config(options: { cloud_name: string; api_key: string; api_secret: string }): void;
}

// `createRequire` en vez de `import()`: `astro.config.mjs` (y todo lo que importa
// estáticamente, incluido este archivo) se evalúa a través del "module runner" transitorio
// de Vite, que intercepta cualquier `import()` dinámico y lo enruta a sí mismo — y ya está
// cerrado para cuando este hook async llega a ejecutarlo ("Vite module runner has been
// closed"). Un `require()` plano no es sintaxis de import/export, así que Vite no lo toca y
// cae directo al resolvedor de módulos de Node (que sí ve las devDependencies instaladas).
const require = createRequire(import.meta.url);

/**
 * Integración de Astro, activa solo durante `astro dev` (hook `astro:server:setup`,
 * nunca invocado en `astro build`): observa `cloudinary-images/` y sube a Cloudinary lo
 * nuevo/cambiado, cacheando por hash en `src/data/cloudinaryManifest.json` para minimizar
 * llamadas a la API. Ni `chokidar` ni `cloudinary` se importan de forma estática en ningún
 * archivo alcanzable desde `astro.config.mjs` — solo aquí, dentro del hook — así pueden
 * vivir en `devDependencies` sin que un build de producción necesite resolverlos.
 */
export default function cloudinarySync(): AstroIntegration {
  let stopWatching: (() => void) | undefined;

  return {
    name: "cloudinary-sync",
    hooks: {
      "astro:server:setup": async ({ logger }) => {
        let config: ReturnType<typeof getCloudinaryConfig>;
        try {
          config = getCloudinaryConfig();
        } catch (error) {
          logger.warn(
            `${(error as Error).message} El sitio sigue funcionando con las imágenes ya subidas (manifest commiteado); solo la sincronización de imágenes nuevas queda desactivada.`,
          );
          return;
        }

        const chokidarModule = require("chokidar");
        const cloudinaryModule = require("cloudinary");

        const chokidar = { watch: chokidarModule.watch } as unknown as ChokidarModuleLike;
        const cloudinaryV2 = cloudinaryModule.v2 as unknown as CloudinaryV2Like;
        cloudinaryV2.config(config);

        stopWatching = await startWatching({
          chokidar,
          cloudinary: cloudinaryV2,
          logger: {
            info: (message) => logger.info(message),
            warn: (message) => logger.warn(message),
            error: (message) => logger.error(message),
          },
        });
      },
      "astro:server:done": () => {
        stopWatching?.();
        stopWatching = undefined;
      },
    },
  };
}
