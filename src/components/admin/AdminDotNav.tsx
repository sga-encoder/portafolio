import { useEffect, useRef, useState } from "react";
import { signOut } from "firebase/auth";
import { auth } from "../../lib/firebase";
import NavIcon from "../nav/NavIcon";
import { attachHoldToNavigate } from "../nav/holdToNavigate";
import ProjectSwitcherPanel from "../nav/ProjectSwitcherPanel";
import type { ProjectCardData } from "../../lib/admin/projectCards";
import { formatProjectDate } from "../../utils/projectDateLabel";
import {
  NAV_BAR_MOBILE,
  NAV_BAR_MOBILE_LIST,
  NAV_ITEM_HIT_AREA,
  NAV_RAIL_FRAME,
  NAV_RAIL_LIST,
} from "../nav/navRailClasses";
import { NavModeToggle, type NavMode } from "../nav/NavModeToggle";

export type AdminSection = "dashboard" | "estadisticas" | "proyectos" | "contenido" | "imagenes" | "servidores";

interface AdminNavItem {
  key: AdminSection;
  href: string;
  label: string;
  icon: "home" | "heart" | "folder" | "image" | "server" | "grid";
}

// "proyectos" no vive acá: en vez de un link directo, ese ítem despliega
// `ProjectSwitcherPanel` (mismo componente compartido con `ProjectDetailNav`
// del sitio público, ver `projectSwitcherItems` abajo), en su misma posición
// entre "estadisticas" e "imagenes".
const BEFORE_PROYECTOS: readonly AdminNavItem[] = [
  { key: "dashboard", href: "/admin", label: "Panel", icon: "home" },
  { key: "estadisticas", href: "/admin/estadisticas", label: "Estadísticas", icon: "heart" },
];
const AFTER_PROYECTOS: readonly AdminNavItem[] = [
  { key: "contenido", href: "/admin/contenido", label: "Contenido", icon: "grid" },
  { key: "imagenes", href: "/admin/imagenes", label: "Imágenes", icon: "image" },
  { key: "servidores", href: "/admin/servidores", label: "Servidores", icon: "server" },
];

const circleStyle = (color: string) =>
  ({
    border: `2px solid ${color}`,
    color,
    backgroundColor: "color-mix(in srgb, var(--color-surface) 80%, transparent)",
  }) as const;

const MUTED = "var(--color-ink-muted)";

interface Props {
  active: AdminSection;
  switcherProjects: ProjectCardData[];
  /** Proyecto actualmente abierto en `/admin/proyectos/[slug]` — se excluye del selector rápido. */
  currentSlug?: string;
  side?: "left" | "secondary";
  toggle?: {
    page: NavMode;
    enabled: boolean;
    onToggle: () => void;
  };
}

function NavLink({
  item,
  isActive,
  variant,
}: {
  item: AdminNavItem;
  isActive: boolean;
  variant: "desktop" | "mobile";
}) {
  const color = isActive ? "var(--color-brand)" : MUTED;
  if (variant === "desktop") {
    return (
      <li className="group relative flex items-center">
        <a
          href={item.href}
          aria-label={item.label}
          aria-current={isActive ? "page" : undefined}
          className="relative z-10 flex h-9 w-9 items-center justify-center rounded-full transition-transform duration-200 hover:scale-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-(--color-brand)"
          style={circleStyle(color)}
        >
          <NavIcon icon={item.icon} />
        </a>
        <span
          className="scroll-dot-label pointer-events-none absolute left-full ml-3 whitespace-nowrap rounded-lg px-3 py-1.5 font-body text-base font-semibold"
          style={{ backgroundColor: "#000622", color: "var(--color-brand)", boxShadow: "0 4px 16px -2px var(--color-brand)" }}
        >
          {item.label}
        </span>
      </li>
    );
  }
  return (
    <li className="group relative flex items-center">
      <a
        href={item.href}
        aria-label={item.label}
        aria-current={isActive ? "page" : undefined}
        data-hold-nav={item.href}
        className={NAV_ITEM_HIT_AREA}
      >
        <span
          className="flex h-9 w-9 items-center justify-center rounded-full transition-transform duration-200 active:scale-95"
          style={circleStyle(color)}
        >
          <NavIcon icon={item.icon} />
        </span>
      </a>
      <span
        className="scroll-dot-label pointer-events-none absolute bottom-full left-0 mb-2 whitespace-nowrap rounded-lg px-3 py-1.5 font-body text-base font-semibold"
        style={{ backgroundColor: "#000622", color: "var(--color-brand)", boxShadow: "0 4px 16px -2px var(--color-brand)" }}
      >
        {item.label}
      </span>
    </li>
  );
}

function LogoutItem({ variant }: { variant: "desktop" | "mobile" }) {
  const handleLogout = () => signOut(auth);
  if (variant === "desktop") {
    return (
      <li className="group relative flex items-center">
        <button
          type="button"
          aria-label="Cerrar sesión"
          onClick={handleLogout}
          className="relative z-10 flex h-9 w-9 items-center justify-center rounded-full transition-transform duration-200 hover:scale-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-(--color-brand)"
          style={circleStyle(MUTED)}
        >
          <NavIcon icon="logout" />
        </button>
        <span
          className="scroll-dot-label pointer-events-none absolute left-full ml-3 whitespace-nowrap rounded-lg px-3 py-1.5 font-body text-base font-semibold"
          style={{ backgroundColor: "#000622", color: MUTED, boxShadow: `0 4px 16px -2px ${MUTED}` }}
        >
          Cerrar sesión
        </span>
      </li>
    );
  }
  return (
    <li className="group relative flex items-center">
      <button type="button" aria-label="Cerrar sesión" onClick={handleLogout} className={NAV_ITEM_HIT_AREA}>
        <span
          className="flex h-9 w-9 items-center justify-center rounded-full transition-transform duration-200 active:scale-95"
          style={circleStyle(MUTED)}
        >
          <NavIcon icon="logout" />
        </span>
      </button>
      <span
        className="scroll-dot-label pointer-events-none absolute bottom-full left-0 mb-2 whitespace-nowrap rounded-lg px-3 py-1.5 font-body text-base font-semibold"
        style={{ backgroundColor: "#000622", color: MUTED, boxShadow: `0 4px 16px -2px ${MUTED}` }}
      >
        Cerrar sesión
      </span>
    </li>
  );
}

