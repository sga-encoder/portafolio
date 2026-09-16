---
title: "Class Manager"
summary: "Aplicación para gestionar clases, cursos y estudiantes, hecha con React, con datos persistidos en un backend real (no construido por mí)."
coverImage: "projects/class-manager/cover"
gallery:
  - image: "projects/class-manager/gallery-login"
  - image: "projects/class-manager/gallery-dashboard-admin"
  - image: "projects/class-manager/gallery-dashboard-teachers"
  - image: "projects/class-manager/gallery-dashboard-student"
techStack:
  - "React"
platforms:
  - "desktop"
links:
  repo: "https://github.com/sga-encoder/proyecto-react"
  demo: "https://class-manager-puce.vercel.app/"
steps:
  - text: "Inicia sesión como administrador y explora la app."
    copyText:
      - value: "admin@example.com"
        label: "Correo"
      - value: "Admin123*"
        label: "Contraseña"
  - text: "Prueba el sistema de atajos de teclado: mantén presionado Ctrl + Alt."
  - text: "Regístrate y crea tus propias cuentas de estudiante y de maestro para entrar con esos roles (no hay credenciales demo fijas para esos roles, hay que crearlas)."
servers:
  - id: web
    name: Frontend
    kind: web
    company: vercel
    projectId: "prj_E1dW9Sqa6R1iWsVFNGQjq3Y8kNLC"
    url: "https://class-manager-puce.vercel.app/"
  - id: db
    name: Base de datos (Neon)
    kind: database
    company: neon
    projectId: "wild-mode-90239400"
---

Class Manager es una aplicación para gestionar clases, cursos, estudiantes y demás — de esta versión solo
construí el frontend en React; los datos persisten en un backend real conectado a una base de datos en
Neon, que no desarrollé yo.
