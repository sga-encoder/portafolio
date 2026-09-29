import { parseFrontmatter, serializeFrontmatter } from "../frontmatter";

// Parser/serializador del `etapas.md` de cada proyecto gestionado (feature 087). El archivo vive en
// el repo DEL PROYECTO (`.claude/spec/etapas.md` por defecto), no en este repo — ver
// .claude/spec/features/087-gestor-proyectos-etapas/spec.md para el formato y las reglas de
// progreso. Es Markdown normal: se puede editar a mano en ese repo sin abrir el panel.

export interface SubEtapa {
  /** `N.M`. Si el archivo no lo trae escrito, se asigna por posición al parsear. */
  id: string;
  text: string;
  done: boolean;
}

export interface Etapa {
  /** `N`. */
  id: string;
  title: string;
  /** Líneas crudas entre el heading y la primera sub-etapa (descripciones, blockquotes). */
  notes: string[];
  subEtapas: SubEtapa[];
  /** Líneas crudas después de la última sub-etapa, antes del siguiente heading. */
  trailing: string[];
}

/** Vínculo manual commit → etapa/sub-etapa. Solo para commits SIN marcador en el mensaje. */
export interface CommitLink {
  sha: string;
  etapa: string;
}

export interface EtapasDoc {
  /** Resto del frontmatter, preservado tal cual (todo menos `commits`). */
  meta: Record<string, unknown>;
  links: CommitLink[];
  /** Líneas del cuerpo antes del primer `##` (normalmente `# Etapas`). */
  preamble: string[];
  etapas: Etapa[];
}

const HEADING_RE = /^##\s+(.*)$/;
const CHECKBOX_RE = /^\s*[-*]\s*\[([ xX])\]\s*(.*)$/;
const LEADING_ID_RE = /^(\d+(?:\.\d+)*)\s*(?:[·.\-—:)]\s*)?(.*)$/;

export const ETAPAS_TEMPLATE = `# Etapas

## 1 · Primera etapa

- [ ] 1.1 Primera sub-etapa
`;

/** Separa un id numérico al principio del texto (`2 · Mapa` → `["2", "Mapa"]`). */
function splitId(raw: string): { id: string | null; text: string } {
  const match = LEADING_ID_RE.exec(raw.trim());
  if (!match) return { id: null, text: raw.trim() };
  return { id: match[1], text: match[2].trim() };
}

export function parseEtapas(markdown: string): EtapasDoc {
  const { data, body } = parseFrontmatter(markdown);
  const { commits, ...meta } = data as { commits?: unknown } & Record<string, unknown>;

  const links: CommitLink[] = Array.isArray(commits)
    ? commits
        .map((item) => {
          const link = item && typeof item === "object" ? (item as Record<string, unknown>) : {};
          const sha = typeof link.sha === "string" ? link.sha : "";
          // `etapa` es el nombre en el archivo; se acepta `subEtapa` por si alguien lo escribió así.
          const target = typeof link.etapa === "string" ? link.etapa : typeof link.subEtapa === "string" ? link.subEtapa : "";
          return { sha: sha.trim(), etapa: target.trim() };
        })
        .filter((link) => link.sha && link.etapa)
    : [];

  const preamble: string[] = [];
  const etapas: Etapa[] = [];
  let current: Etapa | null = null;

  for (const line of body.split("\n")) {
    const heading = HEADING_RE.exec(line);
    if (heading) {
      const { id, text } = splitId(heading[1]);
      current = {
        id: id ?? String(etapas.length + 1),
        title: text || heading[1].trim(),
        notes: [],
        subEtapas: [],
        trailing: [],
      };
      etapas.push(current);
      continue;
    }

    if (!current) {
      preamble.push(line);
      continue;
    }

    const checkbox = CHECKBOX_RE.exec(line);
    if (checkbox) {
      const { id, text } = splitId(checkbox[2]);
      current.subEtapas.push({
        id: id ?? `${current.id}.${current.subEtapas.length + 1}`,
        text: text || checkbox[2].trim(),
        done: checkbox[1].toLowerCase() === "x",
      });
      continue;
    }

    // Una línea suelta después de las sub-etapas se conserva al final de la etapa; antes de la
    // primera, como nota del heading. Nunca se descarta contenido que el editor no modela.
    if (current.subEtapas.length === 0) current.notes.push(line);
    else current.trailing.push(line);
  }

  return { meta, links, preamble, etapas };
}

