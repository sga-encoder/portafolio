import { useEffect, useState } from "react";
import { addImage, loadManifest, removeImage, type CloudinaryManifest } from "../../../lib/admin/manifest";
import { groupEntriesBySection } from "./groupBySection";

type Status = "loading" | "idle" | "uploading" | "error";

export default function PortfolioImagesTab() {
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
      .catch((error: unknown) => {
        setStatus("error");
        setMessage(error instanceof Error ? error.message : "No se pudo cargar el manifest.");
      });
  }, []);

  async function handleUpload() {
    if (!manifest || !newFile || !newKey.trim()) return;
    setStatus("uploading");
    setMessage(null);
    try {
      const next = await addImage(manifest, sha, newFile, newKey.trim());
      setManifest(next);
      setNewKey("");
      setNewFile(null);
      setStatus("idle");
      setMessage("Imagen subida.");
    } catch {
      setStatus("error");
      setMessage("No se pudo subir la imagen.");
    }
  }

  async function handleDelete(key: string) {
    if (!manifest) return;
    if (!confirm(`¿Borrar "${key}"? Esta acción no se puede deshacer.`)) return;
    setStatus("uploading");
    setMessage(null);
    try {
      const next = await removeImage(manifest, sha, key);
      setManifest(next);
      setStatus("idle");
      setMessage("Imagen borrada.");
    } catch {
      setStatus("error");
      setMessage("No se pudo borrar la imagen.");
    }
  }

  const groups = manifest ? groupEntriesBySection(Object.entries(manifest.images)) : null;

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end gap-3 rounded-2xl bg-surface-muted p-4">
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
          <input
            type="file"
            accept="image/*"
            onChange={(event) => setNewFile(event.target.files?.[0] ?? null)}
          />
        </label>
        <button
          type="button"
          onClick={handleUpload}
          disabled={status === "loading" || status === "uploading" || !newFile || !newKey.trim()}
          className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {status === "uploading" ? "Subiendo…" : "Subir"}
        </button>
        {message && <span className="text-sm text-ink-muted">{message}</span>}
      </div>

      {status === "loading" && <p className="text-ink-muted">Cargando…</p>}

      {groups &&
        [...groups.entries()].map(([label, entries]) => (
          <section key={label} className="mb-8">
            <h2 className="mb-3 text-lg font-display font-semibold">{label}</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
              {entries.map(([key, entry]) => (
                <div key={key} className="space-y-2 rounded-xl bg-surface-muted p-2">
                  <img
                    src={entry.url.replace("/image/upload/", "/image/upload/w_300,q_auto,f_auto/")}
                    alt={key}
                    className="aspect-square w-full rounded-lg object-cover"
                  />
                  <p className="truncate text-xs text-ink-muted" title={key}>
                    {key}
                  </p>
                  <button
                    type="button"
                    onClick={() => handleDelete(key)}
                    disabled={status === "uploading"}
                    className="w-full rounded-lg bg-red-500/20 px-2 py-1 text-xs text-red-400 disabled:opacity-50"
                  >
                    Borrar
                  </button>
                </div>
              ))}
            </div>
          </section>
        ))}
    </>
  );
}
