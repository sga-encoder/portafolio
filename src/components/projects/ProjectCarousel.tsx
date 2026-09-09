import { useState } from "react";

export interface CarouselProject {
  id: string;
  title: string;
  description: string;
  imageSrc?: string;
  link: string;
}

interface Props {
  projects: CarouselProject[];
}

function ChevronIcon({ direction }: { direction: "left" | "right" }) {
  const points = direction === "left" ? "15 5 7 12 15 19" : "9 5 17 12 9 19";
  return (
    <svg viewBox="0 0 24 24" width="32" height="32" fill="none" aria-hidden="true">
      <polyline points={points} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function ProjectCarousel({ projects }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (projects.length === 0) return null;

  const project = projects[currentIndex];
  const goTo = (delta: number) => {
    setCurrentIndex((index) => (index + delta + projects.length) % projects.length);
  };

  return (
    <div className="relative mx-auto w-full max-w-7xl px-12 sm:px-16">
      <button
        type="button"
        aria-label="Proyecto anterior"
        onClick={() => goTo(-1)}
        className="absolute left-0 top-1/2 z-20 -translate-y-1/2 transition-transform hover:scale-110"
        style={{ color: "var(--sphere-left-color, var(--color-brand))" }}
      >
        <ChevronIcon direction="left" />
      </button>

      <button
        type="button"
        aria-label="Siguiente proyecto"
        onClick={() => goTo(1)}
        className="absolute right-0 top-1/2 z-20 -translate-y-1/2 transition-transform hover:scale-110"
        style={{ color: "var(--sphere-right-color, var(--color-accent-2))" }}
      >
        <ChevronIcon direction="right" />
      </button>

      <div className="relative flex flex-col sm:block">
        <div className="aspect-[4/3] w-full overflow-hidden rounded-3xl bg-surface-muted sm:w-[70%]">
          {project.imageSrc ? (
            <img src={project.imageSrc} alt={project.title} className="h-full w-full object-cover" />
          ) : (
            <div
              className="h-full w-full"
              style={{
                background:
                  "linear-gradient(135deg, var(--sphere-left-color, var(--color-brand)) 0%, transparent 60%), var(--color-surface-muted)",
                opacity: 0.5,
              }}
            />
          )}
        </div>

        <div className="mt-4 flex flex-col gap-4 sm:absolute sm:right-0 sm:top-[22%] sm:mt-0 sm:w-[46%]">
          <h3
            className="font-display text-3xl font-bold text-ink [text-shadow:0_2px_8px_rgba(0,0,0,0.55),0_0_22px_rgba(0,0,0,0.45)] sm:text-5xl"
          >
            {project.title}
          </h3>
          <div
            className="project-card-frame rounded-2xl bg-surface/40 p-5 backdrop-blur-sm"
            style={{
              // @ts-expect-error -- custom property, no está tipada en CSSProperties
              "--project-frame-gradient": "linear-gradient(135deg, var(--sphere-left-color, var(--color-brand)), var(--sphere-right-color, var(--color-accent-2)))",
            }}
          >
            <p className="font-body text-sm text-ink-muted sm:text-base">{project.description}</p>
            <a
              href={project.link}
              className="mt-4 inline-block rounded-full px-5 py-2 font-body text-sm font-semibold text-(--color-brand-contrast)"
              style={{ backgroundColor: "var(--sphere-right-color, var(--color-accent-2))" }}
            >
              Ver más
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
