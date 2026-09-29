import { useEffect, useId, useMemo, useState } from "react";
import type { ImageAdjustments } from "../../../data/imageAdjustments";
import {
  ADJUSTMENT_CONTROLS,
  adjustmentsToPreviewFilter,
  applyCloudinaryTransformations,
  cleanAdjustments,
  type NumericAdjustment,
} from "../../../utils/imageAdjustments";

interface Props {
  imageKey: string;
  /** URL original del manifest (sin transformaciones). */
  imageUrl: string;
  initial: ImageAdjustments;
  onSaveDraft: (adjustments: ImageAdjustments) => Promise<void>;
  onPublish: (adjustments: ImageAdjustments) => Promise<void>;
  onClose: () => void;
}

type PreviewMode = "fast" | "real";
type Status = "idle" | "saving" | "publishing";

const PREVIEW_SIZE = "w_800,q_auto,f_auto";
/** Espera tras el último cambio antes de pedirle a Cloudinary la imagen real (cada combinación es una transformación nueva de la cuota). */
const REAL_PREVIEW_DEBOUNCE_MS = 600;

/** Fondo a cuadros para ver la transparencia de los retratos PNG. */
const CHECKERBOARD =
  "repeating-conic-gradient(rgb(128 128 128 / 0.18) 0% 25%, transparent 0% 50%) 50% / 20px 20px";

function sameAdjustments(a: ImageAdjustments, b: ImageAdjustments): boolean {
  return JSON.stringify(cleanAdjustments(a)) === JSON.stringify(cleanAdjustments(b));
}

/**
 * Editor de ajustes no destructivos de una imagen (092). Vista rápida = filtro SVG local
 * (instantáneo, aproximado); "Resultado real" = la URL que publicará el sitio, pedida a Cloudinary
 * con debounce. Ver .claude/spec/features/092-editor-ajustes-imagen/plan.md.
 */
