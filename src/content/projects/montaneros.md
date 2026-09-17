---
title: Montañeros
summary: Directorio turístico hecho como proyecto escolar, con backend en Payload CMS y frontend en Next.js.
coverImage: projects/proyecto-01
gallery:
  - image: projects/proyecto-01
techStack:
  - Next.js
  - Payload CMS
platforms:
  - mobile
  - desktop
links:
  repo: https://github.com/sga-encoder/montaneros-blog
  demo: https://montaneros.vercel.app/
steps:
  - text: Entra al panel de administración de Payload CMS para ver la interfaz y cómo se administra el contenido.
    copyText:
      - value: admin@example.com
        label: Correo
      - value: Admin123*
        label: Contraseña
    buttons:
      - label: Abrir panel de admin
        href: https://montaneros-cms-cpmn.onrender.com/admin
        locked: true
servers:
  - id: web
    name: Frontend
    kind: web
    company: vercel
    projectId: "prj_We8hjNxvQTWPqHwiOvdk2a9OzXKS"
    url: "https://montaneros.vercel.app/"
  - id: backend
    name: Backend (Payload CMS)
    kind: other
    company: render
    serviceId: "srv-dacrdlfavr4c739iaqj0"
    url: "https://montaneros-cms-cpmn.onrender.com/"
  - id: db
    name: Base de datos (MongoDB)
    kind: database
    company: generic
    url: "https://cloud.mongodb.com/v2/6a998fb8e9c9ef6e6ed5e62c#/overview"
---

Montañeros es un directorio turístico que construí para un proyecto escolar: el frontend está en Next.js
y el contenido se administra desde un backend/CMS en Payload
([repo del backend](https://github.com/sga-encoder/montaneros-cms)).

Fue un proyecto técnicamente difícil para mí en su momento, pero terminé muy contento con el resultado
final.
