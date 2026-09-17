import {
  NAV_BAR_MOBILE_LIST,
  NAV_BAR_MOBILE_SECONDARY,
  NAV_BAR_MOBILE_TERTIARY,
  NAV_ITEM_HIT_AREA,
  NAV_RAIL_DESKTOP_SECONDARY,
  NAV_RAIL_FRAME,
  NAV_RAIL_LIST,
} from "./navRailClasses";
import { useAdminNavState } from "./AdminNavBridge";

const circleStyle = (color: string) =>
  ({
    border: `2px solid ${color}`,
    color,
    backgroundColor: "color-mix(in srgb, var(--color-surface) 80%, transparent)",
  }) as const;

const MUTED = "var(--color-ink-muted)";

export interface SubPageDotNavItem {
  key: string;
  /** Texto corto (2-3 caracteres) dentro del punto — ej. "PF", "26". */
  dotLabel: string;
  /** Nombre completo, mostrado en el tooltip al hacer hover (desktop). */
  label: string;
}

interface Props {
  ariaLabel: string;
  items: SubPageDotNavItem[];
  activeKey: string | null;
  onSelect: (key: string) => void;
}

/**
 * Dot-nav de sub-páginas (081): mismo mecanismo visual que `AdminDotNav`/`YearDotNav` (riel lateral
 * fijo en desktop, barra fija en mobile, `navRailClasses.ts`) pero para las 3 páginas de `/admin`
 * que tienen sub-páginas propias (Proyectos → años, Contenido → Secciones/Habilidades/Carrusel/
 * Animación 3D, Imágenes → Portafolio/Otros proyectos). Reemplaza el submenú de píldoras
 * (`rounded-full` tipo botón) que usaban antes esas 3 páginas — el usuario pidió que se vea igual
 * al dot-nav principal, como un segundo riel/barra al lado del de `AdminDotNav`, no una fila de
 * botones bajo el título. Sin ícono (a diferencia de `AdminDotNav`): el texto corto ya identifica
 * la sub-página, mismo criterio que los años de `YearDotNav`.
 */
export default function SubPageDotNav({ ariaLabel, items, activeKey, onSelect }: Props) {
  const { showHomeNav } = useAdminNavState();
  if (items.length < 2) return null;

  const desktopClassName = showHomeNav
    ? "fixed left-40 top-1/2 z-30 hidden -translate-y-1/2 flex-col gap-4 md:left-48 md:flex"
    : NAV_RAIL_DESKTOP_SECONDARY;
  const mobileClassName = showHomeNav ? NAV_BAR_MOBILE_TERTIARY : NAV_BAR_MOBILE_SECONDARY;

  return (
    <>
      <nav aria-label={ariaLabel} className={desktopClassName}>
        <div className={NAV_RAIL_FRAME}>
          <ul className={NAV_RAIL_LIST}>
            {items.map((item) => {
              const isActive = item.key === activeKey;
              const color = isActive ? "var(--color-brand)" : MUTED;
              return (
                <li key={item.key} className="group relative flex items-center">
                  <button
                    type="button"
                    aria-label={item.label}
                    aria-current={isActive ? "true" : undefined}
                    onClick={() => onSelect(item.key)}
                    className="relative z-10 flex h-9 w-9 items-center justify-center rounded-full font-body text-xs font-semibold transition-transform duration-200 hover:scale-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-(--color-brand)"
                    style={circleStyle(color)}
                  >
                    {item.dotLabel}
                  </button>
                  <span
                    className="scroll-dot-label pointer-events-none absolute left-full ml-3 whitespace-nowrap rounded-lg px-3 py-1.5 font-body text-base font-semibold"
                    style={{ backgroundColor: "#000622", color: "var(--color-brand)", boxShadow: "0 4px 16px -2px var(--color-brand)" }}
                  >
                    {item.label}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>

      <nav aria-label={ariaLabel} className={mobileClassName}>
        <ul className={NAV_BAR_MOBILE_LIST}>
          {items.map((item) => {
            const isActive = item.key === activeKey;
            const color = isActive ? "var(--color-brand)" : MUTED;
            return (
              <li key={item.key} className="relative flex items-center">
                <button
                  type="button"
                  aria-label={item.label}
                  aria-current={isActive ? "true" : undefined}
                  onClick={() => onSelect(item.key)}
                  className={NAV_ITEM_HIT_AREA}
                >
                  <span
                    className="flex h-9 w-9 items-center justify-center rounded-full font-body text-xs font-semibold transition-transform duration-200 active:scale-95"
                    style={circleStyle(color)}
                  >
                    {item.dotLabel}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
