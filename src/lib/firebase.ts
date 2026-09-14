import { initializeApp } from "firebase/app";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Cliente de runtime (navegador) para el feature 040 (likes por proyecto).
// Nunca se importa desde frontmatter `.astro` (build-time) — solo desde el
// script de `ProjectLikeButton.astro`, que corre en el cliente.
const app = initializeApp({
  apiKey: import.meta.env.PUBLIC_FIREBASE_API_KEY,
  authDomain: import.meta.env.PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.PUBLIC_FIREBASE_PROJECT_ID,
  appId: import.meta.env.PUBLIC_FIREBASE_APP_ID,
});

// Opcional: sin site key configurada, el sitio sigue funcionando (el intento
// de like falla en silencio al escribir, como documenta el spec de 040).
//
// Guard de `document` necesario desde 043: los componentes del panel /admin
// importan este módulo desde React islands `client:load`, que Astro también
// ejecuta una vez en el servidor (Node, sin DOM) para generar el HTML
// inicial antes de hidratar — `initializeAppCheck` manipula el DOM
// (reCAPTCHA v3) y explota ahí si no se filtra por entorno.
//
// Proveedor debug en dev (agregado con 043, al probar el login del panel en
// local): la site key de reCAPTCHA v3 está atada al dominio de producción,
// así que en `localhost` la validación real siempre falla — y como este
// proyecto tiene App Check EXIGIDO para Authentication (no solo para
// Firestore), sin ningún token el login de /admin lo rechaza con
// `auth/firebase-app-check-token-is-invalid` (confirmado probando el panel
// en local). Saltarse `initializeAppCheck` por completo en dev, como se
// intentó primero, rompe el login en vez de arreglarlo. La solución oficial
// de Firebase para esto es el proveedor debug: un token fijo, sin relación
// con el dominio, que hay que registrar UNA VEZ en Firebase Console → Project
// Settings → App Check → esta app web → "Manage debug tokens" → pegar
// exactamente este valor. Solo corre en dev (`import.meta.env.DEV`) — el
// build de producción sigue usando reCAPTCHA v3 real, sin cambios.
const DEV_APP_CHECK_DEBUG_TOKEN = "db1315f7-042d-41dc-a249-5f30ec17389b";

const recaptchaSiteKey = import.meta.env.PUBLIC_FIREBASE_RECAPTCHA_SITE_KEY;
if (recaptchaSiteKey && typeof document !== "undefined") {
  if (import.meta.env.DEV) {
    (self as unknown as { FIREBASE_APPCHECK_DEBUG_TOKEN?: string | boolean }).FIREBASE_APPCHECK_DEBUG_TOKEN =
      DEV_APP_CHECK_DEBUG_TOKEN;
  }
  initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider(recaptchaSiteKey),
    isTokenAutoRefreshEnabled: true,
  });
}

export const db = getFirestore(app);

// Panel /admin (feature 043) — un único usuario, creado a mano en Firebase
// Auth. Ver .claude/spec/features/043-panel-administrativo/plan.md.
export const auth = getAuth(app);
