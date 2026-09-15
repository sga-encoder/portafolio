import { collection, doc, documentId, getDoc, getDocs, query, where, type Timestamp } from "firebase/firestore";
import { db } from "../firebase";

// Estadísticas por proyecto para /admin/estadisticas (057): junta likes (040),
// visitas totales/última visita (055) y 2 datos nuevos — visitas del
// último mes (subcolección projectViews/{slug}/days) y fecha de
// creación/actualización (adminDrafts/{slug}, ya existente desde 043).
export interface ProjectStats {
  likes: number;
  views: number;
  monthlyViews: number;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
  lastVisit: Timestamp | null;
}

function daysAgoKey(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

// Los ids de projectViews/{slug}/days son "YYYY-MM-DD", que ordena igual
// lexicográfica que cronológicamente — evita traer todo el histórico.
async function getMonthlyViews(slug: string): Promise<number> {
  const cutoff = daysAgoKey(30);
  const daysQuery = query(collection(db, "projectViews", slug, "days"), where(documentId(), ">=", cutoff));
  const snap = await getDocs(daysQuery);
  return snap.docs.reduce((sum, docSnap) => sum + ((docSnap.data().count as number | undefined) ?? 0), 0);
}

export async function getProjectStats(slug: string): Promise<ProjectStats> {
  // Cada lectura se resuelve de forma independiente (mismo criterio que el
  // fix de 055): si una falla (ej. `days` sin desplegar todavía en las
  // Security Rules) no debe dejar sin datos al resto de la tarjeta.
  const [likesResult, viewsResult, monthlyResult, draftResult] = await Promise.allSettled([
    getDoc(doc(db, "projectLikes", slug)),
    getDoc(doc(db, "projectViews", slug)),
    getMonthlyViews(slug),
    getDoc(doc(db, "adminDrafts", slug)),
  ]);

  if (likesResult.status === "rejected") console.error(`No se pudieron leer los likes de ${slug}`, likesResult.reason);
  if (viewsResult.status === "rejected") console.error(`No se pudieron leer las visitas de ${slug}`, viewsResult.reason);
  if (monthlyResult.status === "rejected")
    console.error(`No se pudieron leer las visitas del último mes de ${slug}`, monthlyResult.reason);
  if (draftResult.status === "rejected")
    console.error(`No se pudieron leer las fechas de publicación de ${slug}`, draftResult.reason);

  return {
    likes: likesResult.status === "fulfilled" ? ((likesResult.value.data()?.count as number | undefined) ?? 0) : 0,
    views: viewsResult.status === "fulfilled" ? ((viewsResult.value.data()?.count as number | undefined) ?? 0) : 0,
    monthlyViews: monthlyResult.status === "fulfilled" ? monthlyResult.value : 0,
    createdAt: draftResult.status === "fulfilled" ? ((draftResult.value.data()?.createdAt as Timestamp | undefined) ?? null) : null,
    updatedAt:
      draftResult.status === "fulfilled" ? ((draftResult.value.data()?.publishedAt as Timestamp | undefined) ?? null) : null,
    lastVisit:
      viewsResult.status === "fulfilled" ? ((viewsResult.value.data()?.lastVisit as Timestamp | undefined) ?? null) : null,
  };
}
