import { useState } from "react";
import AdminGate from "./AdminGate";
import PortfolioImagesTab from "./images/PortfolioImagesTab";
import OtherProjectsTab from "./images/OtherProjectsTab";
import SubPageDotNav, { type SubPageDotNavItem } from "../nav/SubPageDotNav";
import type { ProjectCardData } from "../../lib/admin/projectCards";

type Tab = "portafolio" | "otros";

const TABS: (SubPageDotNavItem & { key: Tab })[] = [
  { key: "portafolio", dotLabel: "PF", label: "Portafolio" },
  { key: "otros", dotLabel: "OT", label: "Otros proyectos" },
];

// Separado en pestañas independientes (feature 045): cada una hace su
// propio fetch en su propio efecto, así cambiar de pestaña no repite
// llamadas innecesarias a GitHub/Cloudinary. La pestaña "Estadísticas"
// se movió al panel principal de /admin en 061 (ver
// .claude/spec/features/061-estadisticas-cloudinary-panel-principal/plan.md).
function ImagesContent() {
  const [tab, setTab] = useState<Tab>("portafolio");

  return (
    <>
      <h1 className="mb-6 text-2xl font-display font-bold">Imágenes</h1>

      <SubPageDotNav
        ariaLabel="Navegación de la pestaña Imágenes"
        items={TABS}
        activeKey={tab}
        onSelect={(key) => setTab(key as Tab)}
      />

      {tab === "portafolio" && <PortfolioImagesTab />}
      {tab === "otros" && <OtherProjectsTab />}
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
