import EngineScene3D from "../../../scene/engine/Scene3D";
import type { SphereFrameState } from "../../../scene/engine/SceneContent";
import type { ResolvedZoneStop } from "../../../scene/engine/zoneStops";
import { mobilePortraitSizeScale } from "../../../scene/viewport";
import { PROJECT_SPHERE_IDS, type ProjectSphereId } from "./projectSceneStops";

interface Props {
  /** Zonas ya resueltas Y coloreadas (ver `withProjectColors`/`buildTimelineZoneStops`) — `[slug].astro` pasa las 3 de detalle, `/proyectos` (listado) las suyas por año. */
  zoneStops: readonly ResolvedZoneStop<ProjectSphereId>[];
}

function publishProjectVars(spheres: readonly SphereFrameState[]): void {
  const a = spheres.find((sphere) => sphere.id === "a");
  const b = spheres.find((sphere) => sphere.id === "b");
  if (!a || !b) return;
  const isAOnLeft = a.x <= b.x;
  const root = document.documentElement;
  root.style.setProperty("--project-left-color", isAOnLeft ? a.color : b.color);
  root.style.setProperty("--project-right-color", isAOnLeft ? b.color : a.color);
}

/**
 * Escenario de Proyectos (2 esferas, color fijo por página) sobre el motor genérico compartido
 * (`engine/`, ver 034-unificar-escenas-threejs/plan.md) — usado tanto por `/proyectos/[slug]`
 * como por el listado `/proyectos` (mismo componente desde 021).
 */
export default function ProjectScene3D({ zoneStops }: Props) {
  return (
    <EngineScene3D
      sphereIds={PROJECT_SPHERE_IDS}
      zoneStops={zoneStops}
      sizeScale={mobilePortraitSizeScale}
      onFrame={publishProjectVars}
    />
  );
}
