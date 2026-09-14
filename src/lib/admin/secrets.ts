import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

// Tokens de terceros (GitHub, Cloudinary Admin API) para el panel /admin
// (feature 043). Viven en Firestore (`adminSecrets/{service}`), pegados a
// mano por el autor desde la consola de Firebase — nunca en `.env`/
// `PUBLIC_*`, para no terminar en el bundle público. Solo el admin
// autenticado puede leerlos (ver firestore.rules). Cacheados en memoria por
// sesión de pestaña para no repetir el `getDoc` en cada acción.
const cache = new Map<string, unknown>();

export async function getSecret<T>(service: string): Promise<T> {
  if (cache.has(service)) return cache.get(service) as T;

  const snapshot = await getDoc(doc(db, "adminSecrets", service));
  if (!snapshot.exists()) {
    throw new Error(
      `Falta adminSecrets/${service} en Firestore — pégalo a mano desde la consola de Firebase (ver .claude/spec/features/043-panel-administrativo/plan.md).`,
    );
  }

  const data = snapshot.data() as T;
  cache.set(service, data);
  return data;
}
