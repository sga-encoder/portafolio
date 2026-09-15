import { useRef, useState, type ReactNode } from "react";

interface Props {
  pageCount: number;
  children: ReactNode;
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

/**
 * Orquesta qué página de Habilidades se ve (068) sin recrear el layout de tarjetas en React: las
 * páginas llegan pre-renderizadas como HTML estático desde `SkillsSection.astro` (una
 * `SkillsPage.astro` por entrada) y este island solo mueve un track horizontal + flechas/dots +
 * swipe, igual que `ProjectCarousel.tsx`/`ProjectGallery.tsx` combinados (ver `plan.md`, "opción
 * 2").
 */
export default function SkillsCarousel({ pageCount, children }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);

  const goTo = (delta: number) => {
    setCurrentIndex((index) => (index + delta + pageCount) % pageCount);
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

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <div
        className="relative min-h-0 flex-1 overflow-hidden"
        style={{ touchAction: "pan-y" }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className="flex h-full transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {children}
        </div>

        {pageCount > 1 && (
          <>
            <button
              type="button"
              aria-label="Página anterior"
              onClick={() => goTo(-1)}
              className="absolute left-0 top-1/2 z-20 -translate-y-1/2 transition-transform hover:scale-110"
              style={{ color: "var(--sphere-left-color, var(--color-brand))" }}
            >
              <ChevronIcon direction="left" />
            </button>

            <button
              type="button"
              aria-label="Página siguiente"
              onClick={() => goTo(1)}
              className="absolute right-0 top-1/2 z-20 -translate-y-1/2 transition-transform hover:scale-110"
              style={{ color: "var(--sphere-right-color, var(--color-accent-2))" }}
            >
              <ChevronIcon direction="right" />
            </button>
          </>
        )}
      </div>

      {pageCount > 1 && (
        <div className="mt-2 flex shrink-0 justify-center gap-2">
          {Array.from({ length: pageCount }, (_, index) => (
            <button
              key={index}
              type="button"
              aria-label={`Ir a la página ${index + 1}`}
              onClick={() => setCurrentIndex(index)}
              className="h-2 w-2 rounded-full transition-opacity"
              style={{
                backgroundColor:
                  index === currentIndex ? "var(--sphere-left-color, var(--color-brand))" : "var(--color-ink-muted)",
                opacity: index === currentIndex ? 1 : 0.4,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
