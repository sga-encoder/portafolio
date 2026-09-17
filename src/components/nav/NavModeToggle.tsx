import { useAdminAuth } from "../admin/useAdminAuth";
import NavIcon from "./NavIcon";
import { NAV_ITEM_HIT_AREA } from "./navRailClasses";

export type NavMode = "home" | "admin";

const circleStyle = (color: string) =>
  ({
    border: `2px solid ${color}`,
    color,
    backgroundColor: "color-mix(in srgb, var(--color-surface) 80%, transparent)",
  }) as const;

interface Props {
  page: NavMode;
  enabled: boolean;
  onToggle: () => void;
  variant?: "desktop" | "mobile";
  placement?: "start" | "end";
}

export function NavModeToggle({ page, enabled, onToggle, variant = "desktop", placement = "start" }: Props) {
  const { status } = useAdminAuth();

  if (status !== "signedIn") {
    return null;
  }

  const label = page === "home" ? "Menú admin" : "Menú inicio";
  const color = enabled ? "var(--color-brand)" : "var(--color-ink-muted)";
  const positionClass = placement === "start" ? "order-first" : "order-last";

  if (variant === "desktop") {
    return (
      <li className={`group relative flex items-center ${positionClass}`}>
        <button
          type="button"
          aria-label={label}
          onClick={onToggle}
          className="relative z-10 flex h-9 w-9 items-center justify-center rounded-full transition-transform duration-200 hover:scale-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-(--color-brand)"
          style={circleStyle(color)}
        >
          <NavIcon icon={page === "home" ? "folder" : "home"} />
        </button>
        <span
          className="scroll-dot-label pointer-events-none absolute left-full ml-3 whitespace-nowrap rounded-lg px-3 py-1.5 font-body text-base font-semibold"
          style={{ backgroundColor: "#000622", color, boxShadow: `0 4px 16px -2px ${color}` }}
        >
          {label}
        </span>
      </li>
    );
  }

  return (
    <li className={`group relative flex items-center ${positionClass}`}>
      <button
        type="button"
        aria-label={label}
        onClick={onToggle}
        className={NAV_ITEM_HIT_AREA}
      >
        <span
          className="flex h-9 w-9 items-center justify-center rounded-full transition-transform duration-200 active:scale-95"
          style={circleStyle(color)}
        >
          <NavIcon icon={page === "home" ? "folder" : "home"} />
        </span>
      </button>
      <span
        className="scroll-dot-label pointer-events-none absolute bottom-full left-0 mb-2 whitespace-nowrap rounded-lg px-3 py-1.5 font-body text-base font-semibold"
        style={{ backgroundColor: "#000622", color, boxShadow: `0 4px 16px -2px ${color}` }}
      >
        {label}
      </span>
    </li>
  );
}
