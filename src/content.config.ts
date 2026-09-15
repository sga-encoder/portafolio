import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";
import { hasCloudinaryImage } from "./utils/cloudinaryManifest";

const copyItem = z.object({
  value: z.string(),
  label: z.string().optional(),
});

const projectButton = z.object({
  label: z.string(),
  href: z.string().url(),
});

const step = z.object({
  text: z.string(),
  copyText: z.array(copyItem).default([]).optional(),
  buttons: z.array(projectButton).default([]).optional(),
});

// Override opcional por proyecto de la posición/tamaño de una esfera del fondo 3D en una zona
// (ver `projectSceneStops.ts`) — cualquier campo ausente hereda el valor compartido.
const sphereAxisOverride = z
  .object({
    x: z.number(),
    y: z.number(),
    screenFraction: z.number(),
  })
  .partial();

const sphereZoneOverride = z
  .object({
    a: sphereAxisOverride.optional(),
    b: sphereAxisOverride.optional(),
  })
  .partial();

// Servidores por proyecto (feature 046) — de dónde saca el panel /admin/servidores el estado en
// vivo de cada uno. Unión discriminada por `company`: cada empresa exige justo los ids de
// recurso que su API necesita (nunca credenciales — esas viven en Firestore `adminSecrets/{company}`,
// ver src/lib/admin/servers/). `generic` es el fallback mientras una empresa no está soportada o
// el autor solo quiere anotar un servidor sin integración automática.
const serverBase = {
  id: z.string(),
  name: z.string(),
  kind: z.enum(["web", "database", "other"]).default("web"),
  url: z.string().url().optional(),
};

const server = z.discriminatedUnion("company", [
  z.object({ ...serverBase, company: z.literal("vercel"), projectId: z.string(), teamId: z.string().optional() }),
  z.object({ ...serverBase, company: z.literal("render"), serviceId: z.string() }),
  z.object({ ...serverBase, company: z.literal("neon"), projectId: z.string() }),
  z.object({ ...serverBase, company: z.literal("firebase"), projectId: z.string(), siteId: z.string().optional() }),
  z.object({ ...serverBase, company: z.literal("generic") }),
]);

const projects = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/projects" }),
  schema: () =>
    z.object({
      title: z.string(),
      summary: z.string(),
      coverImage: z.string().refine(hasCloudinaryImage, {
        message: "coverImage debe ser una clave existente en cloudinaryManifest.json",
      }),
      gallery: z
        .array(
          z.string().refine(hasCloudinaryImage, {
            message: "cada elemento de gallery debe ser una clave existente en cloudinaryManifest.json",
          }),
        )
        .default([]),
      techStack: z.array(z.string()).default([]),
      platforms: z.array(z.enum(["mobile", "desktop"])).min(1),
      steps: z.array(step).min(1).max(5),
      links: z
        .object({
          repo: z.string().url().optional(),
          demo: z.string().url().optional(),
        })
        .default({}),
      // Override opcional por proyecto del fondo 3D de `/proyectos/[slug]` — ausente, se usa el
      // color autoextraído de `coverImage` (`getCloudinaryColors`) y la coreografía compartida de
      // `projectSceneStops.ts`. Ver 044-editor-visual-contenido-proyectos/plan.md.
      sphereColors: z.tuple([z.string(), z.string()]).optional(),
      sphereMovement: z
        .object({
          header: sphereZoneOverride.optional(),
          content: sphereZoneOverride.optional(),
          gallery: sphereZoneOverride.optional(),
        })
        .optional(),
      servers: z.array(server).default([]),
    }),
});

const projectContent = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/project-content" }),
  schema: () => z.object({}),
});

export const collections = { projects, projectContent };