/**
 * Dot-nav de `/admin/*`: mismo mecanismo visual que `ScrollDotNav`/
 * `YearDotNav` (riel lateral fijo en desktop, píldora flotante inferior en
 * mobile, `navRailClasses.ts`), pero sin scroll-spy — las 5 secciones son
 * rutas reales distintas, no anclas de una sola página, así que el ítem
 * activo lo decide el prop `active` que `AdminGate`/`AdminLayout` ya
 * reciben. Sin fondo 3D en `/admin`, el color activo usa `--color-brand`
 * fijo en vez de `--sphere-left-color`/`--project-left-color`. "Proyectos"
 * despliega `ProjectSwitcherPanel` (`src/components/nav/`, compartido con
 * `ProjectDetailNav.astro` del sitio público — 054) en vez de navegar
 * directo; "Cerrar sesión" vive acá también como último ítem (acción, no
 * ruta — nunca se pinta "activo").
 */
export default function AdminDotNav({ active, switcherProjects, currentSlug, side = "left", toggle }: Props) {
  const mobileListRef = useRef<HTMLUListElement>(null);
  const desktopClassName =
    side === "secondary"
      ? "fixed left-20 top-1/2 z-50 hidden -translate-y-1/2 flex-col gap-4 md:left-28 md:flex"
      : "fixed left-4 top-1/2 z-40 hidden -translate-y-1/2 flex-col gap-4 md:left-6 md:flex";
  const isProyectosActive = active === "proyectos";
  // (076) El ítem "Proyectos" se mantiene activo también mientras su propio panel
  // esté abierto, sin importar la ruta actual — riel desktop y barra mobile son
  // `<details>` independientes, así que cada uno lleva su propio estado de apertura.
  const [proyectosOpenDesktop, setProyectosOpenDesktop] = useState(false);
  const [proyectosOpenMobile, setProyectosOpenMobile] = useState(false);
  const proyectosColorDesktop =
    isProyectosActive || proyectosOpenDesktop ? "var(--color-brand)" : MUTED;
  const proyectosColorMobile =
    isProyectosActive || proyectosOpenMobile ? "var(--color-brand)" : MUTED;
  const projectSwitcherItems = switcherProjects
    .filter((project) => project.slug !== currentSlug)
    .map((project) => ({
      href: `/admin/proyectos/${project.slug}`,
      title: project.title,
      date: formatProjectDate(project.date),
      imageSrc: project.imageSrc,
    }));

  useEffect(() => {
    const list = mobileListRef.current;
    if (!list) return;
    return attachHoldToNavigate(list, (href) => {
      window.location.href = href;
    });
  }, []);

  return (
    <>
      <nav aria-label="Navegación del panel de administración" className={desktopClassName}>
        <div className={NAV_RAIL_FRAME}>
          <ul className={NAV_RAIL_LIST}>
            {toggle && <NavModeToggle page={toggle.page} enabled={toggle.enabled} onToggle={toggle.onToggle} variant="desktop" placement="start" />}
            {BEFORE_PROYECTOS.map((item) => (
              <NavLink key={item.key} item={item} isActive={item.key === active} variant="desktop" />
            ))}
            <li className="relative flex items-center">
              <ProjectSwitcherPanel
                items={projectSwitcherItems}
                color={proyectosColorDesktop}
                allHref="/admin/proyectos"
                triggerIcon="folder"
                triggerLabel="Proyectos"
                onOpenChange={setProyectosOpenDesktop}
              />
            </li>
            {AFTER_PROYECTOS.map((item) => (
              <NavLink key={item.key} item={item} isActive={item.key === active} variant="desktop" />
            ))}
            <LogoutItem variant="desktop" />
          </ul>
        </div>
      </nav>

      <nav aria-label="Navegación del panel de administración" className={NAV_BAR_MOBILE}>
        <ul ref={mobileListRef} className={NAV_BAR_MOBILE_LIST}>
          {toggle && <NavModeToggle page={toggle.page} enabled={toggle.enabled} onToggle={toggle.onToggle} variant="mobile" placement="start" />}
          {BEFORE_PROYECTOS.map((item) => (
            <NavLink key={item.key} item={item} isActive={item.key === active} variant="mobile" />
          ))}
          <li className="relative flex items-center">
            <ProjectSwitcherPanel
              items={projectSwitcherItems}
              color={proyectosColorMobile}
              allHref="/admin/proyectos"
              triggerIcon="folder"
              triggerLabel="Proyectos"
              onOpenChange={setProyectosOpenMobile}
            />
          </li>
          {AFTER_PROYECTOS.map((item) => (
            <NavLink key={item.key} item={item} isActive={item.key === active} variant="mobile" />
          ))}
          <LogoutItem variant="mobile" />
        </ul>
      </nav>
    </>
  );
}
