---
title: Territorial
summary: Proyecto hecho para la universidad, con un mapa interactivo (Next.js + Tailwind CSS) y datos persistidos en un backend real (no construido por mí).
coverImage: projects/proyecto-01
gallery:
  - image: projects/proyecto-01
techStack:
  - Next.js
  - Tailwind CSS
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
  - text: "Prueba el sistema de atajos de teclado: mantén presionado Ctrl + Alt."
  - text: Regístrate y crea tus propias cuentas de estudiante y de maestro para entrar con esos roles (no hay credenciales demo fijas para esos roles, hay que crearlas).
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
  - id: db
    name: Base de datos (Neon)
    kind: database
    company: neon
    projectId: "rapid-firefly-86210308"
---

Territorial es un proyecto que hice para la universidad: una plataforma con un mapa interactivo para
visualizar y explorar información territorial. El frontend (Next.js + Tailwind CSS) es lo que yo
construí; los datos persisten en un backend real conectado a una base de datos en Neon, que no
desarrollé yo.

Reutiliza el mismo sistema de roles de otro proyecto mío (Class Manager): hay una cuenta de administrador
para gestionar el contenido, y puedes registrarte como estudiante o como profesor para explorar la
plataforma con esos roles.
