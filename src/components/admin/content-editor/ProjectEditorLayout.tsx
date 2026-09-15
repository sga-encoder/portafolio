import { getCloudinaryColors } from "../../../utils/cloudinaryManifest";
import { projectZoneStops } from "../../projects/detail/scene/projectSceneStops";
import EditableImage from "./EditableImage";
import TagListEditor from "./TagListEditor";
import PlatformsCheckboxes from "./PlatformsCheckboxes";
import StepsEditor from "./StepsEditor";
import GalleryEditor from "./GalleryEditor";
import SphereConfigPanel from "./SphereConfigPanel";
import ServersEditor from "./ServersEditor";
import type { ProjectServer } from "../../../lib/admin/servers";

interface CopyItem {
  value: string;
  label?: string;
}

interface ProjectButton {
  label: string;
  href: string;
}

interface Step {
  text: string;
  copyText?: CopyItem[];
  buttons?: ProjectButton[];
}

export interface ProjectFrontmatter {
  title: string;
  summary: string;
  coverImage: string;
  gallery: string[];
  techStack: string[];
  platforms: ("mobile" | "desktop")[];
  links?: { repo?: string; demo?: string };
  steps: Step[];
  sphereColors?: [string, string];
  sphereMovement?: Record<string, { a?: Record<string, number>; b?: Record<string, number> }>;
  servers?: ProjectServer[];
}

interface Props {
  data: ProjectFrontmatter;
  body: string;
  onChangeData: (next: ProjectFrontmatter) => void;
  onChangeBody: (next: string) => void;
}

const ZONE_DEFAULTS = {
  header: {
    a: { x: projectZoneStops[0].spheres.a.end.position[0], y: projectZoneStops[0].spheres.a.end.position[1], screenFraction: projectZoneStops[0].spheres.a.end.screenFraction },
    b: { x: projectZoneStops[0].spheres.b.end.position[0], y: projectZoneStops[0].spheres.b.end.position[1], screenFraction: projectZoneStops[0].spheres.b.end.screenFraction },
  },
  content: {
    a: { x: projectZoneStops[1].spheres.a.end.position[0], y: projectZoneStops[1].spheres.a.end.position[1], screenFraction: projectZoneStops[1].spheres.a.end.screenFraction },
    b: { x: projectZoneStops[1].spheres.b.end.position[0], y: projectZoneStops[1].spheres.b.end.position[1], screenFraction: projectZoneStops[1].spheres.b.end.screenFraction },
  },
  gallery: {
    a: { x: projectZoneStops[2].spheres.a.end.position[0], y: projectZoneStops[2].spheres.a.end.position[1], screenFraction: projectZoneStops[2].spheres.a.end.screenFraction },
    b: { x: projectZoneStops[2].spheres.b.end.position[0], y: projectZoneStops[2].spheres.b.end.position[1], screenFraction: projectZoneStops[2].spheres.b.end.screenFraction },
  },
};

/**
 * Réplica visual en React del layout real de `/proyectos/[slug]` (marco de encabezado, descripción
 * + pasos, galería, panel de esferas) con cada campo de texto como input/textarea y cada imagen fija
 * con su ícono de editar. Duplicación deliberada de marcado (no de lógica) respecto a los `.astro`
 * reales — ver 044-editor-visual-contenido-proyectos/plan.md.
 */
