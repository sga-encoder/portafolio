import { useState } from "react";
import AdminGate from "./AdminGate";
import SectionsTab from "./content-panel/SectionsTab";
import SkillsPagesTab from "./content-panel/SkillsPagesTab";
import CarouselTab from "./content-panel/CarouselTab";
import AnimationTab from "./content-panel/AnimationTab";
import type { ProjectCardData } from "../../lib/admin/projectCards";

type Tab = "secciones" | "habilidades" | "carrusel" | "animacion";

const TABS: { key: Tab; label: string; enabled: boolean }[] = [
  { key: "secciones", label: "Secciones", enabled: true },
  { key: "habilidades", label: "Habilidades", enabled: true },
  { key: "carrusel", label: "Carrusel", enabled: true },
  { key: "animacion", label: "Animación 3D", enabled: true },
];

// Pestañas de "Contenido" (064): cada una edita un archivo de datos de Inicio distinto
// (profile.ts/skillsPages.ts/projects.ts/sceneStops.ts, todos migrados a JSON + wrapper
// TypeScript) vía el mismo par borrador(Firestore)/publicar(GitHub) de `jsonContent.ts`. Las 4
// pestañas ya están activas ("Secciones"/"Habilidades"/"Carrusel"/"Animación 3D":
// `064`/`069`/`066`/`067`; "Habilidades" pasó de `SkillsTab` (`065`) a `SkillsPagesTab` en `069`).
function ContentPanelContent() {
  const [tab, setTab] = useState<Tab>("secciones");

  return (
    <>
      <h1 className="mb-6 text-2xl font-display font-bold">Contenido</h1>

      <div className="mb-6 flex flex-wrap gap-2">
        {TABS.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => item.enabled && setTab(item.key)}
            disabled={!item.enabled}
            title={item.enabled ? undefined : "Próximamente"}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              tab === item.key
                ? "bg-brand text-white"
                : item.enabled
                  ? "bg-surface-muted text-ink-muted hover:text-ink"
                  : "cursor-not-allowed bg-surface-muted text-ink-muted/40"
            }`}
          >
            {item.label}
            {!item.enabled && <span className="ml-1 text-xs">(Próximamente)</span>}
          </button>
        ))}
      </div>

      {tab === "secciones" && <SectionsTab />}
      {tab === "habilidades" && <SkillsPagesTab />}
      {tab === "carrusel" && <CarouselTab />}
      {tab === "animacion" && <AnimationTab />}
    </>
  );
}

interface Props {
  switcherProjects: ProjectCardData[];
}

export default function ContentPanel({ switcherProjects }: Props) {
  return (
    <AdminGate active="contenido" switcherProjects={switcherProjects}>
      <ContentPanelContent />
    </AdminGate>
  );
}
