// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';

import mdx from '@astrojs/mdx';

import sitemap from '@astrojs/sitemap';

import tailwindcss from '@tailwindcss/vite';

import cloudinarySync from './integrations/cloudinary-sync/index.js';

// https://astro.build/config
export default defineConfig({
  integrations: [react(), mdx(), sitemap(), cloudinarySync()],

  vite: {
    plugins: [tailwindcss()]
  }
});