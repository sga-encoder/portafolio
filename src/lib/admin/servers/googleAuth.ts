// Intercambia una cuenta de servicio de Google Cloud por un access token OAuth2, para que
// firebase.ts pueda llamar a Cloud Resource Manager/Firebase Hosting sin backend propio (046) —
// flujo estándar "JWT bearer" de Google (RFC 7523), firmado en el navegador con Web Crypto (mismo
// mecanismo que ya usa cloudinary.ts para firmar uploads, pero RS256 en vez de SHA-1 plano).
//
// Riesgo conocido, sin confirmar en esta sesión (sin cuenta de servicio real disponible): no está
// verificado que https://oauth2.googleapis.com/token acepte `fetch` desde un origen de navegador
// arbitrario (CORS) — ese endpoint está pensado sobre todo para uso servidor-a-servidor, a
// diferencia de las APIs REST de Vercel/Render/Neon. Si falla, `index.ts` lo captura y el servidor
// Firebase cae a estado "unknown" con el error visible, sin romper el resto del panel. Ver
// .claude/spec/features/046-panel-servidores/spec.md ("Riesgo conocido").

export interface GoogleServiceAccount {
  clientEmail: string;
  privateKey: string;
}

interface CachedToken {
  token: string;
  expiresAt: number;
}

const tokenCache = new Map<string, CachedToken>();

function base64UrlFromBytes(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlFromString(text: string): string {
  return base64UrlFromBytes(new TextEncoder().encode(text));
}

function pemToPkcs8(pem: string): ArrayBuffer {
  const clean = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\s+/g, "");
  const binary = atob(clean);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

export async function getGoogleAccessToken(account: GoogleServiceAccount, scope: string): Promise<string> {
  const cacheKey = `${account.clientEmail}:${scope}`;
  const cached = tokenCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now() + 30_000) return cached.token;

  const now = Math.floor(Date.now() / 1000);
  const header = base64UrlFromString(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = base64UrlFromString(
    JSON.stringify({
      iss: account.clientEmail,
      scope,
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    }),
  );
  const unsigned = `${header}.${claims}`;

  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemToPkcs8(account.privateKey),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(unsigned));
  const jwt = `${unsigned}.${base64UrlFromBytes(new Uint8Array(signature))}`;

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });
  if (!response.ok) throw new Error(`No se pudo obtener token de Google (${response.status})`);

  const data = (await response.json()) as { access_token: string; expires_in: number };
  tokenCache.set(cacheKey, { token: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 });
  return data.access_token;
}
