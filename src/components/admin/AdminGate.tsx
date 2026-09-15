import type { ReactNode } from "react";
import { useAdminAuth } from "./useAdminAuth";
import LoginForm from "./LoginForm";
import AdminLayout from "./AdminLayout";

interface Props {
  active: "dashboard" | "likes" | "contenido" | "imagenes" | "servidores";
  children: ReactNode;
}

/** Gate de sesión + shell de navegación compartido por las 4 secciones del panel /admin (043). */
export default function AdminGate({ active, children }: Props) {
  const { status } = useAdminAuth();

  if (status === "loading") {
    return <div className="px-4 py-8 text-center text-ink-muted">Cargando…</div>;
  }

  if (status === "signedOut") {
    return <LoginForm />;
  }

  return <AdminLayout active={active}>{children}</AdminLayout>;
}
