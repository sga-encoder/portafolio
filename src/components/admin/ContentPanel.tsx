import { useState } from "react";
import AdminGate from "./AdminGate";
import SectionsTab from "./content-panel/SectionsTab";
import SkillsPagesTab from "./content-panel/SkillsPagesTab";
import CarouselTab from "./content-panel/CarouselTab";
import AnimationTab from "./content-panel/AnimationTab";
import SubPageDotNav, { type SubPageDotNavItem } from "../nav/SubPageDotNav";
import type { ProjectCardData } from "../../lib/admin/projectCards";

type Tab = "secciones" | "habilidades" | "carrusel" | "animacion";

const TABS: (SubPageDotNavItem & { key: Tab })[] = [
  { key: "secciones", dotLabel: "SE", label: "Secciones" },
  { key: "habilidades", dotLabel: "HA", label: "Habilidades" },
  { key: "carrusel", dotLabel: "CR", label: "Carrusel" },
  { key: "animacion", dotLabel: "3D", label: "Animación 3D" },
];

// Pestañas de "Contenido" (064): cada una edita un archivo de datos de Inicio distinto
// (profile.ts/skillsPages.ts/carousel.ts/sceneStops.ts, todos migrados a JSON + wrapper
// TypeScript) vía el mismo par borrador(Firestore)/publicar(GitHub) de `jsonContent.ts`. Las 4
// pestañas ya están activas ("Secciones"/"Habilidades"/"Carrusel"/"Animación 3D":
// `064`/`069`/`071`/`067`; "Habilidades" pasó de `SkillsTab` (`065`) a `SkillsPagesTab` en `069`;
// "Carrusel" pasó del CRUD completo de `066` al selector simple de `071`). Shell a `75vw` (md+)
// desde `073` — sin alto fijo/scroll propio en el shell: "Habilidades" (069/073) se adapta sola al
// viewport con el mismo criterio `vh`/`clamp()` que la sección real de Inicio (carrusel de una
// página a la vez, tarjetas con anillo sin chevron), el resto de pestañas sigue con scroll de
// documento normal. Se probó envolverla en un panel lateral derecho colapsable tipo
// `EditorSidePanel.tsx` (053) y el autor pidió revertirlo — no era a eso a lo que se refería.
function ContentPanelContent({ switcherProjects }: { switcherProjects: ProjectCardData[] }) {
  const [tab, setTab] = useState<Tab>("secciones");

  return (
    <>
      <h1 className="mb-6 text-2xl font-display font-bold">Contenido</h1>

      <SubPageDotNav
        ariaLabel="Navegación de la pestaña Contenido"
        items={TABS}
        activeKey={tab}
        onSelect={(key) => setTab(key as Tab)}
      />

      {tab === "secciones" && <SectionsTab />}
      {tab === "habilidades" && <SkillsPagesTab />}
      {tab === "carrusel" && <CarouselTab availableProjects={switcherProjects} />}
      {tab === "animacion" && <AnimationTab />}
    </>
  );
}

interface Props {
  switcherProjects: ProjectCardData[];
}

export default function ContentPanel({ switcherProjects }: Props) {
  return (
    <AdminGate active="contenido" wide switcherProjects={switcherProjects}>
      <ContentPanelContent switcherProjects={switcherProjects} />
    </AdminGate>
  );
}
