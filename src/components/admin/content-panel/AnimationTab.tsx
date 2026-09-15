import { useEffect, useState } from "react";
import { loadJsonContent, publishJson, saveJsonDraft } from "../../../lib/admin/jsonContent";
import { sceneStops as fallbackSceneStops, SECTION_IDS, SPHERE_IDS, type SectionId, type SphereId } from "../../scene/sceneStops";
import { DEFAULT_COLLISION_MARGIN, type SphereStop, type ZoneStop } from "../../scene/engine/zoneStops";
import SpherePoseEditor from "./SpherePoseEditor";
import SceneSchemaPreview from "./SceneSchemaPreview";

const DRAFT_ID = "home:scene";
const FILE_PATH = "src/components/scene/sceneStops.json";

type Status = "loading" | "idle" | "saving" | "publishing" | "error";

const SECTION_LABELS: Record<SectionId, string> = {
  header: "Encabezado",
  habilidades: "Habilidades",
  proyectos: "Proyectos",
  "sobre-mi": "Sobre mí",
};

const SPHERE_LABELS: Record<SphereId, string> = { a: "Esfera A", b: "Esfera B", c: "Esfera C" };

/**
 * Pestaña "Animación 3D" del panel de Contenido (067): edita `sceneStops.json` — posición/
 * tamaño/color de llegada (y opcionalmente partida) de las 3 esferas del fondo Three.js de
 * Inicio, por sección, más el `collisionMargin` de cada sección.
 */
export default function AnimationTab() {
  const [data, setData] = useState<ZoneStop<SphereId>[] | null>(null);
  const [sha, setSha] = useState<string | null>(null);
  const [isDraft, setIsDraft] = useState(false);
  const [status, setStatus] = useState<Status>("loading");
  const [message, setMessage] = useState<string | null>(null);
  const [section, setSection] = useState<SectionId>("header");

  useEffect(() => {
    let cancelled = false;
    loadJsonContent<ZoneStop<SphereId>[]>(DRAFT_ID, FILE_PATH)
      .then((loaded) => {
        if (cancelled) return;
        setData(loaded.data);
        setSha(loaded.sha);
        setIsDraft(loaded.isDraft);
        setStatus("idle");
      })
      .catch((err) => {
        console.error(err);
        if (cancelled) return;
        setData(fallbackSceneStops as ZoneStop<SphereId>[]);
        setSha(null);
        setStatus("idle");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const zoneIndex = data?.findIndex((zone) => zone.zoneId === section) ?? -1;
  const zone = zoneIndex >= 0 ? data![zoneIndex] : null;

  function updateZone(next: ZoneStop<SphereId>) {
    if (!data || zoneIndex < 0) return;
    setData(data.map((z, i) => (i === zoneIndex ? next : z)));
  }

  function updateSphere(sphere: SphereId, next: SphereStop) {
    if (!zone) return;
    updateZone({ ...zone, spheres: { ...zone.spheres, [sphere]: next } });
  }

  function updateCollisionMargin(raw: string) {
    if (!zone) return;
    if (raw.trim() === "") {
      const { collisionMargin: _collisionMargin, ...rest } = zone;
      updateZone(rest as ZoneStop<SphereId>);
      return;
    }
    const numeric = Number(raw);
    if (Number.isNaN(numeric)) return;
    updateZone({ ...zone, collisionMargin: numeric });
  }

  async function handleSaveDraft() {
    if (!data) return;
    setStatus("saving");
    setMessage(null);
    try {
      await saveJsonDraft(DRAFT_ID, data);
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
      await publishJson(DRAFT_ID, FILE_PATH, data, sha);
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
    <div className="flex flex-col gap-6">
      {isDraft && (
        <span className="w-fit rounded-full bg-brand/20 px-3 py-1 text-xs text-brand">Borrador sin publicar</span>
      )}

      <div className="flex flex-wrap gap-2">
        {SECTION_IDS.map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => setSection(id)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
              section === id ? "bg-brand text-white" : "bg-surface-muted text-ink-muted hover:text-ink"
            }`}
          >
            {SECTION_LABELS[id]}
          </button>
        ))}
      </div>

      {zone && (
        <div className="flex flex-col gap-4 rounded-2xl bg-surface-muted p-4">
          <SceneSchemaPreview zone={zone} sphereIds={SPHERE_IDS} />

          <label className="flex w-fit items-center justify-between gap-2 text-xs text-ink-muted">
            Separación anti-colisión de la sección
            <input
              type="number"
              step="0.1"
              placeholder={String(DEFAULT_COLLISION_MARGIN)}
              value={zone.collisionMargin ?? ""}
              onChange={(event) => updateCollisionMargin(event.target.value)}
              className="w-20 rounded border border-ink-muted/30 bg-transparent px-2 py-1 text-right"
            />
          </label>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {SPHERE_IDS.map((sphere) => (
              <SpherePoseEditor
                key={sphere}
                label={SPHERE_LABELS[sphere]}
                stop={zone.spheres[sphere]}
                onChange={(next) => updateSphere(sphere, next)}
              />
            ))}
          </div>
        </div>
      )}

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