export default function ImageAdjustEditor({ imageKey, imageUrl, initial, onSaveDraft, onPublish, onClose }: Props) {
  const filterId = `adjust-preview-${useId().replace(/:/g, "")}`;
  const [adjustments, setAdjustments] = useState<ImageAdjustments>(() => cleanAdjustments(initial));
  const [savedBaseline, setSavedBaseline] = useState<ImageAdjustments>(() => cleanAdjustments(initial));
  const [mode, setMode] = useState<PreviewMode>(initial.auto ? "real" : "fast");
  const [showOriginal, setShowOriginal] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string | null>(null);

  const realUrl = applyCloudinaryTransformations(imageUrl, adjustments, PREVIEW_SIZE);
  const originalUrl = applyCloudinaryTransformations(imageUrl, undefined, PREVIEW_SIZE);
  const [debouncedRealUrl, setDebouncedRealUrl] = useState(realUrl);
  // Estado de carga derivado del `src` que efectivamente terminó de cargar (o falló): si el `src`
  // no cambia, el `<img>` no vuelve a disparar `onLoad`, y un booleano quedaría colgado.
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  useEffect(() => {
    if (mode !== "real") return;
    const timer = setTimeout(() => setDebouncedRealUrl(realUrl), REAL_PREVIEW_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [mode, realUrl]);

  const filter = useMemo(() => adjustmentsToPreviewFilter(adjustments), [adjustments]);
  const dirty = !sameAdjustments(adjustments, savedBaseline);
  const busy = status !== "idle";

  function requestClose() {
    if (dirty && !confirm("Hay ajustes sin guardar. ¿Cerrar igual?")) return;
    onClose();
  }

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") requestClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  function setValue(key: NumericAdjustment, value: number) {
    setAdjustments((prev) => ({ ...prev, [key]: value }));
  }

  function toggleAuto() {
    setAdjustments((prev) => ({ ...prev, auto: !prev.auto }));
    // `e_improve` no se puede aproximar localmente: se ve solo en el resultado real.
    if (!adjustments.auto) setMode("real");
  }

  async function run(kind: "saving" | "publishing") {
    setStatus(kind);
    setMessage(null);
    try {
      const clean = cleanAdjustments(adjustments);
      await (kind === "saving" ? onSaveDraft(clean) : onPublish(clean));
      setSavedBaseline(clean);
      setMessage(kind === "saving" ? "Borrador guardado." : "Publicado.");
    } catch (err) {
      console.error(err);
      setMessage(`No se pudo ${kind === "saving" ? "guardar" : "publicar"}: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setStatus("idle");
    }
  }

  const previewSrc = showOriginal ? originalUrl : mode === "real" ? debouncedRealUrl : originalUrl;
  const applyLocalFilter = !showOriginal && mode === "fast";
  const realActive = mode === "real" && !showOriginal;
  const realError = realActive && failedSrc === previewSrc;
  const realLoading = realActive && !realError && (loadedSrc !== previewSrc || debouncedRealUrl !== realUrl);

  function selectMode(value: PreviewMode) {
    setMode(value);
    if (value === "real") setDebouncedRealUrl(realUrl);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-2 sm:p-6"
      onClick={(event) => {
        if (event.target === event.currentTarget) requestClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${filterId}-title`}
        className="flex max-h-full w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-surface text-ink shadow-2xl"
      >
        <header className="flex items-center gap-3 border-b border-ink-muted/20 px-4 py-3">
          <h2 id={`${filterId}-title`} className="min-w-0 flex-1 truncate font-display text-lg font-semibold">
            Ajustar <span className="font-body text-sm font-normal text-ink-muted">{imageKey}</span>
          </h2>
          <button type="button" onClick={requestClose} className="rounded-lg px-2 py-1 text-sm text-ink-muted hover:text-ink">
            Cerrar
          </button>
        </header>

        <div className="grid min-h-0 flex-1 overflow-y-auto md:grid-cols-[1fr_20rem]">
          <div className="flex flex-col gap-3 p-4">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <div className="flex rounded-lg bg-surface-muted p-0.5" role="group" aria-label="Tipo de vista previa">
                {(["fast", "real"] as const).map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => selectMode(value)}
                    aria-pressed={mode === value}
                    className={`rounded-md px-3 py-1 ${mode === value ? "bg-brand text-white" : "text-ink-muted"}`}
                  >
                    {value === "fast" ? "Vista rápida" : "Resultado real"}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onPointerDown={() => setShowOriginal(true)}
                onPointerUp={() => setShowOriginal(false)}
                onPointerLeave={() => setShowOriginal(false)}
                onKeyDown={(event) => {
                  if (event.key === " " || event.key === "Enter") setShowOriginal(true);
                }}
                onKeyUp={() => setShowOriginal(false)}
                className="rounded-lg bg-surface-muted px-3 py-1 text-ink-muted"
              >
                Mantener: original
              </button>
              {realLoading && <span className="text-ink-muted">Cargando de Cloudinary…</span>}
              {realError && (
                <span className="text-red-400">Cloudinary rechazó esta combinación.</span>
              )}
            </div>

            <div
              className="flex min-h-64 flex-1 items-center justify-center overflow-hidden rounded-xl"
              style={{ background: CHECKERBOARD }}
            >
              <img
                src={previewSrc}
                alt={`Vista previa de ${imageKey}`}
                onLoad={() => setLoadedSrc(previewSrc)}
                onError={() => setFailedSrc(previewSrc)}
                className="max-h-[60vh] w-auto max-w-full object-contain"
                style={applyLocalFilter ? { filter: `url(#${filterId})` } : undefined}
              />
            </div>
            <p className="text-xs text-ink-muted">
              {showOriginal
                ? "Original, sin ajustes."
                : mode === "fast"
                  ? "Vista rápida: aproximación local e instantánea (sin Auto ni Nitidez)."
                  : "Resultado real: exactamente la imagen que servirá el sitio."}
            </p>

            <svg width="0" height="0" className="absolute" aria-hidden="true">
              <filter id={filterId} colorInterpolationFilters="sRGB">
                <feColorMatrix type="matrix" values={filter.colorMatrix} />
                <feComponentTransfer>
                  <feFuncR type="gamma" amplitude="1" exponent={filter.gammaExponent} offset="0" />
                  <feFuncG type="gamma" amplitude="1" exponent={filter.gammaExponent} offset="0" />
                  <feFuncB type="gamma" amplitude="1" exponent={filter.gammaExponent} offset="0" />
                </feComponentTransfer>
                <feComponentTransfer>
                  <feFuncR type="linear" slope={filter.slope} intercept={filter.intercept} />
                  <feFuncG type="linear" slope={filter.slope} intercept={filter.intercept} />
                  <feFuncB type="linear" slope={filter.slope} intercept={filter.intercept} />
                </feComponentTransfer>
              </filter>
            </svg>
          </div>

          <div className="flex flex-col gap-4 border-t border-ink-muted/20 p-4 md:border-l md:border-t-0">
            {ADJUSTMENT_CONTROLS.map(({ key, label, min, max }) => {
              const value = adjustments[key] ?? 0;
              const inputId = `${filterId}-${key}`;
              return (
                <div key={key} className="space-y-1 text-sm">
                  <div className="flex items-center justify-between">
                    <label htmlFor={inputId}>{label}</label>
                    <button
                      type="button"
                      onClick={() => setValue(key, 0)}
                      disabled={value === 0}
                      title="Volver a 0"
                      className="tabular-nums text-ink-muted disabled:cursor-default enabled:hover:text-brand"
                    >
                      {value > 0 ? `+${value}` : value}
                    </button>
                  </div>
                  <input
                    id={inputId}
                    type="range"
                    min={min}
                    max={max}
                    step={1}
                    value={value}
                    onChange={(event) => setValue(key, Number(event.target.value))}
                    onDoubleClick={() => setValue(key, 0)}
                    className="w-full accent-[var(--color-brand)]"
                  />
                  {key === "temperature" && (
                    <div className="flex justify-between text-[10px] text-ink-muted">
                      <span>Frío</span>
                      <span>Cálido</span>
                    </div>
                  )}
                  {key === "tint" && (
                    <div className="flex justify-between text-[10px] text-ink-muted">
                      <span>Verde</span>
                      <span>Magenta</span>
                    </div>
                  )}
                </div>
              );
            })}

            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={!!adjustments.auto} onChange={toggleAuto} className="accent-[var(--color-brand)]" />
              Auto (Cloudinary decide)
            </label>

            <button
              type="button"
              onClick={() => setAdjustments({})}
              disabled={Object.keys(cleanAdjustments(adjustments)).length === 0}
              className="rounded-lg bg-surface-muted px-3 py-2 text-sm disabled:opacity-50"
            >
              Restablecer todo
            </button>

            <div className="mt-auto flex flex-col gap-2 border-t border-ink-muted/20 pt-4">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => run("saving")}
                  disabled={busy || !dirty}
                  className="flex-1 rounded-lg bg-brand/20 px-3 py-2 text-sm text-brand disabled:opacity-50"
                >
                  {status === "saving" ? "Guardando…" : "Guardar borrador"}
                </button>
                <button
                  type="button"
                  onClick={() => run("publishing")}
                  disabled={busy}
                  className="flex-1 rounded-lg bg-brand px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
                >
                  {status === "publishing" ? "Publicando…" : "Publicar"}
                </button>
              </div>
              {message && <p className="text-xs text-ink-muted">{message}</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
