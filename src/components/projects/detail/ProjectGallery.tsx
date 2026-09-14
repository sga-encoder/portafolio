import { useEffect, useRef, useState } from "react";

interface GalleryImage {
  src: string;
  alt: string;
}

interface Props {
  images: GalleryImage[];
  colorLeft: string;
  colorRight: string;
}

interface OrientationLockAPI {
  lock?: (orientation: string) => Promise<void>;
  unlock?: () => void;
}

function getOrientationLock(): OrientationLockAPI {
  return screen.orientation as unknown as OrientationLockAPI;
}

function ChevronIcon({ direction }: { direction: "left" | "right" }) {
  const points = direction === "left" ? "15 5 7 12 15 19" : "9 5 17 12 9 19";
  return (
    <svg viewBox="0 0 24 24" width="28" height="28" fill="none" aria-hidden="true">
      <polyline points={points} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

function RotateIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" aria-hidden="true">
      <path
        d="M4 12a8 8 0 0 1 8-8c2.5 0 4.75 1.2 6.15 3M20 12a8 8 0 0 1-8 8c-2.5 0-4.75-1.2-6.15-3"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path
        d="M18 3v4h-4M6 21v-4h4"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function ProjectGallery({ images, colorLeft, colorRight }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [rotated, setRotated] = useState(false);
  const [screenLocked, setScreenLocked] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  const resetRotation = () => {
    if (rotated) {
      getOrientationLock().unlock?.();
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    }
    setRotated(false);
    setScreenLocked(false);
  };

  const closeLightbox = () => {
    resetRotation();
    setLightboxOpen(false);
  };

  // Ref para que el listener de `Escape` (montado una sola vez por apertura) siempre
  // llame a la versión más reciente de closeLightbox, sin capturar un `rotated` viejo.
  const closeLightboxRef = useRef(closeLightbox);
  closeLightboxRef.current = closeLightbox;

  useEffect(() => {
    if (!lightboxOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeLightboxRef.current();
    };
    const onFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setRotated(false);
        setScreenLocked(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    document.addEventListener("fullscreenchange", onFullscreenChange);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("fullscreenchange", onFullscreenChange);
      document.body.style.overflow = previousOverflow;
    };
  }, [lightboxOpen]);

  if (images.length === 0) return null;

  const image = images[currentIndex];

  const selectIndex = (index: number) => {
    resetRotation();
    setCurrentIndex(index);
  };
  const goTo = (delta: number) => {
    selectIndex((currentIndex + delta + images.length) % images.length);
  };
  const openLightbox = () => {
    setRotated(false);
    setScreenLocked(false);
    setLightboxOpen(true);
  };

  const toggleRotate = async () => {
    if (rotated) {
      resetRotation();
      return;
    }

    let locked = false;
    try {
      if (overlayRef.current && !document.fullscreenElement) {
        await overlayRef.current.requestFullscreen();
      }
      const orientation = getOrientationLock();
      if (orientation.lock) {
        await orientation.lock("landscape");
        locked = true;
      }
    } catch {
      // Fullscreen/orientation lock no soportado (ej. iOS Safari) — el giro CSS sigue funcionando como respaldo.
      locked = false;
    }
    setScreenLocked(locked);
    setRotated(true);
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

      <button
        type="button"
        aria-label="Ver imagen en grande"
        onClick={openLightbox}
        className="block aspect-video w-full cursor-zoom-in overflow-hidden rounded-2xl bg-surface-muted"
      >
        <img src={image.src} alt={image.alt} className="h-full w-full object-cover" />
      </button>

      {images.length > 1 && (
        <div className="mt-3 flex justify-center gap-2">
          {images.map((img, index) => (
            <button
              key={img.src}
              type="button"
              aria-label={`Ir a la imagen ${index + 1}`}
              onClick={() => selectIndex(index)}
              className="h-2 w-2 rounded-full transition-opacity"
              style={{
                backgroundColor: index === currentIndex ? colorLeft : "var(--color-ink-muted)",
                opacity: index === currentIndex ? 1 : 0.4,
              }}
            />
          ))}
        </div>
      )}

      {lightboxOpen && (
        <div
          ref={overlayRef}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 px-14 py-6 backdrop-blur-sm sm:px-20"
          role="dialog"
          aria-modal="true"
          aria-label={image.alt}
          onClick={closeLightbox}
        >
          {/* Agrupa imagen + flechas laterales + fila de cerrar/voltear en una sola columna centrada. */}
          <div className="flex flex-col items-center gap-4" onClick={(event) => event.stopPropagation()}>
            <div className="relative flex items-center justify-center">
              {images.length > 1 && (
                <button
                  type="button"
                  aria-label="Imagen anterior"
                  onClick={() => goTo(-1)}
                  className="absolute -left-14 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/30 backdrop-blur-sm transition-transform hover:scale-110"
                  style={{ color: colorLeft }}
                >
                  <ChevronIcon direction="left" />
                </button>
              )}

              <img
                src={image.src}
                alt={image.alt}
                style={{
                  transform: rotated && !screenLocked ? "rotate(90deg)" : "none",
                  maxWidth: rotated && !screenLocked ? "75vh" : "78vw",
                  maxHeight: rotated && !screenLocked ? "68vw" : "85vh",
                }}
                className="rounded-xl object-contain transition-transform duration-300"
              />

              {images.length > 1 && (
                <button
                  type="button"
                  aria-label="Siguiente imagen"
                  onClick={() => goTo(1)}
                  className="absolute -right-14 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/30 backdrop-blur-sm transition-transform hover:scale-110"
                  style={{ color: colorRight }}
                >
                  <ChevronIcon direction="right" />
                </button>
              )}
            </div>

            {/* Cerrar + voltear, agrupados debajo de la imagen (no encima ni a los costados). */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                aria-label="Cerrar imagen"
                onClick={closeLightbox}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-sm transition-transform hover:scale-110"
              >
                <CloseIcon />
              </button>

              <button
                type="button"
                aria-label={rotated ? "Volver a posición vertical" : "Ver en posición horizontal"}
                onClick={toggleRotate}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-sm transition-transform hover:scale-110 md:hidden"
              >
                <RotateIcon />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
