import type { ReactNode } from "react";
import { useAdminAuth } from "./useAdminAuth";
import LoginForm from "./LoginForm";
import AdminLayout from "./AdminLayout";
import type { AdminSection } from "./AdminDotNav";
import type { ProjectCardData } from "../../lib/admin/projectCards";

interface Props {
  active: AdminSection;
  /** Ancho `75vw` (md+) en vez de `max-w-4xl` — editor de detalle de `/admin/proyectos/[slug]` (053) y `/admin/contenido` (073). */
  wide?: boolean;
  /** Proyectos del selector rápido del ítem "Proyectos" del dot-nav (054). */
  switcherProjects: ProjectCardData[];
  /** Proyecto actualmente abierto en `/admin/proyectos/[slug]` — se excluye del selector rápido. */
  currentSlug?: string;
  children: ReactNode;
}

/** Gate de sesión + shell de navegación compartido por las 5 secciones del panel /admin (043). */
export default function AdminGate({ active, wide, switcherProjects, currentSlug, children }: Props) {
  const { status } = useAdminAuth();

  if (status === "loading") {
    return <div className="px-4 py-8 text-center text-ink-muted">Cargando…</div>;
  }

  if (status === "signedOut") {
    return <LoginForm />;
  }

  return (
    <AdminLayout active={active} wide={wide} switcherProjects={switcherProjects} currentSlug={currentSlug}>
      {children}
    </AdminLayout>
  );
}
