import { useRef, useState } from "react";

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

const SWIPE_THRESHOLD_PX = 45;

export default function ProjectCarousel({ projects }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);

  if (projects.length === 0) return null;

  const project = projects[currentIndex];
  const goTo = (delta: number) => {
    setCurrentIndex((index) => (index + delta + projects.length) % projects.length);
  };

  const handleTouchStart = (event: React.TouchEvent) => {
    touchStartX.current = event.touches[0]?.clientX ?? null;
  };

  const handleTouchEnd = (event: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const deltaX = (event.changedTouches[0]?.clientX ?? touchStartX.current) - touchStartX.current;
    touchStartX.current = null;
    if (deltaX > SWIPE_THRESHOLD_PX) goTo(-1);
    else if (deltaX < -SWIPE_THRESHOLD_PX) goTo(1);
  };

  const fallbackImage = (
    <div
      className="h-full w-full"
      style={{
        background:
          "linear-gradient(135deg, var(--sphere-left-color, var(--color-brand)) 0%, transparent 60%), var(--color-surface-muted)",
        opacity: 0.5,
      }}
    />
  );

  return (
    <div className="relative mx-auto w-full max-w-7xl">
      {/* Layout de escritorio: visible en landscape o md:+ (016 fija este criterio para el esfuerzo de responsive). */}
      <div className="relative hidden px-12 short:px-6 landscape:block sm:px-16 md:block">
        <button
          type="button"
          aria-label="Proyecto anterior"
          onClick={() => goTo(-1)}
          className="absolute left-0 short:left-20 top-1/2 z-20 -translate-y-1/2 transition-transform hover:scale-110"
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
          <div className="aspect-[4/3] w-full overflow-hidden rounded-3xl bg-surface-muted sm:w-[70%] short:w-[72%] short:max-h-[32vh]">
            {project.imageSrc ? (
              <img src={project.imageSrc} alt={project.title} className="h-full w-full object-cover" />
            ) : (
              fallbackImage
            )}
          </div>

          <div className="mt-4 flex flex-col gap-4 short:gap-1 sm:absolute sm:right-0 sm:top-[22%] short:top-[8%] sm:mt-0 sm:w-[46%]">
            <h3 className="font-display text-3xl font-bold text-ink [text-shadow:0_2px_8px_rgba(0,0,0,0.55),0_0_22px_rgba(0,0,0,0.45)] sm:text-5xl short:text-sm">
              {project.title}
            </h3>
            <div
              className="project-card-frame rounded-2xl bg-surface/40 p-5 short:p-2 backdrop-blur-sm"
              style={{
                // @ts-expect-error -- custom property, no está tipada en CSSProperties
                "--project-frame-gradient":
                  "linear-gradient(135deg, var(--sphere-left-color, var(--color-brand)), var(--sphere-right-color, var(--color-accent-2)))",
              }}
            >
              <p className="font-body text-sm text-ink-muted short:line-clamp-2 short:text-[10px] short:leading-snug sm:text-base">
                {project.description}
              </p>
              <a
                href={project.link}
                className="mt-4 short:mt-0 inline-block rounded-full px-5 py-2 short:px-3 short:py-1 short:text-xs font-body text-sm font-semibold text-(--color-brand-contrast)"
                style={{ backgroundColor: "var(--sphere-right-color, var(--color-accent-2))" }}
              >
                Ver más
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Layout mobile portrait (nuevo, 018): imagen grande con título superpuesto + tarjeta de descripción solapada. */}
      <div className="block px-4 landscape:hidden md:hidden">
        <div className="relative flex flex-col items-center">
          <div
            className="relative aspect-[3/4] w-full overflow-hidden rounded-3xl bg-surface-muted"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {project.imageSrc ? (
              <img src={project.imageSrc} alt={project.title} className="h-full w-full object-cover" />
            ) : (
              fallbackImage
            )}

            <div
              className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3"
              style={{ background: "linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 100%)" }}
            />

            <h3 className="absolute inset-x-0 bottom-20 px-6 text-center font-display text-2xl font-bold text-ink [text-shadow:0_2px_8px_rgba(0,0,0,0.55),0_0_22px_rgba(0,0,0,0.45)]">
              {project.title}
            </h3>

            <button
              type="button"
              aria-label="Proyecto anterior"
              onClick={() => goTo(-1)}
              className="absolute left-2 top-1/2 z-20 -translate-y-1/2 rounded-full bg-black/30 p-1.5 backdrop-blur-sm transition-transform hover:scale-110"
              style={{ color: "var(--sphere-left-color, var(--color-brand))" }}
            >
              <ChevronIcon direction="left" />
            </button>

            <button
              type="button"
              aria-label="Siguiente proyecto"
              onClick={() => goTo(1)}
              className="absolute right-2 top-1/2 z-20 -translate-y-1/2 rounded-full bg-black/30 p-1.5 backdrop-blur-sm transition-transform hover:scale-110"
              style={{ color: "var(--sphere-right-color, var(--color-accent-2))" }}
            >
              <ChevronIcon direction="right" />
            </button>
          </div>

          <div
            className="relative -mt-16 w-[88%] rounded-3xl p-[10px]"
            style={{
              background:
                "linear-gradient(135deg, var(--sphere-left-color, var(--color-brand)), var(--sphere-right-color, var(--color-accent-2)))",
            }}
          >
            <div
              className="flex flex-col gap-4 rounded-[calc(1.5rem-10px)] p-5"
              style={{ background: "color-mix(in srgb, var(--color-surface) 88%, transparent)" }}
            >
              <p className="font-body text-sm text-ink-muted">{project.description}</p>
              <a
                href={project.link}
                className="inline-block self-start rounded-full px-5 py-2 font-body text-sm font-semibold text-(--color-brand-contrast)"
                style={{ backgroundColor: "var(--sphere-right-color, var(--color-accent-2))" }}
              >
                Ver más
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
