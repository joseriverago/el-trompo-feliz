# Backend: API REST de El Trompo Feliz

API en NestJS con TypeScript. Se despliega en Render y usa PostgreSQL en Neon.

## Comandos

| Comando | Para qué sirve |
|---|---|
| `npm install` | Instala las dependencias |
| `npm run start:dev` | Levanta la API en modo desarrollo en http://localhost:4000 |
| `npm run build` | Compila a `dist/` |
| `npm run start:prod` | Ejecuta la versión compilada (la que usa Render) |
| `npm test` | Pruebas unitarias con Vitest |
| `npm run lint` | Revisión de código con oxlint |

El puerto se toma de la variable `PORT`; si no existe, se usa 4000.
