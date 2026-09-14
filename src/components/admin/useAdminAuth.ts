import { useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "../../lib/firebase";

// Estado de sesión para el panel /admin (feature 043). Solo comprueba "hay
// sesión o no" — quién puede ver datos de verdad lo decide Firestore
// (isAdmin() en firestore.rules), no este hook.
export type AdminAuthStatus = "loading" | "signedOut" | "signedIn";

export interface AdminAuthState {
  status: AdminAuthStatus;
  user: User | null;
}

export function useAdminAuth(): AdminAuthState {
  const [state, setState] = useState<AdminAuthState>({ status: "loading", user: null });

  useEffect(() => {
    return onAuthStateChanged(auth, (user) => {
      setState({ status: user ? "signedIn" : "signedOut", user });
    });
  }, []);

  return state;
}
