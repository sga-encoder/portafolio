import type { ReactNode } from "react";
import { useAdminAuth } from "./useAdminAuth";
import LoginForm from "./LoginForm";
import AdminLayout from "./AdminLayout";

interface Props {
  active: "dashboard" | "likes" | "proyectos" | "imagenes" | "servidores";
  /** Ancho `75vw` (md+) en vez de `max-w-4xl` — solo lo usa el editor de detalle de `/admin/proyectos/[slug]` (053). */
  wide?: boolean;
  children: ReactNode;
}

/** Gate de sesión + shell de navegación compartido por las 5 secciones del panel /admin (043). */
export default function AdminGate({ active, wide, children }: Props) {
  const { status } = useAdminAuth();

  if (status === "loading") {
    return <div className="px-4 py-8 text-center text-ink-muted">Cargando…</div>;
  }

  if (status === "signedOut") {
    return <LoginForm />;
  }

  return (
    <AdminLayout active={active} wide={wide}>
      {children}
    </AdminLayout>
  );
}
