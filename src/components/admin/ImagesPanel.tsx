import { useState } from "react";
import AdminGate from "./AdminGate";
import PortfolioImagesTab from "./images/PortfolioImagesTab";
import OtherProjectsTab from "./images/OtherProjectsTab";
import StatsTab from "./images/StatsTab";
import type { ProjectCardData } from "../../lib/admin/projectCards";

type Tab = "portafolio" | "otros" | "estadisticas";

const TABS: { key: Tab; label: string }[] = [
  { key: "portafolio", label: "Portafolio" },
  { key: "otros", label: "Otros proyectos" },
  { key: "estadisticas", label: "Estadísticas" },
];

// Separado en 3 pestañas independientes (feature 045): cada una hace su
// propio fetch en su propio efecto, así cambiar de pestaña no repite
// llamadas innecesarias a GitHub/Cloudinary. Ver
// .claude/spec/features/045-imagenes-multiproyecto-estadisticas/plan.md.
function ImagesContent() {
  const [tab, setTab] = useState<Tab>("portafolio");

  return (
    <>
      <h1 className="mb-6 text-2xl font-display font-bold">Imágenes</h1>

      <div className="mb-6 flex flex-wrap gap-2">
        {TABS.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setTab(item.key)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              tab === item.key ? "bg-brand text-white" : "bg-surface-muted text-ink-muted hover:text-ink"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === "portafolio" && <PortfolioImagesTab />}
      {tab === "otros" && <OtherProjectsTab />}
      {tab === "estadisticas" && <StatsTab />}
    </>
  );
}

interface Props {
  switcherProjects: ProjectCardData[];
}

export default function ImagesPanel({ switcherProjects }: Props) {
  return (
    <AdminGate active="imagenes" switcherProjects={switcherProjects}>
      <ImagesContent />
    </AdminGate>
  );
}
