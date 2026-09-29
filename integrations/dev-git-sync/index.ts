import { execFile } from "node:child_process";
import { fileURLToPath } from "node:url";
import type { IncomingMessage, ServerResponse } from "node:http";
import type { AstroIntegration, AstroIntegrationLogger } from "astro";

const ROUTE = "/__dev/git-sync";
const BRANCH = "main";
const FETCH_RETRIES = 3;
const RETRY_DELAY_MS = 1500;

interface SyncResult {
  ok: boolean;
  updated: boolean;
  message: string;
}

function git(cwd: string, args: string[]): Promise<{ ok: boolean; stdout: string; stderr: string }> {
  return new Promise((resolve) => {
    execFile("git", args, { cwd }, (error, stdout, stderr) => {
      resolve({ ok: !error, stdout: stdout.trim(), stderr: stderr.trim() });
    });
  });
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function sync(cwd: string, commit: string | undefined): Promise<SyncResult> {
  const head = await git(cwd, ["rev-parse", "--abbrev-ref", "HEAD"]);
  if (head.stdout !== BRANCH) {
    return { ok: false, updated: false, message: `la rama local es "${head.stdout}", no "${BRANCH}"; no se trae nada.` };
  }

  for (let attempt = 1; ; attempt++) {
    const fetched = await git(cwd, ["fetch", "--quiet", "origin", BRANCH]);
    if (!fetched.ok) return { ok: false, updated: false, message: `git fetch falló: ${fetched.stderr}` };
    if (!commit || (await git(cwd, ["cat-file", "-e", `${commit}^{commit}`])).ok) break;
    if (attempt >= FETCH_RETRIES) {
      return { ok: false, updated: false, message: `el commit ${commit.slice(0, 7)} todavía no aparece en origin/${BRANCH}.` };
    }
    await wait(RETRY_DELAY_MS);
  }

  const before = (await git(cwd, ["rev-parse", "HEAD"])).stdout;
  // Solo fast-forward: si la rama divergió o el merge tocaría un archivo con cambios locales sin
  // commitear, git se niega sin modificar nada — nunca se pisa trabajo local.
  const merged = await git(cwd, ["merge", "--ff-only", "--quiet", `origin/${BRANCH}`]);
  if (!merged.ok) {
    return {
      ok: false,
      updated: false,
      message: `no se pudo avanzar con fast-forward (haz \`git pull\` a mano): ${merged.stderr}`,
    };
  }
  const after = (await git(cwd, ["rev-parse", "HEAD"])).stdout;
  if (before === after) return { ok: true, updated: false, message: "ya estaba al día." };

  const files = (await git(cwd, ["diff", "--name-only", before, after])).stdout.split("\n").filter(Boolean);
  return { ok: true, updated: true, message: `${before.slice(0, 7)}..${after.slice(0, 7)} → ${files.join(", ")}` };
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => resolve(body));
    req.on("error", () => resolve(""));
  });
}

function send(res: ServerResponse, status: number, payload: unknown) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(payload));
}

/**
 * Integración solo de `astro dev` (090): el panel `/admin` escribe en GitHub, no en el disco, así
 * que después de cada commit al portafolio llama a `POST /__dev/git-sync` y acá se trae ese commit
 * a la copia local (`fetch` + `merge --ff-only`). El watcher de Vite hace el resto (HMR/recarga).
 * `astro:server:setup` nunca corre en `astro build`, así que nada de esto llega a producción.
 */
export default function devGitSync(): AstroIntegration {
  let root = process.cwd();

  return {
    name: "dev-git-sync",
    hooks: {
      "astro:config:done": ({ config }) => {
        root = fileURLToPath(config.root);
      },
      "astro:server:setup": ({ server, logger }) => {
        const log: AstroIntegrationLogger = logger;
        // Cola: varias publicaciones seguidas no corren dos `git` a la vez sobre el mismo repo.
        let queue: Promise<unknown> = Promise.resolve();

        server.middlewares.use(ROUTE, async (req, res) => {
          if (req.method !== "POST") return send(res, 405, { ok: false, message: "Solo POST." });

          // Anti-CSRF: cualquier web abierta en el navegador podría hacer POST a localhost.
          const origin = req.headers.origin;
          if (origin && new URL(origin).host !== req.headers.host) {
            return send(res, 403, { ok: false, message: "Origen no permitido." });
          }

          let commit: string | undefined;
          try {
            const parsed = JSON.parse((await readBody(req)) || "{}") as { commit?: unknown };
            if (typeof parsed.commit === "string" && /^[0-9a-f]{7,40}$/.test(parsed.commit)) commit = parsed.commit;
          } catch {
            // Body inválido: se sincroniza igual, sin esperar un commit concreto.
          }

          const task = queue.then(() => sync(root, commit));
          queue = task.catch(() => undefined);
          try {
            const result = await task;
            if (!result.ok) log.warn(`Panel → local: ${result.message}`);
            else if (result.updated) log.info(`Panel → local: ${result.message}`);
            send(res, 200, result);
          } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            log.error(`Panel → local: ${message}`);
            send(res, 500, { ok: false, updated: false, message });
          }
        });
      },
    },
  };
}
