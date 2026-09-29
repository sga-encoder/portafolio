import { getSecret } from "./secrets";

// Publicar Markdown/manifest desde el panel /admin (feature 043) vía la API
// de contenidos de GitHub — commits reales al repo, el contenido publicado
// sigue viviendo como archivos, no se mueve a una base de datos. Ver
// .claude/spec/features/043-panel-administrativo/plan.md.
//
// 087 (gestor de proyectos) generaliza esto a repos ajenos: el `etapas.md` de
// cada proyecto vive en SU propio repositorio, así que cada operación recibe un
// `RepoRef` opcional. El default es `SELF` (este repo), por lo que ninguna de
// las llamadas anteriores a 087 cambia — ver
// .claude/spec/features/087-gestor-proyectos-etapas/plan.md.
//
// El repo/rama no son secretos (info pública) — solo el token
// (`adminSecrets/github`) lo es. Desde 087 ese token necesita alcance sobre los
// repos de los proyectos gestionados, no solo sobre el portafolio.

export interface RepoRef {
  /** `owner/repo`, ej. `sga-encoder/city-builder`. */
  repo: string;
  branch: string;
}

export const SELF: RepoRef = { repo: "sga-encoder/portafolio", branch: "main" };

interface GitHubSecret {
  token: string;
}

async function githubFetch(repo: string, path: string, init?: RequestInit): Promise<Response> {
  const { token } = await getSecret<GitHubSecret>("github");
  // Sin `path` (metadatos del repo) la URL no lleva barra final: GitHub responde 404 con ella.
  const url = path ? `https://api.github.com/repos/${repo}/${path}` : `https://api.github.com/repos/${repo}`;
  const response = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      ...(init?.headers ?? {}),
    },
  });
  return response;
}

/**
 * Con varios repos en juego (087), un "no se pudo leer X (404)" a secas es inútil: casi siempre es
 * el alcance del token, no el archivo. Traduce los 3 casos reales a algo accionable.
 */
export function githubError(response: Response, repo: string, what: string): Error {
  if (response.status === 401) {
    return new Error(`GitHub: el token de adminSecrets/github no es válido o expiró (401) — ${what} en ${repo}.`);
  }
  if (response.status === 403) {
    if (response.headers.get("x-ratelimit-remaining") === "0") {
      return new Error(`GitHub: límite de tasa alcanzado (403) — ${what} en ${repo}. Reintentá en unos minutos.`);
    }
    return new Error(
      `GitHub: el token no tiene permiso sobre ${repo} (403) — ${what}. Dale alcance a ese repo (Contents: Read and write).`,
    );
  }
  if (response.status === 404) {
    return new Error(
      `GitHub: no se encontró ${repo} o el token no lo alcanza (404) — ${what}. Revisá el nombre del repo y el alcance del token.`,
    );
  }
  return new Error(`GitHub: ${what} falló en ${repo} (${response.status}).`);
}

function decodeBase64Utf8(base64: string): string {
  const binary = atob(base64.replace(/\n/g, ""));
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder("utf-8").decode(bytes);
}

