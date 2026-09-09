import { useState } from "react";

interface GalleryImage {
  src: string;
  alt: string;
}

interface Props {
  images: GalleryImage[];
  colorLeft: string;
  colorRight: string;
}

function ChevronIcon({ direction }: { direction: "left" | "right" }) {
  const points = direction === "left" ? "15 5 7 12 15 19" : "9 5 17 12 9 19";
  return (
    <svg viewBox="0 0 24 24" width="28" height="28" fill="none" aria-hidden="true">
      <polyline points={points} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function ProjectGallery({ images, colorLeft, colorRight }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (images.length === 0) return null;

  const image = images[currentIndex];
  const goTo = (delta: number) => {
    setCurrentIndex((index) => (index + delta + images.length) % images.length);
  };

  return (
    <div className="relative mx-auto w-full px-10 sm:px-14">
      {images.length > 1 && (
        <>
          <button
            type="button"
            aria-label="Imagen anterior"
            onClick={() => goTo(-1)}
            className="absolute left-0 top-1/2 z-20 -translate-y-1/2 transition-transform hover:scale-110"
            style={{ color: colorLeft }}
          >
            <ChevronIcon direction="left" />
          </button>

          <button
            type="button"
            aria-label="Siguiente imagen"
            onClick={() => goTo(1)}
            className="absolute right-0 top-1/2 z-20 -translate-y-1/2 transition-transform hover:scale-110"
            style={{ color: colorRight }}
          >
            <ChevronIcon direction="right" />
          </button>
        </>
      )}

      <div className="aspect-video w-full overflow-hidden rounded-2xl bg-surface-muted">
        <img src={image.src} alt={image.alt} className="h-full w-full object-cover" />
      </div>

      {images.length > 1 && (
        <div className="mt-3 flex justify-center gap-2">
          {images.map((img, index) => (
            <button
              key={img.src}
              type="button"
              aria-label={`Ir a la imagen ${index + 1}`}
              onClick={() => setCurrentIndex(index)}
              className="h-2 w-2 rounded-full transition-opacity"
              style={{
                backgroundColor: index === currentIndex ? colorLeft : "var(--color-ink-muted)",
                opacity: index === currentIndex ? 1 : 0.4,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
