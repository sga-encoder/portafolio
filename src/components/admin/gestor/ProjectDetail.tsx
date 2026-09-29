import { useEffect, useMemo, useRef, useState } from "react";
import { listCommits, type RepoCommit, type RepoRef } from "../../../lib/admin/github";
import {
  ETAPAS_TEMPLATE,
  linkTargets,
  nextEtapaId,
  nextSubEtapaId,
  parseEtapas,
  progressOfDoc,
  serializeEtapas,
  type Etapa,
  type EtapasDoc,
  type SubEtapa,
} from "../../../lib/admin/gestor/etapas";
import { loadEtapas, publishEtapas, saveEtapasDraft } from "../../../lib/admin/gestor/etapasStore";
import { commitsForEtapa, linkCommits } from "../../../lib/admin/gestor/commits";
import { etapasPathOf, type ManagedProject } from "../../../lib/admin/gestor/registry";
import CommitsList from "./CommitsList";
import EtapaCard from "./EtapaCard";
import ProgressBar from "./ProgressBar";

interface Props {
  project: ManagedProject;
  isPublished: boolean;
  onBack: () => void;
}

type Status = "loading" | "idle" | "saving" | "publishing" | "error";

const EMPTY_DOC: EtapasDoc = { meta: {}, links: [], preamble: [], etapas: [] };
const AUTOSAVE_MS = 1200;

/**
 * Detalle de un proyecto gestionado (087): etapas/sub-etapas editables, progreso recalculado en
 * vivo y commits del repo vinculados. Autoguardado en Firestore (`adminDrafts/gestor:<id>`) con el
 * mismo debounce que el editor de proyectos; "Publicar" hace el commit real al repo DEL PROYECTO.
 */
