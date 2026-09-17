import { useState } from "react";
import {
  createEnv,
  deleteEnv,
  listEnv,
  updateEnv,
  type VercelEnvTarget,
  type VercelEnvVar,
} from "../../../lib/admin/servers/vercelEnv";
import type { VercelServer } from "../../../lib/admin/servers/types";

interface Props {
  server: VercelServer;
}

const TARGETS: VercelEnvTarget[] = ["production", "preview", "development"];
const TARGET_LABELS: Record<VercelEnvTarget, string> = {
  production: "Production",
  preview: "Preview",
  development: "Development",
};

interface FormState {
  key: string;
  value: string;
  target: VercelEnvTarget[];
  sensitive: boolean;
}

const EMPTY_FORM: FormState = { key: "", value: "", target: ["production"], sensitive: false };

function toggleTarget(target: VercelEnvTarget[], value: VercelEnvTarget): VercelEnvTarget[] {
  return target.includes(value) ? target.filter((item) => item !== value) : [...target, value];
}

/** Panel de Environment Variables reales de un proyecto Vercel (074), colapsado por defecto en
 * `ServerStatusCard`. A diferencia del resto de /admin/servidores (046, solo lectura), acá se
 * escribe infraestructura real — toda llamada de escritura es un gesto explícito del autor, nunca
 * automática al abrir el panel. */
