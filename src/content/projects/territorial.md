---
title: Territorial
summary: "Sistema de valoración territorial hecho para la universidad: frontend en Angular + Tailwind CSS con mapas interactivos, conectado a un backend real hecho por la universidad."
coverImage: projects/territorial/cover
gallery:
  - image: projects/territorial/gallery-login
  - image: projects/territorial/gallery-mapa-interactivo
  - image: projects/territorial/gallery-mapa-de-seguimiento
  - image: projects/territorial/gallery-entidades
techStack:
  - Angular
  - Tailwind CSS
  - MapLibre GL
platforms:
  - desktop
links:
  repo: https://github.com/sga-encoder/territorial
  demo: https://territorial-blush.vercel.app/
steps:
  - text: Inicia sesión como administrador y explora la app.
    copyText:
      - value: admin@example.com
        label: Correo
      - value: Admin123*
        label: Contraseña
  - text: Abre el editor de demarcación y mira cómo se dibujan los polígonos de los barrios sobre el mapa.
  - text: Revisa el mapa de seguimiento de funcionarios y la gestión de entidades.
servers:
  - id: web
    name: Frontend
    kind: web
    company: vercel
    projectId: "prj_OZEu5FX1duGCaSdYFxwGr66uFU4Q"
    url: "https://territorial-blush.vercel.app/"
  - id: backend
    name: Backend
    kind: other
    company: render
    serviceId: "srv-dakedcgu01pc73ersu5g"
    url: "https://territorial-backend.onrender.com/"
  - id: db
    name: Base de datos (Neon)
    kind: database
    company: neon
    projectId: "rapid-firefly-86210308"
---

Territorial es un sistema de valoración territorial que hice para la universidad. Construí el frontend
en Angular con Tailwind CSS: mapas interactivos con MapLibre para delimitar barrios dibujando sus
polígonos y para seguir en tiempo real a los funcionarios en campo, además de la gestión de
departamentos, ciudades, comunas, entidades y usuarios. El backend lo hizo la universidad.

Tiene tres roles (administrador, funcionario y ciudadano) y las cuentas nuevas quedan pendientes hasta
que un administrador les asigna un rol.
