export type NavIconName =
  | "home"
  | "gear"
  | "folder"
  | "user"
  | "heart"
  | "image"
  | "server"
  | "logout"
  | "layers"
  | "grid";

interface Props {
  icon: NavIconName;
}

/**
 * Equivalente React de `NavIcon.astro` (usado por `ProjectDetailNav`), para
 * los dot-nav construidos como componentes React (`ScrollDotNav`,
 * `YearDotNav`) que no pueden importar un componente `.astro`. El ícono
 * `home` comparte el mismo `path` que `NavIcon.astro` para que "Inicio" y
 * "volver al inicio" se vean idénticos entre los 3 navs.
 */
export default function NavIcon({ icon }: Props) {
  if (icon === "home") {
    return (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
        <path
          d="M4 11.5 12 4l8 7.5M6 9.5V20h12V9.5"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (icon === "gear") {
    return (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth={2} />
        <path
          d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"
          stroke="currentColor"
          strokeWidth={1.6}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (icon === "folder") {
    return (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
        <path
          d="M3 7a1 1 0 0 1 1-1h4.5l2 2H20a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7z"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (icon === "user") {
    return (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
        <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth={2} />
        <path
          d="M5 20c0-3.5 3-6 7-6s7 2.5 7 6"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (icon === "heart") {
    return (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
        <path
          d="M12 20s-7-4.35-9.5-8.8C1 8.1 2.4 5 5.6 5c1.9 0 3.3 1 4.4 2.6C11.1 6 12.5 5 14.4 5 17.6 5 19 8.1 21.5 11.2 19 15.65 12 20 12 20z"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (icon === "image") {
    return (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
        <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth={2} />
        <circle cx="8.5" cy="9.5" r="1.5" stroke="currentColor" strokeWidth={2} />
        <path
          d="m4 17 5-5 4 4 3-3 4 4"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (icon === "server") {
    return (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
        <rect x="3" y="4" width="18" height="6" rx="1.5" stroke="currentColor" strokeWidth={2} />
        <rect x="3" y="14" width="18" height="6" rx="1.5" stroke="currentColor" strokeWidth={2} />
        <circle cx="7" cy="7" r="1" fill="currentColor" />
        <circle cx="7" cy="17" r="1" fill="currentColor" />
      </svg>
    );
  }

  if (icon === "logout") {
    return (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
        <path
          d="M15 4H6a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h9"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M20 12H10m10 0-3.5-3.5M20 12l-3.5 3.5"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  // "layers"/"grid": mismos paths que `NavIcon.astro` (usado por
  // `ProjectDetailNav`) — icónos del selector rápido de proyectos
  // (`ProjectSwitcherPanel`, compartido entre el sitio público y `/admin`).
  if (icon === "layers") {
    return (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
        <polygon points="12 4 21 9 12 14 3 9" stroke="currentColor" strokeWidth={2} strokeLinejoin="round" />
        <polyline
          points="3 14 12 19 21 14"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
      <rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth={2} />
      <rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth={2} />
      <rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth={2} />
      <rect x="14" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth={2} />
    </svg>
  );
}
