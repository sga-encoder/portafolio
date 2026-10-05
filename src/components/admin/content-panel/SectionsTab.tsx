import { useEffect, useState } from "react";
import { loadJsonContent, publishJson, saveJsonDraft } from "../../../lib/admin/jsonContent";
import { profile as fallbackProfile, type ProfileData } from "../../../data/profile";
import SocialLinksEditor from "./SocialLinksEditor";

const DRAFT_ID = "home:profile";
const FILE_PATH = "src/data/profile.json";

type Status = "loading" | "idle" | "saving" | "publishing" | "error";

type DeadHeaderFields = { initials?: unknown; portraitFrames?: unknown; portraitIntervalSeconds?: unknown };
type DeadAboutFields = { portraitKey?: unknown };

/**
 * Descarta campos muertos que un borrador de Firestore o un `profile.json` viejo puede seguir
 * arrastrando (JSON.parse no respeta el tipo TS): `header.initials` (antes de `078`),
 * `header.portraitFrames`/`portraitIntervalSeconds` y `about.portraitKey` (retratos quitados en
 * `101`). Se aplica al cargar y al guardar/publicar para no reintroducirlos.
 */
function stripDeadFields(input: ProfileData): ProfileData {
  const {
    initials: _initials,
    portraitFrames: _portraitFrames,
    portraitIntervalSeconds: _portraitIntervalSeconds,
    ...header
  } = input.header as ProfileData["header"] & DeadHeaderFields;
  const { portraitKey: _portraitKey, ...about } = input.about as ProfileData["about"] & DeadAboutFields;
  return { ...input, header, about };
}

/**
 * Pestaña "Secciones" del panel de Contenido (064): edita los textos de Header y Sobre mí, que
 * viven en `src/data/profile.json`. Desde `101` Inicio no tiene fotos del autor, así que ya no
 * hay retratos que elegir.
 */
