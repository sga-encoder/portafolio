import { useState, type ComponentProps } from "react";
import SphereConfigPanel from "./SphereConfigPanel";
import ServersEditor from "./ServersEditor";

type Tab = "fondo" | "servidores";

interface Props {
  sphereConfigProps: ComponentProps<typeof SphereConfigPanel>;
  serversValue: ComponentProps<typeof ServersEditor>["value"];
  onChangeServers: ComponentProps<typeof ServersEditor>["onChange"];
}

const TABS: { id: Tab; label: string }[] = [
  { id: "fondo", label: "Fondo" },
  { id: "servidores", label: "Servidores" },
];

/**
 * Panel lateral derecho, flotante y colapsable, para la configuración avanzada del proyecto (fondo 3D
 * + servidores) — se saca del flujo lineal del editor para no competir por espacio con el contenido
 * "real" (texto/imágenes/pasos). No toca la lógica interna de `SphereConfigPanel`/`ServersEditor` (053).
 */
export default function EditorSidePanel({ sphereConfigProps, serversValue, onChangeServers }: Props) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("fondo");

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-label={open ? "Cerrar panel de configuración" : "Abrir panel de configuración"}
        className="fixed right-0 top-1/2 z-40 -translate-y-1/2 rounded-l-xl bg-brand px-2 py-4 text-sm font-bold text-white shadow-lg"
      >
        {open ? "✕" : "⚙"}
      </button>

      {open && (
        <div className="fixed right-0 top-1/2 z-30 max-h-[80vh] w-[min(24rem,90vw)] -translate-y-1/2 overflow-y-auto rounded-l-2xl border border-ink-muted/20 bg-surface p-4 shadow-2xl">
          <div className="mb-4 flex gap-2">
            {TABS.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setTab(option.id)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                  tab === option.id ? "bg-brand text-white" : "bg-surface-muted text-ink-muted"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          {tab === "fondo" ? (
            <SphereConfigPanel {...sphereConfigProps} />
          ) : (
            <ServersEditor value={serversValue} onChange={onChangeServers} />
          )}
        </div>
      )}
    </>
  );
}
