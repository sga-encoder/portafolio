import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import AdminGate from "./AdminGate";

interface Props {
  slugs: string[];
}

// Separado de DashboardPanel a propósito: sus hooks (y el fetch a
// Firestore) solo deben correr una vez que AdminGate confirmó sesión —
// montar este componente como hijo de AdminGate logra eso; si el fetch
// viviera en el propio DashboardPanel (el que monta la página), se
// dispararía en cuanto carga la página, sin esperar el login.
function DashboardContent({ slugs }: Props) {
  const [totalLikes, setTotalLikes] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all(
      slugs.map(async (slug) => {
        const snap = await getDoc(doc(db, "projectLikes", slug));
        return (snap.data()?.count as number | undefined) ?? 0;
      }),
    ).then((counts) => {
      if (!cancelled) setTotalLikes(counts.reduce((sum, count) => sum + count, 0));
    });
    return () => {
      cancelled = true;
    };
  }, [slugs]);

  return (
    <>
      <h1 className="mb-6 text-2xl font-display font-bold">Panel principal</h1>
      <div className="grid grid-cols-2 gap-4 sm:max-w-md">
        <div className="rounded-2xl bg-surface-muted p-4">
          <p className="text-sm text-ink-muted">Proyectos</p>
          <p className="text-3xl font-display font-bold">{slugs.length}</p>
        </div>
        <div className="rounded-2xl bg-surface-muted p-4">
          <p className="text-sm text-ink-muted">Likes totales</p>
          <p className="text-3xl font-display font-bold">{totalLikes ?? "…"}</p>
        </div>
      </div>
    </>
  );
}

export default function DashboardPanel({ slugs }: Props) {
  return (
    <AdminGate active="dashboard">
      <DashboardContent slugs={slugs} />
    </AdminGate>
  );
}
