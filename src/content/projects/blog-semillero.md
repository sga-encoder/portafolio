---
title: Blog del Semillero 3
summary: Blog hecho para un semillero de investigación universitario, para mostrar sus avances (Next.js + Strapi).
coverImage: projects/blog-semillero/cover
gallery:
  - image: projects/blog-semillero/gallery-inicio
  - image: projects/blog-semillero/gallery-blog
  - image: projects/blog-semillero/gallery-admin-panel
  - image: projects/blog-semillero/gallery-map
techStack:
  - JavaScript
  - Next.js
  - Strapi.js
platforms:
  - mobile
  - desktop
links:
  repo: https://github.com/sga-encoder/blog-semillero
  demo: https://blog-semillero.vercel.app/
steps:
  - text: El backend está en un hosting gratuito y puede tardar unos segundos en despertar.
    copyText: []
    buttons:
      - label: Despertar backend
        href: https://blog-semillero-strapi.onrender.com/
  - text: Entra al panel de administración de Strapi para ver la interfaz y cómo se administra el contenido.
    copyText:
      - value: admin@example.com
        label: Correo
      - value: Admin123*
        label: Contraseña
    buttons:
      - label: Abrir panel de admin
        href: https://blog-semillero-strapi.onrender.com/admin
sphereMovement:
  header:
    a:
      screenFraction: 1.3
---

Este blog lo construí para un semillero de investigación universitario, como una forma de publicar y
mostrar sus avances. El frontend está en Next.js y el contenido se administra desde un backend/CMS en
Strapi ([repo del backend](https://github.com/sga-encoder/blog-semillero-strapi)).

Ahora mismo la demo muestra información de prueba, no los avances reales del semillero todavía.