export default function ProjectEditorLayout({ data, body, onChangeData, onChangeBody }: Props) {
  function patch(next: Partial<ProjectFrontmatter>) {
    onChangeData({ ...data, ...next });
  }

  let autoColors: [string, string] = ["#C0009D", "#0033FF"];
  try {
    autoColors = getCloudinaryColors(data.coverImage);
  } catch {
    // Portada recién elegida esta sesión, todavía no en el manifest estático del build — se
    // mantiene el fallback hasta el próximo build.
  }
  const colors = data.sphereColors ?? autoColors;

  return (
    <div className="flex flex-col gap-8">
      {/* Encabezado */}
      <div
        className="rounded-[2rem] p-[6px]"
        style={{
          background: `conic-gradient(from 135deg at 50% 50%, ${colors[0]}, ${colors[1]}, ${colors[0]})`,
        }}
      >
        <div className="flex flex-col gap-4 rounded-[calc(2rem-6px)] bg-surface p-4 md:flex-row md:gap-6">
          <EditableImage
            value={data.coverImage}
            onChange={(coverImage) => patch({ coverImage })}
            alt={data.title}
            className="aspect-video w-full shrink-0 md:aspect-auto md:h-64 md:w-[42%]"
          />

          <div className="flex min-w-0 flex-1 flex-col justify-center gap-3">
            <input
              type="text"
              value={data.title}
              onChange={(event) => patch({ title: event.target.value })}
              placeholder="Título del proyecto"
              className="rounded-lg bg-transparent font-display text-3xl font-bold text-ink sm:text-4xl"
            />

            <TagListEditor value={data.techStack} onChange={(techStack) => patch({ techStack })} />
            <PlatformsCheckboxes value={data.platforms} onChange={(platforms) => patch({ platforms })} />

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <label className="flex items-center gap-2 text-xs text-ink-muted">
                Repo
                <input
                  type="text"
                  value={data.links?.repo ?? ""}
                  onChange={(event) => patch({ links: { ...data.links, repo: event.target.value } })}
                  placeholder="https://github.com/…"
                  className="w-56 rounded-lg border border-ink-muted/30 bg-transparent px-2 py-1"
                />
              </label>
              <label className="flex items-center gap-2 text-xs text-ink-muted">
                Demo
                <input
                  type="text"
                  value={data.links?.demo ?? ""}
                  onChange={(event) => patch({ links: { ...data.links, demo: event.target.value } })}
                  placeholder="https://…"
                  className="w-56 rounded-lg border border-ink-muted/30 bg-transparent px-2 py-1"
                />
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Descripción + pasos */}
      <div className="grid grid-cols-1 gap-8 md:grid-cols-[35%_auto_1fr] md:items-stretch md:gap-10">
        <div className="flex h-full flex-col gap-4">
          <div className="rounded-2xl bg-surface-muted p-4">
            <h2 className="font-display text-sm font-bold uppercase tracking-wide text-ink-muted">Descripción</h2>
            <textarea
              value={data.summary}
              onChange={(event) => patch({ summary: event.target.value })}
              rows={3}
              className="mt-2 w-full resize-none rounded-lg bg-transparent font-body text-lg text-ink"
            />
          </div>

          <div className="min-w-0 rounded-2xl bg-surface-muted p-4">
            <h2 className="font-display text-sm font-bold uppercase tracking-wide text-ink-muted">Contexto</h2>
            <textarea
              value={body}
              onChange={(event) => onChangeBody(event.target.value)}
              rows={8}
              className="mt-2 w-full resize-y rounded-lg bg-transparent font-body text-sm text-ink"
            />
          </div>
        </div>

        <div
          className="hidden w-[6px] rounded-full md:block"
          style={{ background: `linear-gradient(180deg, ${colors[0]}, ${colors[1]})` }}
        />

        <StepsEditor value={data.steps} onChange={(steps) => patch({ steps })} colors={colors} />
      </div>

      {/* Galería */}
      <div>
        <h2 className="mb-3 font-display text-sm font-bold uppercase tracking-wide text-ink-muted">Galería</h2>
        <GalleryEditor value={data.gallery} onChange={(gallery) => patch({ gallery })} alt={data.title} />
      </div>

      <SphereConfigPanel
        sphereColors={data.sphereColors}
        autoColors={autoColors}
        onChangeColors={(sphereColors) => patch({ sphereColors })}
        sphereMovement={data.sphereMovement}
        onChangeMovement={(sphereMovement) => patch({ sphereMovement })}
        defaults={ZONE_DEFAULTS}
      />

      <ServersEditor value={data.servers ?? []} onChange={(servers) => patch({ servers })} />
    </div>
  );
}
