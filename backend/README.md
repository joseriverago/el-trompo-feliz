# Backend: API REST de El Trompo Feliz

API en NestJS con TypeScript y TypeORM. Se despliega en Render y usa PostgreSQL en Neon.

## Configuración

1. Copia `.env.example` como `.env` y completa los valores. El archivo `.env` nunca se sube al repositorio.
2. `DATABASE_URL` es la cadena de conexión de Neon.
3. Ejecuta `npm run db:preparar` para crear las tablas y cargar los datos de prueba.

## Comandos

| Comando | Para qué sirve |
|---|---|
| `npm install` | Instala las dependencias |
| `npm run db:preparar` | Crea o actualiza las tablas y carga los datos semilla. Se puede repetir: solo agrega lo que falta |
| `npm run start:dev` | Levanta la API en modo desarrollo en http://localhost:4000 |
| `npm run build` | Compila a `dist/` |
| `npm run start:prod` | Ejecuta la versión compilada (la que usa Render) |
| `npm test` | Pruebas unitarias con Vitest (no necesitan base de datos) |
| `npm run test:e2e` | Pruebas de extremo a extremo contra la base de datos de `.env` |
| `npm run lint` | Revisión de código con oxlint |

## Variables de entorno

| Variable | Uso |
|---|---|
| `DATABASE_URL` | Cadena de conexión a PostgreSQL (Neon) |
| `PORT` | Puerto de la API; si no existe se usa 4000. Render asigna el suyo |
| `SEED_ADMIN_CORREO`, `SEED_ADMIN_CONTRASENA` | Administrador de prueba que crea `db:preparar` |
| `SEED_CLIENTE_CORREO`, `SEED_CLIENTE_CONTRASENA` | Cliente de prueba que crea `db:preparar` |

## Esquema de la base de datos

La API nunca modifica las tablas al iniciar (`synchronize: false`). El esquema se crea y actualiza con `npm run db:preparar`, que se ejecuta desde una computadora del equipo contra la base de datos de Neon.

## Rutas disponibles

| Método y ruta | Respuesta |
|---|---|
| `GET /` | Nombre y estado de la API |
| `GET /salud` | Comprueba la conexión con PostgreSQL; responde 503 si no hay conexión |
