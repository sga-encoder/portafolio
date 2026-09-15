import type { ReactNode } from "react";
import AdminDotNav, { type AdminSection } from "./AdminDotNav";
import type { ProjectCardData } from "../../lib/admin/projectCards";

interface Props {
  active: AdminSection;
  /** `true`: contenedor a `75vw` desde `md:` en vez de `max-w-4xl` (053, solo editor de detalle). */
  wide?: boolean;
  /** Proyectos del selector rápido del ítem "Proyectos" del dot-nav (054). */
  switcherProjects: ProjectCardData[];
  /** Proyecto actualmente abierto en `/admin/proyectos/[slug]` — se excluye del selector rápido. */
  currentSlug?: string;
  children: ReactNode;
}

export default function AdminLayout({ active, wide, switcherProjects, currentSlug, children }: Props) {
  return (
    <>
      <AdminDotNav active={active} switcherProjects={switcherProjects} currentSlug={currentSlug} />
      <div className={`mx-auto px-4 pt-8 pb-28 md:pb-8 ${wide ? "w-full md:w-[75vw]" : "max-w-4xl"}`}>
        {children}
      </div>
    </>
  );
}
