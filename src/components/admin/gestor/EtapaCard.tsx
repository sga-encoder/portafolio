import { useState } from "react";
import { progressOf, type Etapa, type SubEtapa } from "../../../lib/admin/gestor/etapas";
import type { LinkedCommit } from "../../../lib/admin/gestor/commits";
import ProgressBar from "./ProgressBar";

interface Props {
  etapa: Etapa;
  /** Commits de la etapa + los de sus sub-etapas (`commitsForEtapa`). */
  commits: LinkedCommit[];
  commitsOf: (id: string) => LinkedCommit[];
  onChangeTitle: (title: string) => void;
  onToggleSub: (index: number) => void;
  onChangeSub: (index: number, patch: Partial<SubEtapa>) => void;
  onDeleteSub: (index: number) => void;
  onAddSub: () => void;
  onDelete: () => void;
  onMove: (delta: number) => void;
}

function CommitChip({ commit }: { commit: LinkedCommit }) {
  return (
    <a
      href={commit.url}
      target="_blank"
      rel="noreferrer"
      title={commit.subject}
      className="inline-flex max-w-full items-center gap-1 rounded-full bg-surface px-2 py-0.5 text-[11px] text-ink-muted hover:text-brand"
    >
      <code>{commit.shortSha}</code>
      <span className="truncate">{commit.subject}</span>
    </a>
  );
}

/** Una etapa del `etapas.md` con sus sub-etapas editables y los commits vinculados (087). */
export default function EtapaCard({
  etapa,
  commits,
  commitsOf,
  onChangeTitle,
  onToggleSub,
  onChangeSub,
  onDeleteSub,
  onAddSub,
  onDelete,
  onMove,
}: Props) {
  const [showCommits, setShowCommits] = useState(false);
  const progress = progressOf(etapa);

  return (
    <div className="rounded-xl border border-ink-muted/20 bg-surface-muted/40 p-4">
      <div className="mb-2 flex items-center gap-2">
        <span className="font-display text-sm font-bold text-brand">{etapa.id}</span>
        <input
          type="text"
          value={etapa.title}
          onChange={(event) => onChangeTitle(event.target.value)}
          aria-label={`Título de la etapa ${etapa.id}`}
          className="min-w-0 flex-1 rounded-lg border border-transparent bg-transparent px-2 py-1 font-display text-base font-bold hover:border-ink-muted/30 focus:border-ink-muted/30 focus:outline-none"
        />
        <button type="button" onClick={() => onMove(-1)} aria-label="Subir etapa" className="px-1 text-ink-muted hover:text-brand">
          ↑
        </button>
        <button type="button" onClick={() => onMove(1)} aria-label="Bajar etapa" className="px-1 text-ink-muted hover:text-brand">
          ↓
        </button>
        <button type="button" onClick={onDelete} aria-label="Borrar etapa" className="px-1 text-ink-muted hover:text-red-500">
          ✕
        </button>
      </div>

      <div className="mb-3 flex items-center gap-3">
        <ProgressBar percent={progress.percent} />
        <span className="shrink-0 text-xs text-ink-muted">
          {progress.total ? `${progress.done}/${progress.total}` : "sin sub-etapas"}
        </span>
      </div>

      <ul className="space-y-1">
        {etapa.subEtapas.map((sub, index) => {
          const subCommits = commitsOf(sub.id);
          return (
            <li key={`${sub.id}-${index}`} className="flex flex-wrap items-center gap-2">
              <input
                type="checkbox"
                checked={sub.done}
                onChange={() => onToggleSub(index)}
                aria-label={`Sub-etapa ${sub.id} completada`}
                className="h-4 w-4 shrink-0 accent-[var(--color-brand)]"
              />
              <span className="shrink-0 text-xs text-ink-muted">{sub.id}</span>
              <input
                type="text"
                value={sub.text}
                onChange={(event) => onChangeSub(index, { text: event.target.value })}
                aria-label={`Texto de la sub-etapa ${sub.id}`}
                className={`min-w-0 flex-1 rounded-lg border border-transparent bg-transparent px-2 py-1 text-sm hover:border-ink-muted/30 focus:border-ink-muted/30 focus:outline-none ${
                  sub.done ? "text-ink-muted line-through" : ""
                }`}
              />
              {subCommits.length > 0 && (
                <span className="shrink-0 rounded-full bg-surface px-2 py-0.5 text-[11px] text-ink-muted">
                  {subCommits.length} commit{subCommits.length === 1 ? "" : "s"}
                </span>
              )}
              <button
                type="button"
                onClick={() => onDeleteSub(index)}
                aria-label={`Borrar sub-etapa ${sub.id}`}
                className="shrink-0 px-1 text-ink-muted hover:text-red-500"
              >
                ✕
              </button>
            </li>
          );
        })}
      </ul>

      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
        <button type="button" onClick={onAddSub} className="rounded-lg bg-surface-muted px-3 py-1.5 font-medium hover:text-brand">
          + Sub-etapa
        </button>
        {commits.length > 0 && (
          <button type="button" onClick={() => setShowCommits((value) => !value)} className="text-ink-muted hover:text-brand">
            {commits.length} commit{commits.length === 1 ? "" : "s"} vinculado{commits.length === 1 ? "" : "s"}{" "}
            {showCommits ? "▴" : "▾"}
          </button>
        )}
      </div>

      {showCommits && commits.length > 0 && (
        <ul className="mt-2 space-y-1">
          {commits.map((commit) => (
            <li key={commit.sha} className="flex">
              <CommitChip commit={commit} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