function trimBlankEdges(lines: string[]): string[] {
  const copy = [...lines];
  while (copy.length && !copy[0].trim()) copy.shift();
  while (copy.length && !copy[copy.length - 1].trim()) copy.pop();
  return copy;
}

export function serializeEtapas(doc: EtapasDoc): string {
  const blocks: string[] = [];

  const preamble = trimBlankEdges(doc.preamble);
  if (preamble.length) blocks.push(preamble.join("\n"));

  for (const etapa of doc.etapas) {
    const lines: string[] = [`## ${etapa.id} · ${etapa.title}`.trimEnd()];

    const notes = trimBlankEdges(etapa.notes);
    if (notes.length) lines.push("", ...notes);

    if (etapa.subEtapas.length) {
      lines.push("");
      for (const sub of etapa.subEtapas) {
        lines.push(`- [${sub.done ? "x" : " "}] ${sub.id} ${sub.text}`.trimEnd());
      }
    }

    const trailing = trimBlankEdges(etapa.trailing);
    if (trailing.length) lines.push("", ...trailing);

    blocks.push(lines.join("\n"));
  }

  const body = blocks.join("\n\n");
  const data: Record<string, unknown> = { ...doc.meta };
  if (doc.links.length) data.commits = doc.links.map((link) => ({ sha: link.sha, etapa: link.etapa }));

  // Un archivo escrito a mano puede no tener frontmatter: sin esto, `serializeFrontmatter` le
  // metería un `{}` de YAML vacío al guardar.
  if (Object.keys(data).length === 0) return `${body.trim()}\n`;

  return serializeFrontmatter({ data, body });
}

export interface Progress {
  done: number;
  total: number;
  /** `0` cuando no hay sub-etapas — nunca `NaN`. */
  percent: number;
}

export function progressOf(etapa: Etapa): Progress {
  const total = etapa.subEtapas.length;
  const done = etapa.subEtapas.filter((sub) => sub.done).length;
  return { done, total, percent: total ? Math.round((done / total) * 100) : 0 };
}

export interface DocProgress extends Progress {
  etapasCompletas: number;
  /** Etapas que cuentan para el progreso (las que tienen al menos una sub-etapa). */
  etapasConSubEtapas: number;
  etapasTotales: number;
}

/**
 * Progreso global = sub-etapas hechas / sub-etapas totales de TODO el archivo, no el promedio de
 * los porcentajes por etapa: así una etapa de 10 ítems pesa más que una de 2 (spec.md). Una etapa
 * sin sub-etapas no entra al denominador — no se le inventa un 0% ni un 100%.
 */
export function progressOfDoc(doc: EtapasDoc): DocProgress {
  let done = 0;
  let total = 0;
  let etapasCompletas = 0;
  let etapasConSubEtapas = 0;

  for (const etapa of doc.etapas) {
    const progress = progressOf(etapa);
    if (progress.total === 0) continue;
    etapasConSubEtapas += 1;
    done += progress.done;
    total += progress.total;
    if (progress.done === progress.total) etapasCompletas += 1;
  }

  return {
    done,
    total,
    percent: total ? Math.round((done / total) * 100) : 0,
    etapasCompletas,
    etapasConSubEtapas,
    etapasTotales: doc.etapas.length,
  };
}

/** Siguiente id libre de etapa (numérico, al final). */
export function nextEtapaId(doc: EtapasDoc): string {
  const ids = doc.etapas.map((etapa) => Number.parseInt(etapa.id, 10)).filter((id) => Number.isFinite(id));
  return String((ids.length ? Math.max(...ids) : 0) + 1);
}

export function nextSubEtapaId(etapa: Etapa): string {
  const ids = etapa.subEtapas
    .map((sub) => Number.parseInt(sub.id.split(".")[1] ?? "", 10))
    .filter((id) => Number.isFinite(id));
  return `${etapa.id}.${(ids.length ? Math.max(...ids) : 0) + 1}`;
}

/** Todos los destinos vinculables, en orden, para los `<select>` del panel. */
export function linkTargets(doc: EtapasDoc): { id: string; label: string }[] {
  const targets: { id: string; label: string }[] = [];
  for (const etapa of doc.etapas) {
    targets.push({ id: etapa.id, label: `${etapa.id} · ${etapa.title}` });
    for (const sub of etapa.subEtapas) {
      targets.push({ id: sub.id, label: `   ${sub.id} ${sub.text}` });
    }
  }
  return targets;
}
