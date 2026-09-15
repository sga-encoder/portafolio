import { load, dump } from "js-yaml";

// El editor visual (044) trabaja sobre {data, body} en vez del string crudo de Markdown que usan
// `drafts.ts`/`github.ts` (043, sin cambios) — este archivo es el único punto de conversión entre
// ambos formatos, para que guardar borrador/publicar siga escribiendo el mismo tipo de archivo de
// siempre. Ver 044-editor-visual-contenido-proyectos/plan.md.

export interface ParsedMarkdown {
  data: Record<string, unknown>;
  body: string;
}

const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/;

export function parseFrontmatter(raw: string): ParsedMarkdown {
  const match = FRONTMATTER_RE.exec(raw);
  if (!match) return { data: {}, body: raw };
  const data = (load(match[1]) as Record<string, unknown>) ?? {};
  return { data, body: match[2].replace(/^\n/, "") };
}

export function serializeFrontmatter({ data, body }: ParsedMarkdown): string {
  const yamlText = dump(data, { lineWidth: -1, noRefs: true });
  return `---\n${yamlText}---\n\n${body.trim()}\n`;
}