export default function VercelEnvPanel({ server }: Props) {
  const [open, setOpen] = useState(false);
  const [envs, setEnvs] = useState<VercelEnvVar[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [addForm, setAddForm] = useState<FormState>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<FormState>(EMPTY_FORM);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [revealedId, setRevealedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const result = await listEnv(server);
      setEnvs(result.sort((a, b) => a.key.localeCompare(b.key)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cargar la lista de variables.");
    } finally {
      setLoading(false);
    }
  }

  function handleOpen() {
    setOpen(true);
    if (!envs) refresh();
  }

  async function handleCreate() {
    if (!addForm.key.trim() || !addForm.value || addForm.target.length === 0) return;
    setSaving(true);
    setError(null);
    try {
      await createEnv(server, {
        key: addForm.key.trim(),
        value: addForm.value,
        target: addForm.target,
        type: addForm.sensitive ? "sensitive" : "plain",
      });
      setAdding(false);
      setAddForm(EMPTY_FORM);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear la variable.");
    } finally {
      setSaving(false);
    }
  }

  function startEdit(env: VercelEnvVar) {
    setEditingId(env.id);
    setEditForm({ key: env.key, value: env.value ?? "", target: env.target, sensitive: env.type === "sensitive" });
  }

  async function handleUpdate(envId: string) {
    setSaving(true);
    setError(null);
    try {
      await updateEnv(server, envId, { value: editForm.value, target: editForm.target });
      setEditingId(null);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo editar la variable.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(envId: string) {
    setSaving(true);
    setError(null);
    try {
      await deleteEnv(server, envId);
      setConfirmingId(null);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo borrar la variable.");
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={handleOpen}
        className="w-fit rounded-full bg-surface px-3 py-1 text-xs font-medium text-ink-muted hover:text-ink"
      >
        Variables de entorno
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-surface p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-ink">Variables de entorno</p>
        <div className="flex items-center gap-2">
          <button type="button" onClick={refresh} disabled={loading} className="text-xs text-ink-muted hover:text-ink disabled:opacity-50">
            {loading ? "Consultando…" : "Actualizar"}
          </button>
          <button type="button" onClick={() => setOpen(false)} className="text-xs text-ink-muted hover:text-ink">
            Cerrar
          </button>
        </div>
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}
      {loading && !envs && <p className="text-xs text-ink-muted">Consultando…</p>}

      {envs && envs.length === 0 && !adding && (
        <p className="text-xs text-ink-muted">Sin variables de entorno todavía.</p>
      )}

      {envs && envs.length > 0 && (
        <ul className="flex flex-col gap-2">
          {envs.map((env) => (
            <li key={env.id} className="rounded-xl bg-surface-muted p-2">
              {editingId === env.id ? (
                <div className="flex flex-col gap-2">
                  <p className="font-mono text-xs text-ink">{env.key}</p>
                  <input
                    type="text"
                    value={editForm.value}
                    onChange={(event) => setEditForm({ ...editForm, value: event.target.value })}
                    placeholder="Valor"
                    className="rounded-lg bg-surface px-2 py-1 text-xs text-ink"
                  />
                  <div className="flex flex-wrap gap-2 text-xs text-ink-muted">
                    {TARGETS.map((target) => (
                      <label key={target} className="flex items-center gap-1">
                        <input
                          type="checkbox"
                          checked={editForm.target.includes(target)}
                          onChange={() => setEditForm({ ...editForm, target: toggleTarget(editForm.target, target) })}
                        />
                        {TARGET_LABELS[target]}
                      </label>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleUpdate(env.id)}
                      disabled={saving || editForm.target.length === 0}
                      className="rounded-full bg-brand px-3 py-1 text-xs font-medium text-white disabled:opacity-50"
                    >
                      Guardar
                    </button>
                    <button type="button" onClick={() => setEditingId(null)} className="text-xs text-ink-muted hover:text-ink">
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-col gap-1">
                    <p className="font-mono text-xs text-ink">{env.key}</p>
                    <div className="flex flex-wrap items-center gap-1 text-[10px] text-ink-muted">
                      {env.target.map((target) => (
                        <span key={target} className="rounded-full bg-surface px-2 py-0.5">
                          {TARGET_LABELS[target]}
                        </span>
                      ))}
                    </div>
                    <p className="font-mono text-xs text-ink-muted">
                      {env.type === "sensitive"
                        ? "•••• (sensible, valor oculto)"
                        : revealedId === env.id
                          ? (env.value ?? "—")
                          : "••••••••"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    {env.type !== "sensitive" && (
                      <button
                        type="button"
                        onClick={() => setRevealedId(revealedId === env.id ? null : env.id)}
                        className="text-ink-muted hover:text-ink"
                      >
                        {revealedId === env.id ? "Ocultar" : "Mostrar"}
                      </button>
                    )}
                    <button type="button" onClick={() => startEdit(env)} className="text-ink-muted hover:text-ink">
                      Editar
                    </button>
                    {confirmingId === env.id ? (
                      <>
                        <span className="text-red-500">¿Seguro?</span>
                        <button
                          type="button"
                          onClick={() => handleDelete(env.id)}
                          disabled={saving}
                          className="text-red-500 hover:underline disabled:opacity-50"
                        >
                          Sí, borrar
                        </button>
                        <button type="button" onClick={() => setConfirmingId(null)} className="text-ink-muted hover:text-ink">
                          Cancelar
                        </button>
                      </>
                    ) : (
                      <button type="button" onClick={() => setConfirmingId(env.id)} className="text-red-500 hover:underline">
                        Borrar
                      </button>
                    )}
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {adding ? (
        <div className="flex flex-col gap-2 rounded-xl bg-surface-muted p-2">
          <input
            type="text"
            value={addForm.key}
            onChange={(event) => setAddForm({ ...addForm, key: event.target.value })}
            placeholder="NOMBRE_VARIABLE"
            className="rounded-lg bg-surface px-2 py-1 font-mono text-xs text-ink"
          />
          <input
            type="text"
            value={addForm.value}
            onChange={(event) => setAddForm({ ...addForm, value: event.target.value })}
            placeholder="Valor"
            className="rounded-lg bg-surface px-2 py-1 text-xs text-ink"
          />
          <div className="flex flex-wrap gap-2 text-xs text-ink-muted">
            {TARGETS.map((target) => (
              <label key={target} className="flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={addForm.target.includes(target)}
                  onChange={() => setAddForm({ ...addForm, target: toggleTarget(addForm.target, target) })}
                />
                {TARGET_LABELS[target]}
              </label>
            ))}
          </div>
          <label className="flex items-center gap-1 text-xs text-ink-muted">
            <input
              type="checkbox"
              checked={addForm.sensitive}
              onChange={(event) => setAddForm({ ...addForm, sensitive: event.target.checked })}
            />
            Sensible (el valor no se podrá volver a ver después de crearla)
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleCreate}
              disabled={saving || !addForm.key.trim() || !addForm.value || addForm.target.length === 0}
              className="rounded-full bg-brand px-3 py-1 text-xs font-medium text-white disabled:opacity-50"
            >
              Crear
            </button>
            <button
              type="button"
              onClick={() => {
                setAdding(false);
                setAddForm(EMPTY_FORM);
              }}
              className="text-xs text-ink-muted hover:text-ink"
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="w-fit rounded-full bg-surface-muted px-3 py-1 text-xs font-medium text-ink-muted hover:text-ink"
        >
          + Agregar variable
        </button>
      )}
    </div>
  );
}
