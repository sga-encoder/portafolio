import { getSecret } from "./secrets";

// Publicar Markdown/manifest desde el panel /admin (feature 043) vía la API
// de contenidos de GitHub — commits reales al repo, el contenido publicado
// sigue viviendo como archivos, no se mueve a una base de datos. Ver
// .claude/spec/features/043-panel-administrativo/plan.md.
//
// OWNER/REPO/BRANCH no son secretos (info pública del repo) — solo el token
// (`adminSecrets/github`) lo es.
const OWNER = "sga-encoder";
const REPO = "portafolio";
const BRANCH = "main";

interface GitHubSecret {
  token: string;
}

async function githubFetch(path: string, init?: RequestInit): Promise<Response> {
  const { token } = await getSecret<GitHubSecret>("github");
  const response = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      ...(init?.headers ?? {}),
    },
  });
  return response;
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
export async function getFile(path: string): Promise<GitHubFile | null> {
  const response = await githubFetch(`${path}?ref=${BRANCH}`);
  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`GitHub: no se pudo leer ${path} (${response.status})`);
  }
  const data = (await response.json()) as { content: string; sha: string };
  return { content: decodeBase64Utf8(data.content), sha: data.sha };
}

export async function putFile(path: string, content: string, message: string, sha?: string): Promise<void> {
  const response = await githubFetch(path, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
      content: encodeUtf8Base64(content),
      branch: BRANCH,
      ...(sha ? { sha } : {}),
    }),
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`GitHub: no se pudo escribir ${path} (${response.status}) — ${body}`);
  }
}
