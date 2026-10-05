import { LANG_STORAGE_KEY, switchLangPath, type Lang } from "../../i18n/config";
import { useTranslations } from "../../i18n/ui";
import { NAV_ITEM_HIT_AREA } from "./navRailClasses";

const COLOR = "var(--color-ink-muted)";

const circleStyle = {
  border: `2px solid ${COLOR}`,
  color: COLOR,
  backgroundColor: "color-mix(in srgb, var(--color-surface) 80%, transparent)",
} as const;

interface Props {
  lang: Lang;
  variant?: "desktop" | "mobile";
}

/**
 * Toggle de idioma ES/EN (100), último ítem del riel de `ScrollDotNav` (Inicio) y de `SiteMainNav`
 * (`/proyectos*`). Muestra el código del idioma al que lleva, guarda la elección (la detección
 * automática de `BaseLayout` la respeta desde entonces) y navega a la misma página en el otro
 * idioma conservando el `#ancla`. Carga completa a propósito, no View Transition: la escena 3D y
 * los textos de las islas se montan de cero en el idioma nuevo.
 */
export function LangToggle({ lang, variant = "desktop" }: Props) {
  const target: Lang = lang === "es" ? "en" : "es";
  const label = useTranslations(lang)("nav.langToggle");

  const onClick = () => {
    try {
      localStorage.setItem(LANG_STORAGE_KEY, target);
    } catch {
      // Sin storage (modo privado estricto) el cambio igual funciona, solo no se recuerda.
    }
    window.location.href = switchLangPath(window.location.pathname, target) + window.location.hash;
  };

  const code = <span className="font-display text-xs font-bold leading-none">{target.toUpperCase()}</span>;

  if (variant === "desktop") {
    return (
      <li className="group relative flex items-center">
        <button
          type="button"
          aria-label={label}
          lang={target}
          onClick={onClick}
          className="relative z-10 flex h-9 w-9 items-center justify-center rounded-full transition-transform duration-200 hover:scale-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-(--color-brand)"
          style={circleStyle}
        >
          {code}
        </button>
        <span
          className="scroll-dot-label pointer-events-none absolute left-full ml-3 whitespace-nowrap rounded-lg px-3 py-1.5 font-body text-base font-semibold"
          style={{ backgroundColor: "#000622", color: COLOR, boxShadow: `0 4px 16px -2px ${COLOR}` }}
        >
          {label}
        </span>
      </li>
    );
  }

  return (
    <li className="group relative flex items-center">
      <button type="button" aria-label={label} lang={target} onClick={onClick} className={NAV_ITEM_HIT_AREA}>
        <span
          className="flex h-9 w-9 items-center justify-center rounded-full transition-transform duration-200 active:scale-95"
          style={circleStyle}
        >
          {code}
        </span>
      </button>
    </li>
  );
}
