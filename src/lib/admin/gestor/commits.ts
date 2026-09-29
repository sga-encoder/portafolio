import type { RepoCommit } from "../github";
import type { Etapa, EtapasDoc } from "./etapas";

// Vinculación commit → etapa/sub-etapa (feature 087). Dos vías que conviven, en este orden de
// precedencia: vínculo manual del frontmatter primero, marcador del mensaje después. Ese orden es
// deliberado — la corrección a mano existe justamente para arreglar un marcador mal puesto.
// Ver .claude/spec/features/087-gestor-proyectos-etapas/plan.md.

/** `[2]` o `[2.3]` en el asunto del commit, ej. `feat: cámara con zoom [2.2]`. */
const MARKER_RE = /\[(\d+(?:\.\d+)?)\]/;

export type LinkSource = "manual" | "marcador";

export interface LinkedCommit extends RepoCommit {
  /** Id de etapa/sub-etapa, o `null` si quedó sin vincular. */
  target: string | null;
  source: LinkSource | null;
  /** El vínculo apunta a un id que no existe en el archivo (typo en el mensaje del commit). */
  orphan: boolean;
}

export interface LinkedCommits {
  commits: LinkedCommit[];
  /** Id de etapa/sub-etapa → commits vinculados directamente a ese id. */
  byTarget: Map<string, LinkedCommit[]>;
  unlinked: LinkedCommit[];
  orphans: LinkedCommit[];
}

/** Los shas manuales se pueden escribir cortos (7 caracteres) — se compara por prefijo. */
function findManual(sha: string, doc: EtapasDoc): string | null {
  const link = doc.links.find((candidate) => {
    const short = candidate.sha.trim().toLowerCase();
    return short.length >= 4 && sha.toLowerCase().startsWith(short);
  });
  return link?.etapa ?? null;
}

function collectIds(doc: EtapasDoc): Set<string> {
  const ids = new Set<string>();
  for (const etapa of doc.etapas) {
    ids.add(etapa.id);
    for (const sub of etapa.subEtapas) ids.add(sub.id);
  }
  return ids;
}

export function linkCommits(commits: RepoCommit[], doc: EtapasDoc): LinkedCommits {
  const ids = collectIds(doc);
  const byTarget = new Map<string, LinkedCommit[]>();
  const unlinked: LinkedCommit[] = [];
  const orphans: LinkedCommit[] = [];

  const linked = commits.map((commit) => {
    const manual = findManual(commit.sha, doc);
    const marker = MARKER_RE.exec(commit.subject)?.[1] ?? null;
    const target = manual ?? marker;
    const source: LinkSource | null = manual ? "manual" : marker ? "marcador" : null;
    // Un marcador que apunta a algo inexistente no se descarta en silencio: se marca como huérfano
    // para que se note el typo en vez de perderse el commit.
    const orphan = target != null && !ids.has(target);

    const entry: LinkedCommit = { ...commit, target, source, orphan };

    if (!target) unlinked.push(entry);
    else if (orphan) orphans.push(entry);
    else {
      const list = byTarget.get(target);
      if (list) list.push(entry);
      else byTarget.set(target, [entry]);
    }

    return entry;
  });

  return { commits: linked, byTarget, unlinked, orphans };
}

/** Commits de una etapa: los suyos propios más los de todas sus sub-etapas. */
export function commitsForEtapa(linked: LinkedCommits, etapa: Etapa): LinkedCommit[] {
  const own = linked.byTarget.get(etapa.id) ?? [];
  const subs = etapa.subEtapas.flatMap((sub) => linked.byTarget.get(sub.id) ?? []);
  return [...own, ...subs];
}
