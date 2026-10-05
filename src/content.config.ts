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
  // Botón que depende del mismo backend Render que "Ver demo" (ej. panel de admin de Strapi/Payload)
  // — si el proyecto tiene servers[] con company: "render", este botón queda bloqueado con el
  // mismo candado/cuenta regresiva hasta que el autor haga click en "Despertar backend" (080).
  // Sin servidores Render, se ignora y el botón se muestra normal.
  locked: z.boolean().default(false).optional(),
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
          z.object({
            image: z.string().refine(hasCloudinaryImage, {
              message: "cada imagen de gallery debe ser una clave existente en cloudinaryManifest.json",
            }),
            label: z.string().optional(),
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
      // Pone "Ver demo" antes de los pasos del autor cuando esos pasos se hacen dentro del demo
      // (ej. "crea una partida"). Con backend Render el demo ya va primero siempre (099).
      demoFirst: z.boolean().default(false),
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

// Traducción al inglés de `projects` (100), mismo slug de archivo. Solo textos: valores copiables,
// hrefs, imágenes y servidores siguen saliendo del Markdown en español; los pasos se combinan por
// índice (ver `localizeProjectEntry` en `src/i18n/content.ts`). Cuerpo = "Contexto" en inglés.
const projectsEn = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/projects-en" }),
  schema: () =>
    z.object({
      title: z.string().optional(),
      summary: z.string().optional(),
      steps: z
        .array(
          z.object({
            text: z.string().optional(),
            copyLabels: z.array(z.string()).optional(),
            buttonLabels: z.array(z.string()).optional(),
          }),
        )
        .optional(),
    }),
});

export const collections = { projects, projectContent, projectsEn };
