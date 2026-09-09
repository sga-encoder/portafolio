import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

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
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      summary: z.string(),
      coverImage: image(),
      gallery: z.array(image()).default([]),
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

export const collections = { projects };
