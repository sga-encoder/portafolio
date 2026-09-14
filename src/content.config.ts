import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";
import { hasCloudinaryImage } from "./utils/cloudinaryManifest";

const copyItem = z.object({
  value: z.string(),
  label: z.string().optional(),
});

const step = z
  .object({
    text: z.string(),
    copyText: z.array(copyItem).default([]).optional(),
    actionLabel: z.string().optional(),
    actionHref: z.string().url().optional(),
  })
  .refine((value) => Boolean(value.actionLabel) === Boolean(value.actionHref), {
    message: "actionLabel y actionHref deben definirse juntos",
  });

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
    }),
});

const projectContent = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/project-content" }),
  schema: () => z.object({}),
});

export const collections = { projects, projectContent };
