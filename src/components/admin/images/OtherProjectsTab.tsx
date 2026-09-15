import { useEffect, useState } from "react";
import {
  listRootFolders,
  listResourcesByPrefix,
  type CloudinaryFolder,
  type CloudinaryResource,
} from "../../../lib/admin/cloudinaryAccount";
import { groupResourcesBySizeVariant, groupResourcesBySubfolder } from "./groupBySection";

type FoldersStatus = "loading" | "idle" | "error";
type ResourcesStatus = "idle" | "loading" | "error";

// Entrada virtual (no viene de `/folders`): proyectos como Blog Semillero
// suben imágenes sueltas en la raíz de la cuenta, sin ningún folder — con
// variantes de tamaño en el propio public_id (`small_foo`, `medium_foo`, …).
// `/folders` nunca las va a listar porque no están dentro de ningún folder.
const ROOT_SENTINEL = "__root__";

export default function OtherProjectsTab() {
  const [folders, setFolders] = useState<CloudinaryFolder[]>([]);
  const [foldersStatus, setFoldersStatus] = useState<FoldersStatus>("loading");
  const [selected, setSelected] = useState<string | null>(null);
  const [resources, setResources] = useState<CloudinaryResource[]>([]);
  const [resourcesStatus, setResourcesStatus] = useState<ResourcesStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listRootFolders()
      .then((all) => {
        setFolders(all.filter((folder) => folder.name !== "portafolio"));
        setFoldersStatus("idle");
      })
      .catch((err: unknown) => {
        setFoldersStatus("error");
        setError(err instanceof Error ? err.message : "No se pudieron leer los folders de Cloudinary.");
      });
  }, []);

  function handleSelect(folder: string) {
    setSelected(folder);
    setResourcesStatus("loading");
    setResources([]);
    const request =
      folder === ROOT_SENTINEL
        ? listResourcesByPrefix("").then((all) => all.filter((resource) => !resource.public_id.includes("/")))
        : listResourcesByPrefix(`${folder}/`);
    request
      .then((all) => {
        setResources(all);
        setResourcesStatus("idle");
      })
      .catch((err: unknown) => {
        setResourcesStatus("error");
        setError(err instanceof Error ? err.message : "No se pudieron leer las imágenes de este proyecto.");
      });
  }

  const groups =
    selected === ROOT_SENTINEL
      ? groupResourcesBySizeVariant(resources)
      : selected
        ? groupResourcesBySubfolder(resources, selected)
        : null;

  return (
    <>
      <p className="mb-4 text-sm text-ink-muted">
        Imágenes de otros proyectos que comparten esta misma cuenta de Cloudinary. Solo lectura —
        subir o borrar se sigue haciendo desde donde ese proyecto ya administra sus imágenes hoy.
      </p>

      {foldersStatus === "loading" && <p className="text-ink-muted">Cargando proyectos…</p>}
      {foldersStatus === "error" && <p className="text-red-400">{error}</p>}

      {foldersStatus === "idle" && (
        <div className="mb-6 flex flex-wrap gap-2">
          {folders.map((folder) => (
            <button
              key={folder.path}
              type="button"
              onClick={() => handleSelect(folder.path)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                selected === folder.path ? "bg-brand text-white" : "bg-surface-muted text-ink-muted hover:text-ink"
              }`}
            >
              {folder.name}
            </button>
          ))}
          <button
            type="button"
            onClick={() => handleSelect(ROOT_SENTINEL)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              selected === ROOT_SENTINEL ? "bg-brand text-white" : "bg-surface-muted text-ink-muted hover:text-ink"
            }`}
          >
            Sin carpeta
          </button>
        </div>
      )}

      {resourcesStatus === "loading" && <p className="text-ink-muted">Cargando imágenes…</p>}
      {resourcesStatus === "error" && <p className="text-red-400">{error}</p>}

      {groups &&
        [...groups.entries()].map(([label, entries]) => (
          <section key={label} className="mb-8">
            <h2 className="mb-3 text-lg font-display font-semibold">{label}</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
              {entries.map((resource) => (
                <div key={resource.public_id} className="space-y-2 rounded-xl bg-surface-muted p-2">
                  <img
                    src={resource.secure_url.replace("/image/upload/", "/image/upload/w_300,q_auto,f_auto/")}
                    alt={resource.public_id}
                    className="aspect-square w-full rounded-lg object-cover"
                  />
                  <p className="truncate text-xs text-ink-muted" title={resource.public_id}>
                    {resource.public_id}
                  </p>
                </div>
              ))}
            </div>
          </section>
        ))}
    </>
  );
}
