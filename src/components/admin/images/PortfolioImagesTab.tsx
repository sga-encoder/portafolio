import { useEffect, useState } from "react";
import {
  addImage,
  loadManifest,
  removeImage,
  replaceImageWithExisting,
  type CloudinaryManifest,
} from "../../../lib/admin/manifest";
import { listResourcesByPrefix, type CloudinaryResource } from "../../../lib/admin/cloudinaryAccount";
import { groupEntriesBySection } from "./groupBySection";

type Status = "loading" | "idle" | "uploading" | "error";
type UnusedStatus = "idle" | "loading" | "error";

// Secciones colapsadas recordadas por visitante vía localStorage — mismo
// criterio defensivo que `admin-proyectos-collapsed-years` (056/059): sin
// acceso a localStorage, degrada a "todo expandido" sin romper la UI.
const COLLAPSED_SECTIONS_KEY = "admin-imagenes-portafolio-collapsed-sections";

function loadCollapsedSections(): Set<string> {
  try {
    const raw = localStorage.getItem(COLLAPSED_SECTIONS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

function saveCollapsedSections(sections: Set<string>) {
  try {
    localStorage.setItem(COLLAPSED_SECTIONS_KEY, JSON.stringify([...sections]));
  } catch {
    // Sin persistencia (modo privado, localStorage bloqueado, etc.) — no rompe la UI.
  }
}

export default function PortfolioImagesTab() {
  const [manifest, setManifest] = useState<CloudinaryManifest | null>(null);
  const [sha, setSha] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [message, setMessage] = useState<string | null>(null);
  const [newKey, setNewKey] = useState("");
  const [newFile, setNewFile] = useState<File | null>(null);

  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(() => loadCollapsedSections());

  const [replacingKey, setReplacingKey] = useState<string | null>(null);
  const [replaceFile, setReplaceFile] = useState<File | null>(null);
  const [unusedResources, setUnusedResources] = useState<CloudinaryResource[] | null>(null);
  const [unusedStatus, setUnusedStatus] = useState<UnusedStatus>("idle");
  const [selectedResourceId, setSelectedResourceId] = useState("");

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

  function toggleSection(label: string) {
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      saveCollapsedSections(next);
      return next;
    });
  }

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

  async function ensureUnusedResources(current: CloudinaryManifest) {
    if (unusedResources !== null || unusedStatus === "loading") return;
    setUnusedStatus("loading");
    try {
      const used = new Set(Object.values(current.images).map((entry) => entry.publicId));
      const all = await listResourcesByPrefix("portafolio/");
      setUnusedResources(all.filter((resource) => !used.has(resource.public_id)));
      setUnusedStatus("idle");
    } catch {
      setUnusedStatus("error");
    }
  }

  function toggleReplace(key: string) {
    const opening = replacingKey !== key;
    setReplacingKey(opening ? key : null);
    setReplaceFile(null);
    setSelectedResourceId("");
    if (opening && manifest) void ensureUnusedResources(manifest);
  }

  async function handleReplaceWithUpload(key: string) {
    if (!manifest || !replaceFile) return;
    setStatus("uploading");
    setMessage(null);
    try {
      const next = await addImage(manifest, sha, replaceFile, key);
      setManifest(next);
      setReplacingKey(null);
      setReplaceFile(null);
      setStatus("idle");
      setMessage("Imagen reemplazada.");
    } catch {
      setStatus("error");
      setMessage("No se pudo reemplazar la imagen.");
    }
  }

  async function handleReplaceWithExisting(key: string) {
    if (!manifest || !unusedResources) return;
    const resource = unusedResources.find((item) => item.public_id === selectedResourceId);
    if (!resource) return;
    setStatus("uploading");
    setMessage(null);
    try {
      const next = await replaceImageWithExisting(manifest, sha, key, resource);
      setManifest(next);
      setReplacingKey(null);
      setSelectedResourceId("");
      setStatus("idle");
      setMessage("Imagen reemplazada.");
    } catch {
      setStatus("error");
      setMessage("No se pudo reemplazar la imagen.");
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
        [...groups.entries()].map(([label, entries]) => {
          const isCollapsed = collapsedSections.has(label);
          return (
            <section key={label} className="mb-8">
              <button
                type="button"
                onClick={() => toggleSection(label)}
                aria-expanded={!isCollapsed}
                className="mb-3 flex w-full items-center gap-2 font-display text-lg font-semibold"
              >
                <svg
                  viewBox="0 0 20 20"
                  width="14"
                  height="14"
                  aria-hidden="true"
                  className={`shrink-0 transition-transform ${isCollapsed ? "-rotate-90" : ""}`}
                >
                  <path d="M5 7l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span>{label}</span>
                {isCollapsed && (
                  <>
                    <span className="mx-2 h-0 flex-1 border-b border-dotted border-ink-muted/40" aria-hidden="true" />
                    <span className="font-body text-sm font-normal text-ink-muted">{entries.length}</span>
                  </>
                )}
              </button>

              {!isCollapsed && (
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
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => toggleReplace(key)}
                          disabled={status === "uploading"}
                          className="flex-1 rounded-lg bg-brand/20 px-2 py-1 text-xs text-brand disabled:opacity-50"
                        >
                          {replacingKey === key ? "Cancelar" : "Reemplazar"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(key)}
                          disabled={status === "uploading"}
                          className="flex-1 rounded-lg bg-red-500/20 px-2 py-1 text-xs text-red-400 disabled:opacity-50"
                        >
                          Borrar
                        </button>
                      </div>

                      {replacingKey === key && (
                        <div className="space-y-3 rounded-lg bg-surface p-2 text-xs">
                          <div className="space-y-1">
                            <p className="font-medium">Subir nueva</p>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(event) => setReplaceFile(event.target.files?.[0] ?? null)}
                              className="w-full text-xs"
                            />
                            <button
                              type="button"
                              onClick={() => handleReplaceWithUpload(key)}
                              disabled={status === "uploading" || !replaceFile}
                              className="w-full rounded-lg bg-brand px-2 py-1 text-white disabled:opacity-50"
                            >
                              Subir y reemplazar
                            </button>
                          </div>

                          <div className="space-y-1">
                            <p className="font-medium">Usar existente</p>
                            {unusedStatus === "loading" && <p className="text-ink-muted">Cargando…</p>}
                            {unusedStatus === "error" && (
                              <p className="text-red-400">No se pudo cargar la lista de Cloudinary.</p>
                            )}
                            {unusedStatus === "idle" && unusedResources && unusedResources.length === 0 && (
                              <p className="text-ink-muted">No hay imágenes sin usar.</p>
                            )}
                            {unusedStatus === "idle" && unusedResources && unusedResources.length > 0 && (
                              <>
                                <select
                                  value={selectedResourceId}
                                  onChange={(event) => setSelectedResourceId(event.target.value)}
                                  className="w-full rounded-lg border border-ink-muted/30 bg-transparent px-2 py-1"
                                >
                                  <option value="">Elegir…</option>
                                  {unusedResources.map((resource) => (
                                    <option key={resource.public_id} value={resource.public_id}>
                                      {resource.public_id}
                                    </option>
                                  ))}
                                </select>
                                <button
                                  type="button"
                                  onClick={() => handleReplaceWithExisting(key)}
                                  disabled={status === "uploading" || !selectedResourceId}
                                  className="w-full rounded-lg bg-brand px-2 py-1 text-white disabled:opacity-50"
                                >
                                  Usar y reemplazar
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          );
        })}
    </>
  );
}