function encodeUtf8Base64(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

export interface GitHubFile {
  content: string;
  sha: string;
}

/** Devuelve `null` si el archivo no existe todavía (creación desde el panel). */
export async function getFile(path: string, ref: RepoRef = SELF): Promise<GitHubFile | null> {
  // `no-store`: la API de GitHub responde `Cache-Control: max-age=60` y el navegador la reusaría —
  // tras un commit, recargar el panel traía el archivo (y su sha) de hasta 60 s antes, y el
  // siguiente `putFile` fallaba con 409 (verificado con curl).
  const response = await githubFetch(ref.repo, `contents/${path}?ref=${ref.branch}`, { cache: "no-store" });
  // 404 acá es ambiguo (archivo inexistente vs. repo/token) — para el repo propio siempre fue
  // "todavía no existe" y se mantiene así; para un repo ajeno lo distingue quien llama
  // (`getDefaultBranch` falla antes si el repo no es alcanzable).
  if (response.status === 404) return null;
  if (!response.ok) {
    throw githubError(response, ref.repo, `leer ${path}`);
  }
  const data = (await response.json()) as { content: string; sha: string };
  return { content: decodeBase64Utf8(data.content), sha: data.sha };
}

/** `putFile` falló porque el sha enviado ya no es el actual (otro commit llegó antes). */
export function isShaConflict(error: unknown): boolean {
  const status = (error as { status?: unknown } | null)?.status;
  return status === 409 || status === 422;
}

/** Devuelve el sha nuevo del archivo — publicar dos veces seguidas con el sha viejo da 409. */
export async function putFile(
  path: string,
  content: string,
  message: string,
  sha?: string,
  ref: RepoRef = SELF,
): Promise<string | null> {
  const response = await githubFetch(ref.repo, `contents/${path}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
      content: encodeUtf8Base64(content),
      branch: ref.branch,
      ...(sha ? { sha } : {}),
    }),
  });
  if (!response.ok) {
    const body = await response.text();
    const error = new Error(`${githubError(response, ref.repo, `escribir ${path}`).message} — ${body}`);
    // El status viaja en el error para que quien llama distinga un conflicto de sha (409/422) —
    // reintentable sobre el archivo fresco — de un error de token/permisos.
    throw Object.assign(error, { status: response.status });
  }
  const data = (await response.json()) as { content?: { sha?: string }; commit?: { sha?: string } };
  if (import.meta.env.DEV && ref.repo === SELF.repo && ref.branch === SELF.branch) {
    syncLocalCopy(data.commit?.sha);
  }
  return data.content?.sha ?? null;
}

/**
 * Solo en `astro dev` (090): pide al servidor local que traiga el commit recién hecho, para que la
 * vista pública local refleje lo publicado sin `git pull` a mano. No se espera — un fallo acá
 * nunca rompe la publicación, que ya quedó hecha en GitHub.
 */
function syncLocalCopy(commit: string | undefined) {
  fetch("/__dev/git-sync", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ commit }),
  })
    .then((response) => response.json() as Promise<{ ok: boolean; message: string }>)
    .then((result) => {
      if (!result.ok) console.warn(`[dev-git-sync] ${result.message}`);
    })
    .catch((error: unknown) => console.warn("[dev-git-sync] no se pudo sincronizar la copia local.", error));
}

export interface RepoCommit {
  sha: string;
  shortSha: string;
  /** Primera línea del mensaje — el cuerpo no se usa en el panel. */
  subject: string;
  date: string;
  author: string;
  url: string;
}

/** Últimos commits de una rama (087) — para vincularlos a etapas/sub-etapas. */
export async function listCommits(ref: RepoRef, perPage = 50): Promise<RepoCommit[]> {
  const response = await githubFetch(ref.repo, `commits?sha=${encodeURIComponent(ref.branch)}&per_page=${perPage}`);
  if (!response.ok) {
    throw githubError(response, ref.repo, "listar commits");
  }
  const data = (await response.json()) as {
    sha: string;
    html_url: string;
    commit: { message: string; author: { name?: string; date?: string } | null };
    author: { login?: string } | null;
  }[];
  return data.map((item) => ({
    sha: item.sha,
    shortSha: item.sha.slice(0, 7),
    subject: item.commit.message.split("\n")[0],
    date: item.commit.author?.date ?? "",
    author: item.author?.login ?? item.commit.author?.name ?? "",
    url: item.html_url,
  }));
}

// Los repos viejos del autor pueden estar en `master` — asumir `main` daría un 404 sin explicación.
const defaultBranchCache = new Map<string, string>();

export async function getDefaultBranch(repo: string): Promise<string> {
  const cached = defaultBranchCache.get(repo);
  if (cached) return cached;

  const response = await githubFetch(repo, "");
  if (!response.ok) {
    throw githubError(response, repo, "leer los datos del repositorio");
  }
  const data = (await response.json()) as { default_branch: string };
  defaultBranchCache.set(repo, data.default_branch);
  return data.default_branch;
}

/** `branch` fijado en el registro gana; si no, la rama por defecto real del repo. */
export async function resolveRef(repo: string, branch?: string): Promise<RepoRef> {
  return { repo, branch: branch ?? (await getDefaultBranch(repo)) };
}
