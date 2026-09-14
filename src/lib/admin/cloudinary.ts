import { getSecret } from "./secrets";

// Subir/borrar imágenes desde el panel /admin (feature 043), mismo espacio
// de nombres (`portafolio/{key}`) que ya usa la sincronización local por
// watcher (`integrations/cloudinary-sync`, feature 036) — ambos caminos
// conviven sobre el mismo manifest. Ver
// .claude/spec/features/043-panel-administrativo/plan.md.

interface CloudinarySecret {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
}

async function sign(params: Record<string, string>, apiSecret: string): Promise<string> {
  const toSign =
    Object.keys(params)
      .sort()
      .map((key) => `${key}=${params[key]}`)
      .join("&") + apiSecret;
  const digest = await crypto.subtle.digest("SHA-1", new TextEncoder().encode(toSign));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export interface CloudinaryUploadResult {
  publicId: string;
  url: string;
  width: number;
  height: number;
  format: string;
}

export async function uploadImage(file: File, key: string): Promise<CloudinaryUploadResult> {
  const { cloudName, apiKey, apiSecret } = await getSecret<CloudinarySecret>("cloudinary");
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const publicId = `portafolio/${key}`;
  const paramsToSign = { overwrite: "true", public_id: publicId, timestamp };
  const signature = await sign(paramsToSign, apiSecret);

  const form = new FormData();
  form.append("file", file);
  form.append("api_key", apiKey);
  form.append("timestamp", timestamp);
  form.append("signature", signature);
  form.append("public_id", publicId);
  form.append("overwrite", "true");

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: "POST",
    body: form,
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Cloudinary: no se pudo subir la imagen (${response.status}) — ${body}`);
  }

  const data = (await response.json()) as {
    public_id: string;
    secure_url: string;
    width: number;
    height: number;
    format: string;
  };
  return {
    publicId: data.public_id,
    url: data.secure_url,
    width: data.width,
    height: data.height,
    format: data.format,
  };
}

export async function destroyImage(publicId: string): Promise<void> {
  const { cloudName, apiKey, apiSecret } = await getSecret<CloudinarySecret>("cloudinary");
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signature = await sign({ public_id: publicId, timestamp }, apiSecret);

  const form = new FormData();
  form.append("public_id", publicId);
  form.append("api_key", apiKey);
  form.append("timestamp", timestamp);
  form.append("signature", signature);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`, {
    method: "POST",
    body: form,
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Cloudinary: no se pudo borrar la imagen (${response.status}) — ${body}`);
  }
}