export default function ProjectDetail({ project, isPublished, onBack }: Props) {
  const [doc, setDoc] = useState<EtapasDoc | null>(null);
  const [sha, setSha] = useState<string | null>(null);
  const [repoRef, setRepoRef] = useState<RepoRef | null>(null);
  const [exists, setExists] = useState(false);
  const [isDraft, setIsDraft] = useState(false);
  const [status, setStatus] = useState<Status>("loading");
  const [message, setMessage] = useState<string | null>(null);

  const [rawMode, setRawMode] = useState(false);
  const [rawText, setRawText] = useState("");

  const [commits, setCommits] = useState<RepoCommit[]>([]);
  const [commitsLoading, setCommitsLoading] = useState(true);
  const [commitsError, setCommitsError] = useState<string | null>(null);

  const [dirty, setDirty] = useState(false);
  // Evita que el autoguardado dispare con el contenido recién traído de GitHub.
  const loadedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    loadedRef.current = false;

    loadEtapas(project)
      .then((loaded) => {
        if (cancelled) return;
        setRepoRef(loaded.ref);
        setSha(loaded.sha);
        setExists(loaded.exists);
        setIsDraft(loaded.isDraft);
        setDoc(loaded.content.trim() ? parseEtapas(loaded.content) : null);
        setStatus("idle");
        loadedRef.current = true;

        setCommitsLoading(true);
        return listCommits(loaded.ref, 50)
          .then((list) => {
            if (!cancelled) setCommits(list);
          })
          .catch((err: unknown) => {
            if (!cancelled) setCommitsError(err instanceof Error ? err.message : String(err));
          })
          .finally(() => {
            if (!cancelled) setCommitsLoading(false);
          });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setStatus("error");
        setMessage(err instanceof Error ? err.message : String(err));
        setCommitsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [project.id]);

  function currentContent(): string {
    if (rawMode) return rawText;
    return doc ? serializeEtapas(doc) : "";
  }

  // Autoguardado del borrador — no toca el repo del proyecto.
  useEffect(() => {
    if (!dirty || !loadedRef.current) return;
    const content = currentContent();
    const timer = setTimeout(() => {
      saveEtapasDraft(project, content)
        .then(() => {
          setIsDraft(true);
          setDirty(false);
          setMessage("Borrador guardado.");
        })
        .catch((err: unknown) => {
          setMessage(`No se pudo guardar el borrador: ${err instanceof Error ? err.message : String(err)}`);
        });
    }, AUTOSAVE_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dirty, doc, rawText]);

  function updateDoc(mutate: (current: EtapasDoc) => EtapasDoc) {
    setDoc((current) => (current ? mutate(current) : current));
    setDirty(true);
    setMessage(null);
  }

  function updateEtapa(index: number, mutate: (etapa: Etapa) => Etapa) {
    updateDoc((current) => ({
      ...current,
      etapas: current.etapas.map((etapa, i) => (i === index ? mutate(etapa) : etapa)),
    }));
  }

  function handleCreateFile() {
    setDoc(parseEtapas(ETAPAS_TEMPLATE));
    setDirty(true);
    setMessage('Plantilla creada — publicá para crear el archivo en el repo.');
  }

  function handleAddEtapa() {
    setDoc((current) => {
      const base = current ?? EMPTY_DOC;
      return {
        ...base,
        etapas: [...base.etapas, { id: nextEtapaId(base), title: "Nueva etapa", notes: [], subEtapas: [], trailing: [] }],
      };
    });
    setDirty(true);
  }

  function handleToggleRaw() {
    if (rawMode) {
      try {
        setDoc(parseEtapas(rawText));
        setRawMode(false);
        setMessage(null);
      } catch (err) {
        setMessage(`El Markdown no se pudo interpretar: ${err instanceof Error ? err.message : String(err)}`);
      }
      return;
    }
    setRawText(currentContent());
    setRawMode(true);
  }

  async function handlePublish() {
    if (!repoRef) return;
    setStatus("publishing");
    setMessage(null);
    try {
      let content = currentContent();
      if (!rawMode && doc) {
        // Se sellan al publicar, no en cada tecla, para no ensuciar el borrador con metadatos.
        const stamped: EtapasDoc = {
          ...doc,
          meta: { ...doc.meta, proyecto: doc.meta.proyecto ?? project.id, actualizado: new Date().toISOString().slice(0, 10) },
        };
        content = serializeEtapas(stamped);
        setDoc(stamped);
      }
      const newSha = await publishEtapas(project, content, sha, repoRef);
      setSha(newSha);
      setExists(true);
      setIsDraft(false);
      setDirty(false);
      setStatus("idle");
      setMessage("Publicado en el repo del proyecto.");
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : String(err));
    }
  }

  const linked = useMemo(() => linkCommits(commits, doc ?? EMPTY_DOC), [commits, doc]);
  const targets = useMemo(() => (doc ? linkTargets(doc) : []), [doc]);
  const progress = useMemo(() => (doc ? progressOfDoc(doc) : null), [doc]);

  const busy = status === "loading" || status === "publishing";

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <button type="button" onClick={onBack} className="mb-1 text-xs text-ink-muted hover:text-brand">
            ← Todos los proyectos
          </button>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-display text-2xl font-bold">{project.title}</h1>
            {isDraft && <span className="rounded-full bg-brand/20 px-3 py-1 text-xs text-brand">Borrador sin publicar</span>}
            {!isPublished && (
              <span className="rounded-full bg-ink-muted/15 px-3 py-1 text-xs text-ink-muted">Sin página pública</span>
            )}
          </div>
          <p className="text-xs text-ink-muted">
            <a href={`https://github.com/${project.repo}`} target="_blank" rel="noreferrer" className="hover:text-brand">
              {project.repo}
            </a>
            {repoRef && <> · rama <code>{repoRef.branch}</code></>} · <code>{etapasPathOf(project)}</code>
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={handleToggleRaw}
            disabled={busy || (!doc && !rawMode)}
            className="rounded-lg bg-surface-muted px-3 py-2 text-sm font-medium disabled:opacity-50"
          >
            {rawMode ? "Editor de etapas" : "Markdown crudo"}
          </button>
          <button
            type="button"
            onClick={handlePublish}
            disabled={busy || (!doc && !rawMode)}
            className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {status === "publishing" ? "Publicando…" : "Publicar"}
          </button>
        </div>
      </div>

      {message && <p className="mb-4 text-sm text-ink-muted">{message}</p>}
      {status === "loading" && <p className="text-ink-muted">Cargando…</p>}

      {status !== "loading" && !doc && !rawMode && (
        <div className="rounded-xl border border-ink-muted/20 bg-surface-muted/40 p-6 text-center">
          <p className="mb-3 text-sm text-ink-muted">
            {exists
              ? "El archivo existe pero está vacío."
              : `Este repo todavía no tiene ${etapasPathOf(project)}.`}
          </p>
          <button type="button" onClick={handleCreateFile} className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white">
            Crear etapas.md
          </button>
        </div>
      )}

      {rawMode && (
        <textarea
          value={rawText}
          onChange={(event) => {
            setRawText(event.target.value);
            setDirty(true);
          }}
          spellCheck={false}
          className="h-[60vh] w-full rounded-xl border border-ink-muted/30 bg-surface p-4 font-mono text-sm"
        />
      )}

      {!rawMode && doc && (
        <>
          {progress && (
            <div className="mb-6 rounded-xl border border-ink-muted/20 bg-surface-muted/40 p-4">
              <div className="mb-2 flex items-baseline justify-between gap-3">
                <span className="font-display text-3xl font-bold text-brand">{progress.percent}%</span>
                <span className="text-xs text-ink-muted">
                  {progress.done}/{progress.total} sub-etapas · {progress.etapasCompletas}/{progress.etapasConSubEtapas}{" "}
                  etapas completas
                  {progress.etapasTotales > progress.etapasConSubEtapas &&
                    ` · ${progress.etapasTotales - progress.etapasConSubEtapas} sin sub-etapas`}
                </span>
              </div>
              <ProgressBar percent={progress.percent} size="md" />
            </div>
          )}

          <div className="space-y-3">
            {doc.etapas.map((etapa, index) => (
              <EtapaCard
                key={`${etapa.id}-${index}`}
                etapa={etapa}
                commits={commitsForEtapa(linked, etapa)}
                commitsOf={(id) => linked.byTarget.get(id) ?? []}
                onChangeTitle={(title) => updateEtapa(index, (current) => ({ ...current, title }))}
                onToggleSub={(subIndex) =>
                  updateEtapa(index, (current) => ({
                    ...current,
                    subEtapas: current.subEtapas.map((sub, i) => (i === subIndex ? { ...sub, done: !sub.done } : sub)),
                  }))
                }
                onChangeSub={(subIndex, patch: Partial<SubEtapa>) =>
                  updateEtapa(index, (current) => ({
                    ...current,
                    subEtapas: current.subEtapas.map((sub, i) => (i === subIndex ? { ...sub, ...patch } : sub)),
                  }))
                }
                onDeleteSub={(subIndex) =>
                  updateEtapa(index, (current) => ({
                    ...current,
                    subEtapas: current.subEtapas.filter((_, i) => i !== subIndex),
                  }))
                }
                onAddSub={() =>
                  updateEtapa(index, (current) => ({
                    ...current,
                    subEtapas: [...current.subEtapas, { id: nextSubEtapaId(current), text: "Nueva sub-etapa", done: false }],
                  }))
                }
                onDelete={() => {
                  if (!window.confirm(`¿Borrar la etapa "${etapa.title}" y sus sub-etapas?`)) return;
                  updateDoc((current) => ({ ...current, etapas: current.etapas.filter((_, i) => i !== index) }));
                }}
                onMove={(delta) =>
                  updateDoc((current) => {
                    const target = index + delta;
                    if (target < 0 || target >= current.etapas.length) return current;
                    const etapas = [...current.etapas];
                    [etapas[index], etapas[target]] = [etapas[target], etapas[index]];
                    return { ...current, etapas };
                  })
                }
              />
            ))}
          </div>

          <button
            type="button"
            onClick={handleAddEtapa}
            className="mt-3 rounded-lg bg-surface-muted px-4 py-2 text-sm font-medium hover:text-brand"
          >
            + Etapa
          </button>

          <section className="mt-8">
            <h2 className="mb-1 font-display text-lg font-bold">Commits</h2>
            <p className="mb-3 text-xs text-ink-muted">
              Se vinculan solos si el mensaje incluye <code>[2]</code> o <code>[2.3]</code>. Los demás se asignan a mano
              acá — el vínculo manual gana sobre el marcador y se guarda en el propio archivo de etapas.
            </p>
            <CommitsList
              linked={linked}
              targets={targets}
              loading={commitsLoading}
              error={commitsError}
              onAssign={(commitSha, target) =>
                updateDoc((current) => ({
                  ...current,
                  links: [
                    ...current.links.filter((link) => !commitSha.toLowerCase().startsWith(link.sha.toLowerCase())),
                    { sha: commitSha.slice(0, 7), etapa: target },
                  ],
                }))
              }
              onClear={(commitSha) =>
                updateDoc((current) => ({
                  ...current,
                  links: current.links.filter((link) => !commitSha.toLowerCase().startsWith(link.sha.toLowerCase())),
                }))
              }
            />
          </section>
        </>
      )}
    </>
  );
}
