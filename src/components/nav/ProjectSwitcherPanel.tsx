import { useEffect, useRef } from "react";
import NavIcon, { type NavIconName } from "./NavIcon";

export interface SwitcherItem {
  href: string;
  title: string;
  date: string;
  imageSrc?: string;
}

interface Props {
  items: SwitcherItem[];
  color: string;
  /** Destino del botón companion "Ver todos" (p. ej. `/proyectos` o `/admin/proyectos`). */
  allHref: string;
  triggerIcon?: NavIconName;
  triggerLabel?: string;
  allLabel?: string;
  allIcon?: NavIconName;
  /** Notifica al padre cuando el panel se abre/cierra (p. ej. para que el ítem del menú principal que lo
   *  contiene se mantenga "activo" mientras esté abierto, ver `AdminDotNav.tsx`). Opcional: el consumidor
   *  del sitio público (`ProjectDetailNav.astro`) no lo usa. */
  onOpenChange?: (open: boolean) => void;
}

/**
 * Selector rápido de proyectos (037, rediseñado en 041/050): botón-ícono que
 * abre un panel con tarjetas (imagen+título+fecha) de otros proyectos, para
 * saltar directo a cualquiera, más un botón companion "Ver todos". Un solo
 * componente compartido por el sitio público (`ProjectDetailNav.astro`,
 * montado como `client:load`) y por `/admin` (`AdminDotNav.tsx`) — antes
 * eran 2 implementaciones separadas (Astro + un puerto React distinto para
 * admin), unificadas en 054 a pedido del usuario ("deberían ser el mismo
 * componente"). El CSS de posicionamiento (riel desktop / barra fija mobile,
 * scrollbar del grid, etc.) vive en `global.css` bajo las mismas clases
 * `.project-switcher*` — no puede ser un `<style>` scoped de un `.astro`
 * porque este componente ya no es uno.
 *
 * `<details>` nativo (sin JS de estado) + un `useEffect` mínimo para cerrar
 * al hacer click fuera / Escape, y para quitar el foco del `<summary>` al
 * cerrarse (si no, el `focusout` que reanuda la animación idle del riel
 * — `.nav-rail-glow`, `BaseLayout.astro` — nunca llega).
 */
export default function ProjectSwitcherPanel({
  items,
  color,
  allHref,
  triggerIcon = "layers",
  triggerLabel = "Cambiar de proyecto",
  allLabel = "Ver todos los proyectos",
  allIcon = "grid",
  onOpenChange,
}: Props) {
  const detailsRef = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    const details = detailsRef.current;
    if (!details) return;

    const onToggle = () => {
      onOpenChange?.(details.open);
      if (details.open) return;
      const summary = details.querySelector("summary");
      if (summary instanceof HTMLElement && document.activeElement === summary) summary.blur();
    };
    details.addEventListener("toggle", onToggle);

    const onDocClick = (event: MouseEvent) => {
      if (details.open && event.target instanceof Node && !details.contains(event.target)) {
        details.open = false;
      }
    };
    const onKeydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") details.open = false;
    };
    document.addEventListener("click", onDocClick);
    document.addEventListener("keydown", onKeydown);

    return () => {
      details.removeEventListener("toggle", onToggle);
      document.removeEventListener("click", onDocClick);
      document.removeEventListener("keydown", onKeydown);
    };
  }, [onOpenChange]);

  const circleStyle = {
    border: `2px solid ${color}`,
    color,
    backgroundColor: "color-mix(in srgb, var(--color-surface) 80%, transparent)",
  } as const;

  const cardStyle = {
    borderColor: color,
    backgroundColor: "color-mix(in srgb, var(--color-surface) 92%, transparent)",
    boxShadow: `0 12px 32px -8px ${color}`,
  } as const;

  return (
    <details ref={detailsRef} className="project-switcher group relative flex items-center">
      <summary
        aria-label={triggerLabel}
        className="relative z-10 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full transition-transform duration-200 hover:scale-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-(--color-brand)"
        style={circleStyle}
      >
        <NavIcon icon={triggerIcon} />
      </summary>

      <span
        className="scroll-dot-label project-switcher-label pointer-events-none absolute whitespace-nowrap rounded-lg px-3 py-1.5 font-body text-base font-semibold"
        style={{ backgroundColor: "#000622", color, boxShadow: `0 4px 16px -2px ${color}` }}
      >
        {triggerLabel}
      </span>

      <div className="project-switcher-shell z-40 flex items-stretch">
        <div
          className="project-switcher-panel flex items-stretch rounded-2xl border p-3 backdrop-blur"
          style={{ ...cardStyle, ["--switcher-scroll-color" as string]: color } as React.CSSProperties}
        >
          <ul className="project-switcher-grid flex flex-row gap-3 overflow-x-auto pb-1 md:grid md:grid-cols-2 md:overflow-x-hidden md:overflow-y-auto md:pb-0">
            {items.map((item) => (
              <li key={item.href} className="shrink-0">
                <a
                  href={item.href}
                  className="flex h-full w-36 flex-col gap-1 rounded-xl border border-border/60 bg-surface-muted/60 p-2 transition-colors duration-200 hover:border-(--color-brand) md:w-full"
                >
                  {item.imageSrc && (
                    <img
                      src={item.imageSrc}
                      alt=""
                      loading="lazy"
                      className="h-20 w-full rounded-lg object-cover"
                    />
                  )}
                  <span className="font-display text-sm font-bold leading-tight text-ink">{item.title}</span>
                  <span className="font-body text-xs" style={{ color }}>
                    {item.date}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>

        <a
          href={allHref}
          aria-label={allLabel}
          className="project-switcher-all flex w-20 shrink-0 flex-col items-center justify-center gap-2 rounded-xl border text-center backdrop-blur transition-colors duration-200 hover:border-(--color-brand)"
          style={cardStyle}
        >
          <NavIcon icon={allIcon} />
          <span className="project-switcher-all-label font-body text-xs font-semibold leading-tight">
            {allLabel}
          </span>
        </a>
      </div>
    </details>
  );
}
