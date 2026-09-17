import { useState } from "react";

type Status = "loading" | "idle" | "saving" | "publishing" | "error";

interface Props {
  categories: string[];
  onChange: (next: string[]) => void;
  isDraft: boolean;
  status: Status;
  message: string | null;
  onSaveDraft: () => void;
  onPublish: () => void;
}

/**
 * Panel lateral derecho, flotante y colapsable, para el CRUD de categorías de habilidad (073,
 * paso 2) — mismo mecanismo visual que "el panel de animación" del editor de proyecto
 * (`EditorSidePanel.tsx`, 053): botón fijo en el borde derecho que despliega un panel `fixed` con
 * su propio scroll. A diferencia de `SkillsPagesTab.tsx` (editor principal, que quedó inline
 * después de que el autor pidiera revertir el panel lateral ahí), acá sí aplica: es
 * configuración secundaria que no debe competir por espacio con el carrusel de páginas.
 *
 * Es un componente controlado: `SkillsPagesTab.tsx` es dueño del array de categorías y de su
 * ciclo borrador/publicar (mismo `jsonContent.ts` que el resto del panel), para que un cambio acá
 * se refleje al instante en el `<select>` de categoría de cada skill sin recargar la página.
 */
export default function SkillCategoriesPanel({
  categories,
  onChange,
  isDraft,
  status,
  message,
  onSaveDraft,
  onPublish,
}: Props) {
  const [open, setOpen] = useState(false);
  const [newCategory, setNewCategory] = useState("");

  const disabled = status === "saving" || status === "publishing";

  function updateAt(index: number, value: string) {
    onChange(categories.map((category, i) => (i === index ? value : category)));
  }

  function removeAt(index: number) {
    onChange(categories.filter((_, i) => i !== index));
  }

  function moveBy(index: number, delta: number) {
    const target = index + delta;
    if (target < 0 || target >= categories.length) return;
    const next = [...categories];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  function addCategory() {
    const value = newCategory.trim();
    if (!value || categories.includes(value)) return;
    onChange([...categories, value]);
    setNewCategory("");
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-label={open ? "Cerrar panel de categorías" : "Abrir panel de categorías"}
        className="fixed right-0 top-1/2 z-40 -translate-y-1/2 rounded-l-xl bg-brand px-2 py-4 text-sm font-bold text-white shadow-lg"
      >
        {open ? "✕" : "🏷"}
      </button>

      {open && (
        <div className="fixed right-0 top-1/2 z-30 max-h-[80vh] w-[min(24rem,90vw)] -translate-y-1/2 overflow-y-auto rounded-l-2xl border border-ink-muted/20 bg-surface p-4 shadow-2xl">
          <h2 className="mb-3 font-display text-lg font-bold">Categorías</h2>

          {isDraft && (
            <span className="mb-3 inline-block w-fit rounded-full bg-brand/20 px-3 py-1 text-xs text-brand">
              Borrador sin publicar
            </span>
          )}

          <div className="flex flex-col gap-2">
            {categories.map((category, index) => (
              <div key={index} className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={category}
                  onChange={(event) => updateAt(index, event.target.value)}
                  className="w-full rounded-lg border border-ink-muted/30 bg-transparent px-2 py-1 text-sm"
                />
                <button
                  type="button"
                  onClick={() => moveBy(index, -1)}
                  disabled={index === 0}
                  aria-label="Subir"
                  title="Subir"
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface-muted text-xs disabled:opacity-30"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => moveBy(index, 1)}
                  disabled={index === categories.length - 1}
                  aria-label="Bajar"
                  title="Bajar"
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface-muted text-xs disabled:opacity-30"
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => removeAt(index)}
                  aria-label="Quitar categoría"
                  title="Quitar categoría"
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface-muted text-xs text-red-500"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          <div className="mt-3 flex items-center gap-1.5">
            <input
              type="text"
              value={newCategory}
              onChange={(event) => setNewCategory(event.target.value)}
              onKeyDown={(event) => event.key === "Enter" && addCategory()}
              placeholder="Nueva categoría"
              className="w-full rounded-lg border border-ink-muted/30 bg-transparent px-2 py-1 text-sm"
            />
            <button
              type="button"
              onClick={addCategory}
              className="shrink-0 rounded-lg border-2 border-dashed border-ink-muted/30 px-2 py-1 text-xs text-ink-muted hover:border-ink-muted hover:text-ink"
            >
              + Agregar
            </button>
          </div>

          <div className="mt-4 flex flex-col items-start gap-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onSaveDraft}
                disabled={disabled}
                className="rounded-lg bg-surface-muted px-3 py-1.5 text-xs font-medium disabled:opacity-50"
              >
                {status === "saving" ? "Guardando…" : "Guardar borrador"}
              </button>
              <button
                type="button"
                onClick={onPublish}
                disabled={disabled}
                className="rounded-lg bg-brand px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
              >
                {status === "publishing" ? "Publicando…" : "Publicar"}
              </button>
            </div>
            {message && <span className="text-xs text-ink-muted">{message}</span>}
          </div>
        </div>
      )}
    </>
  );
}
