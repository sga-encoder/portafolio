import type { ReactNode } from "react";
import { signOut } from "firebase/auth";
import { auth } from "../../lib/firebase";

interface Props {
  active: "dashboard" | "likes" | "contenido" | "imagenes";
  children: ReactNode;
}

const NAV_ITEMS: { key: Props["active"]; label: string; href: string }[] = [
  { key: "dashboard", label: "Panel", href: "/admin" },
  { key: "likes", label: "Likes", href: "/admin/likes" },
  { key: "contenido", label: "Contenido", href: "/admin/contenido" },
  { key: "imagenes", label: "Imágenes", href: "/admin/imagenes" },
];

export default function AdminLayout({ active, children }: Props) {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
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
