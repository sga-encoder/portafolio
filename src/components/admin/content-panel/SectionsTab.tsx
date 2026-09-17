import { useEffect, useState } from "react";
import { loadJsonContent, publishJson, saveJsonDraft } from "../../../lib/admin/jsonContent";
import { getCloudinaryUrl } from "../../../utils/cloudinaryManifest";
import { profile as fallbackProfile, type ProfileData } from "../../../data/profile";
import SocialLinksEditor from "./SocialLinksEditor";
import HeaderPortraitFrameRow from "./HeaderPortraitFrameRow";

const DRAFT_ID = "home:profile";
const FILE_PATH = "src/data/profile.json";

type Status = "loading" | "idle" | "saving" | "publishing" | "error";

const PORTRAITS: { key: string; label: string }[] = [
  { key: "skills/persona02", label: "Retrato de Habilidades" },
  { key: "about/persona03", label: "Retrato de Sobre mí" },
];

function PortraitPreview({ imageKey, label }: { imageKey: string; label: string }) {
  let url: string | null = null;
  try {
    url = getCloudinaryUrl(imageKey, "w_160,q_auto,f_auto");
  } catch {
    url = null;
  }
  return (
    <div className="flex items-center gap-3 rounded-lg bg-surface-muted p-2">
      {url ? (
        <img src={url} alt={label} className="h-14 w-14 rounded-lg object-cover" />
      ) : (
        <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-surface text-xs text-ink-muted">
          Sin imagen
        </div>
      )}
      <div className="text-sm">
        <p>{label}</p>
        <a href="/admin/imagenes" className="text-brand hover:underline">
          Cambiar en Imágenes →
        </a>
      </div>
    </div>
  );
}

/**
 * Migra en memoria un borrador de Firestore guardado antes de `078` (forma vieja
 * `header.initials`, sin `portraitFrames`) — limitación conocida documentada en
 * `.claude/spec/features/078-header-retrato-rotativo/plan.md`: sin esto, cargar ese borrador
 * rompe el panel entero en vez de solo perder los datos de imagen del frame migrado.
 */
function normalizeHeader(input: ProfileData): ProfileData {
  const header = input.header as ProfileData["header"] & { initials?: string };
  if (Array.isArray(header.portraitFrames) && header.portraitFrames.length > 0) {
    return input;
  }
  return {
    ...input,
    header: {
      ...header,
      portraitFrames: [{ imageKey: "header/persona01", word: header.initials ?? "" }],
      portraitIntervalSeconds: header.portraitIntervalSeconds ?? 6,
    },
  };
}

/**
 * Pestaña "Secciones" del panel de Contenido (064): edita los textos de Header y Sobre mí que
 * viven en `src/data/profile.json`. Las imágenes/retratos ya se editan en `/admin/imagenes`
 * (`060`) — acá solo se muestra una miniatura + enlace directo, ver spec.md.
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
        setData(normalizeHeader(loaded.data));
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

  function moveFrame(index: number, delta: number) {
    if (!data) return;
    const frames = data.header.portraitFrames;
    const target = index + delta;
    if (target < 0 || target >= frames.length) return;
    const next = [...frames];
    [next[index], next[target]] = [next[target], next[index]];
    update({ header: { ...data.header, portraitFrames: next } });
  }

  /** Recorta renglones/enlaces vacíos antes de guardar — mismo criterio que `cleanFrontmatter` en `ContentEditor.tsx`. */
  function cleanProfile(input: ProfileData): ProfileData {
    const nameLines = input.header.nameLines.filter((line) => line.trim());
    // `initials` es un campo muerto de antes de `078` — un borrador/publish viejo puede seguir
    // arrastrándolo (JSON.parse no respeta el tipo TS); se descarta acá para no reintroducirlo.
    const { initials: _initials, ...header } = input.header as ProfileData["header"] & { initials?: string };
    return {
      ...input,
      header: { ...header, nameLines: nameLines.length > 0 ? nameLines : [""] },
      about: { ...input.about, social: input.about.social.filter((link) => link.label.trim() && link.href.trim()) },
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
      await publishJson(DRAFT_ID, FILE_PATH, cleanProfile(data), sha);
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

        <div className="flex flex-col gap-2">
          <span className="text-sm text-ink-muted">Retrato rotativo (imagen + palabra)</span>
          {data.header.portraitFrames.map((frame, index) => (
            <HeaderPortraitFrameRow
              key={index}
              frame={frame}
              onChange={(next) => {
                const portraitFrames = [...data.header.portraitFrames];
                portraitFrames[index] = next;
                update({ header: { ...data.header, portraitFrames } });
              }}
              onRemove={() => {
                const portraitFrames = data.header.portraitFrames.filter((_, i) => i !== index);
                update({ header: { ...data.header, portraitFrames } });
              }}
              onMoveUp={() => moveFrame(index, -1)}
              onMoveDown={() => moveFrame(index, 1)}
              canMoveUp={index > 0}
              canMoveDown={index < data.header.portraitFrames.length - 1}
              canRemove={data.header.portraitFrames.length > 1}
            />
          ))}
          <button
            type="button"
            onClick={() =>
              update({
                header: {
                  ...data.header,
                  portraitFrames: [...data.header.portraitFrames, { imageKey: "", word: "" }],
                },
              })
            }
            className="rounded-lg border-2 border-dashed border-ink-muted/30 px-2 py-1 text-xs text-ink-muted hover:border-ink-muted hover:text-ink"
          >
            + Agregar frame
          </button>

          <label className="flex flex-col gap-1 text-sm">
            <span className="text-ink-muted">Intervalo de rotación (segundos)</span>
            <input
              type="number"
              value={data.header.portraitIntervalSeconds}
              onChange={(event) =>
                update({ header: { ...data.header, portraitIntervalSeconds: Number(event.target.value) } })
              }
              className="w-32 rounded-lg border border-ink-muted/30 bg-transparent px-3 py-2"
            />
          </label>
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

      <section className="flex flex-col gap-3 rounded-2xl bg-surface-muted p-4">
        <h2 className="font-display text-sm font-bold uppercase tracking-wide text-ink-muted">Retratos</h2>
        {PORTRAITS.map((portrait) => (
          <PortraitPreview key={portrait.key} imageKey={portrait.key} label={portrait.label} />
        ))}
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
