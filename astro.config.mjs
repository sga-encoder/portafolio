// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';

import mdx from '@astrojs/mdx';

import sitemap from '@astrojs/sitemap';

import tailwindcss from '@tailwindcss/vite';

import cloudinarySync from './integrations/cloudinary-sync/index.js';

import devGitSync from './integrations/dev-git-sync/index.js';

import vercel from '@astrojs/vercel';

// https://astro.build/config
export default defineConfig({
  integrations: [react(), mdx(), sitemap(), cloudinarySync(), devGitSync()],

  // Vercel como host definitivo (045) — `output` se queda en 'static' (default):
  // todo el sitio sigue siendo estático en build-time salvo
  // src/pages/api/cloudinary-admin.ts, que pide render on-demand
  // (`prerender = false`) porque necesita correr server-side.
  adapter: vercel(),

  vite: {
    plugins: [tailwindcss()],
    // `js-yaml` solo lo importan islas del panel /admin (frontmatter.ts), que Vite descubre tarde:
    // re-optimizaba a mitad de sesión y la isla pedía el hash viejo (504 "Outdated Optimize Dep"),
    // dejando /admin/gestor colgado en "Cargando…" (088).
    optimizeDeps: {
      include: ['js-yaml']
    }
  }
});