export default function SectionsTab() {
  const [data, setData] = useState<ProfileData | null>(null);
  const [sha, setSha] = useState<string | null>(null);
  const [isDraft, setIsDraft] = useState(false);
  const [status, setStatus] = useState<Status>("loading");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadJsonContent<ProfileData>(DRAFT_ID, FILE_PATH)
      .then((loaded) => {
        if (cancelled) return;
        setData(stripDeadFields(loaded.data));
        setSha(loaded.sha);
        setIsDraft(loaded.isDraft);
        setStatus("idle");
      })
      .catch((err) => {
        console.error(err);
        if (cancelled) return;
        // Sin archivo remoto todavía (primera vez): arranca desde el dato empaquetado al build.
        setData(fallbackProfile);
        setSha(null);
        setStatus("idle");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function update(patch: Partial<ProfileData>) {
    if (!data) return;
    setData({ ...data, ...patch });
  }

  /** Recorta renglones/enlaces vacíos antes de guardar — mismo criterio que `cleanFrontmatter` en `ContentEditor.tsx`. */
  function cleanProfile(input: ProfileData): ProfileData {
    const { header, about, ...rest } = stripDeadFields(input);
    const nameLines = header.nameLines.filter((line) => line.trim());
    return {
      ...rest,
      header: { ...header, nameLines: nameLines.length > 0 ? nameLines : [""] },
      about: { ...about, social: about.social.filter((link) => link.label.trim() && link.href.trim()) },
    };
  }

  async function handleSaveDraft() {
    if (!data) return;
    setStatus("saving");
    setMessage(null);
    try {
      await saveJsonDraft(DRAFT_ID, cleanProfile(data));
      setIsDraft(true);
      setStatus("idle");
      setMessage("Borrador guardado.");
    } catch (err) {
      console.error(err);
      setStatus("error");
      setMessage(`No se pudo guardar el borrador: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  async function handlePublish() {
    if (!data) return;
    setStatus("publishing");
    setMessage(null);
    try {
      setSha(await publishJson(DRAFT_ID, FILE_PATH, cleanProfile(data), sha));
      setIsDraft(false);
      setStatus("idle");
      setMessage("Publicado.");
    } catch (err) {
      console.error(err);
      setStatus("error");
      setMessage(`No se pudo publicar: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  const disabled = status === "loading" || status === "saving" || status === "publishing";

  if (status === "loading" || !data) {
    return <p className="text-ink-muted">Cargando…</p>;
  }

  return (
    <div className="flex flex-col gap-8">
      {isDraft && (
        <span className="w-fit rounded-full bg-brand/20 px-3 py-1 text-xs text-brand">Borrador sin publicar</span>
      )}

      <section className="flex flex-col gap-4 rounded-2xl bg-surface-muted p-4">
        <h2 className="font-display text-sm font-bold uppercase tracking-wide text-ink-muted">Header</h2>

        <div className="grid gap-3 sm:grid-cols-2">
          {[0, 1].map((lineIndex) => (
            <label key={lineIndex} className="flex flex-col gap-1 text-sm">
              <span className="text-ink-muted">Nombre — línea {lineIndex + 1}</span>
              <input
                type="text"
                value={data.header.nameLines[lineIndex] ?? ""}
                onChange={(event) => {
                  const nameLines = [data.header.nameLines[0] ?? "", data.header.nameLines[1] ?? ""];
                  nameLines[lineIndex] = event.target.value;
                  update({ header: { ...data.header, nameLines } });
                }}
                className="rounded-lg border border-ink-muted/30 bg-transparent px-3 py-2"
              />
            </label>
          ))}
        </div>

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-ink-muted">Tagline</span>
          <input
            type="text"
            value={data.header.tagline}
            onChange={(event) => update({ header: { ...data.header, tagline: event.target.value } })}
            className="rounded-lg border border-ink-muted/30 bg-transparent px-3 py-2"
          />
        </label>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-ink-muted">Botón primario — texto</span>
            <input
              type="text"
              value={data.header.primaryCta.label}
              onChange={(event) =>
                update({ header: { ...data.header, primaryCta: { ...data.header.primaryCta, label: event.target.value } } })
              }
              className="rounded-lg border border-ink-muted/30 bg-transparent px-3 py-2"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-ink-muted">Botón primario — enlace</span>
            <input
              type="text"
              value={data.header.primaryCta.href}
              onChange={(event) =>
                update({ header: { ...data.header, primaryCta: { ...data.header.primaryCta, href: event.target.value } } })
              }
              className="rounded-lg border border-ink-muted/30 bg-transparent px-3 py-2"
            />
          </label>
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={data.header.secondaryCta != null}
            onChange={(event) =>
              update({
                header: {
                  ...data.header,
                  secondaryCta: event.target.checked ? { label: "Blog", href: "/blog" } : undefined,
                },
              })
            }
          />
          Mostrar botón secundario
        </label>

        {data.header.secondaryCta && (
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-ink-muted">Botón secundario — texto</span>
              <input
                type="text"
                value={data.header.secondaryCta.label}
                onChange={(event) =>
                  update({
                    header: { ...data.header, secondaryCta: { ...data.header.secondaryCta!, label: event.target.value } },
                  })
                }
                className="rounded-lg border border-ink-muted/30 bg-transparent px-3 py-2"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-ink-muted">Botón secundario — enlace</span>
              <input
                type="text"
                value={data.header.secondaryCta.href}
                onChange={(event) =>
                  update({
                    header: { ...data.header, secondaryCta: { ...data.header.secondaryCta!, href: event.target.value } },
                  })
                }
                className="rounded-lg border border-ink-muted/30 bg-transparent px-3 py-2"
              />
            </label>
          </div>
        )}
      </section>

      <section className="flex flex-col gap-4 rounded-2xl bg-surface-muted p-4">
        <h2 className="font-display text-sm font-bold uppercase tracking-wide text-ink-muted">Sobre mí</h2>

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-ink-muted">Biografía</span>
          <textarea
            value={data.about.bio}
            onChange={(event) => update({ about: { ...data.about, bio: event.target.value } })}
            rows={6}
            className="rounded-lg border border-ink-muted/30 bg-transparent px-3 py-2"
          />
        </label>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-ink-muted">Estudios — institución</span>
            <input
              type="text"
              value={data.about.study.institution}
              onChange={(event) =>
                update({ about: { ...data.about, study: { ...data.about.study, institution: event.target.value } } })
              }
              className="rounded-lg border border-ink-muted/30 bg-transparent px-3 py-2"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-ink-muted">Estudios — período</span>
            <input
              type="text"
              value={data.about.study.period}
              onChange={(event) =>
                update({ about: { ...data.about, study: { ...data.about.study, period: event.target.value } } })
              }
              className="rounded-lg border border-ink-muted/30 bg-transparent px-3 py-2"
            />
          </label>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-sm text-ink-muted">Redes / contacto</span>
          <SocialLinksEditor
            value={data.about.social}
            onChange={(social) => update({ about: { ...data.about, social } })}
          />
        </div>
      </section>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSaveDraft}
          disabled={disabled}
          className="rounded-lg bg-surface-muted px-4 py-2 text-sm font-medium disabled:opacity-50"
        >
          {status === "saving" ? "Guardando…" : "Guardar borrador"}
        </button>
        <button
          type="button"
          onClick={handlePublish}
          disabled={disabled}
          className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {status === "publishing" ? "Publicando…" : "Publicar"}
        </button>
        {message && <span className="text-sm text-ink-muted">{message}</span>}
      </div>
    </div>
  );
}
