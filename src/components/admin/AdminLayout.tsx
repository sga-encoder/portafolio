import type { ReactNode } from "react";
import { signOut } from "firebase/auth";
import { auth } from "../../lib/firebase";

interface Props {
  active: "dashboard" | "likes" | "proyectos" | "imagenes" | "servidores";
  /** `true`: contenedor a `75vw` desde `md:` en vez de `max-w-4xl` (053, solo editor de detalle). */
  wide?: boolean;
  children: ReactNode;
}

const NAV_ITEMS: { key: Props["active"]; label: string; href: string }[] = [
  { key: "dashboard", label: "Panel", href: "/admin" },
  { key: "likes", label: "Likes", href: "/admin/likes" },
  { key: "proyectos", label: "Proyectos", href: "/admin/proyectos" },
  { key: "imagenes", label: "Imágenes", href: "/admin/imagenes" },
  { key: "servidores", label: "Servidores", href: "/admin/servidores" },
];

export default function AdminLayout({ active, wide, children }: Props) {
  return (
    <div className={`mx-auto px-4 py-8 ${wide ? "w-full md:w-[75vw]" : "max-w-4xl"}`}>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <nav className="flex flex-wrap gap-2">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.key}
              href={item.href}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                item.key === active ? "bg-brand text-white" : "bg-surface-muted text-ink-muted hover:text-ink"
              }`}
            >
              {item.label}
            </a>
          ))}
        </nav>
        <button
          type="button"
          onClick={() => signOut(auth)}
          className="text-sm text-ink-muted hover:text-ink"
        >
          Cerrar sesión
        </button>
      </div>
      {children}
    </div>
  );
}
