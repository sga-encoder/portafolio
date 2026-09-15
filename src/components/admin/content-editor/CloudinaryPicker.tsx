import { useEffect, useState } from "react";
import { addImage, loadManifest, type CloudinaryManifest } from "../../../lib/admin/manifest";

interface Props {
  /** `url` es la del manifest recién cargado (siempre al día) — evita depender del manifest
   * estático empaquetado al build, que no conoce todavía una imagen recién subida esta sesión. */
  onSelect: (key: string, url: string) => void;
  onClose: () => void;
}

type Tab = "elegir" | "subir";
type Status = "loading" | "idle" | "uploading" | "error";

/**
 * Selector de imagen para el editor visual (044): elegir una ya sincronizada a Cloudinary (mismo
 * manifest que `/admin/imagenes`) o subir una nueva (mismo flujo firmado que ya usa `ImagesPanel`,
 * reusando `addImage` — la subida hace un commit real del manifest de inmediato, no queda pendiente
 * del "Guardar borrador"/"Publicar" del contenido).
 */
export default function CloudinaryPicker({ onSelect, onClose }: Props) {
  const [tab, setTab] = useState<Tab>("elegir");
  const [manifest, setManifest] = useState<CloudinaryManifest | null>(null);
  const [sha, setSha] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [message, setMessage] = useState<string | null>(null);
  const [newKey, setNewKey] = useState("");
  const [newFile, setNewFile] = useState<File | null>(null);

  useEffect(() => {
    loadManifest()
      .then((loaded) => {
        setManifest(loaded.manifest);
        setSha(loaded.sha);
        setStatus("idle");
      })
      .catch(() => {
        setStatus("error");
        setMessage("No se pudo cargar el manifest.");
      });
  }, []);

  async function handleUpload() {
    if (!manifest || !newFile || !newKey.trim()) return;
    setStatus("uploading");
    setMessage(null);
    try {
      const key = newKey.trim();
      const next = await addImage(manifest, sha, newFile, key);
      setManifest(next);
      onSelect(key, next.images[key].url);
    } catch {
      setStatus("error");
      setMessage("No se pudo subir la imagen.");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-surface p-4"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setTab("elegir")}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium ${tab === "elegir" ? "bg-brand text-white" : "bg-surface-muted"}`}
            >
              Elegir existente
            </button>
            <button
              type="button"
              onClick={() => setTab("subir")}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium ${tab === "subir" ? "bg-brand text-white" : "bg-surface-muted"}`}
            >
              Subir nueva
            </button>
          </div>
          <button type="button" onClick={onClose} className="text-ink-muted" aria-label="Cerrar">
            ✕
          </button>
        </div>

        {status === "loading" && <p className="text-ink-muted">Cargando…</p>}
        {message && <p className="mb-3 text-sm text-ink-muted">{message}</p>}

        {tab === "elegir" && manifest && (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
            {Object.entries(manifest.images).map(([key, entry]) => (
              <button
                type="button"
                key={key}
                onClick={() => onSelect(key, entry.url)}
                className="space-y-1 rounded-xl bg-surface-muted p-1.5 text-left"
              >
                <img
                  src={entry.url.replace("/image/upload/", "/image/upload/w_200,q_auto,f_auto/")}
                  alt={key}
                  className="aspect-square w-full rounded-lg object-cover"
                />
                <p className="truncate text-xs text-ink-muted" title={key}>
                  {key}
                </p>
              </button>
            ))}
          </div>
        )}

        {tab === "subir" && (
          <div className="flex flex-wrap items-end gap-3">
            <label className="space-y-1 text-sm">
              <span className="block">Clave (ej. proyectos/mi-imagen)</span>
              <input
                type="text"
                value={newKey}
                onChange={(event) => setNewKey(event.target.value)}
                className="rounded-lg border border-ink-muted/30 bg-transparent px-3 py-2"
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="block">Archivo</span>
              <input type="file" accept="image/*" onChange={(event) => setNewFile(event.target.files?.[0] ?? null)} />
            </label>
            <button
              type="button"
              onClick={handleUpload}
              disabled={status === "uploading" || !newFile || !newKey.trim()}
              className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {status === "uploading" ? "Subiendo…" : "Subir y usar"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
