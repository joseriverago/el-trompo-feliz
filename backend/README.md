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
| `FRONTEND_URL` | URL del frontend que puede llamar a la API desde el navegador (CORS). Admite varias separadas por comas; por defecto `http://localhost:3000` |
| `SEED_ADMIN_CORREO`, `SEED_ADMIN_CONTRASENA` | Administrador de prueba que crea `db:preparar` |
| `SEED_CLIENTE_CORREO`, `SEED_CLIENTE_CONTRASENA` | Cliente de prueba que crea `db:preparar` |

## Esquema de la base de datos

La API nunca modifica las tablas al iniciar (`synchronize: false`). El esquema se crea y actualiza con `npm run db:preparar`, que se ejecuta desde una computadora del equipo contra la base de datos de Neon.

## Despliegue en Render

URL pública: https://el-trompo-feliz-api.onrender.com

Servicio web (*Web Service*) conectado al repositorio de GitHub. Cada cambio integrado en `main` se publica de forma automática.

| Ajuste | Valor |
|---|---|
| Rama | `main` |
| Directorio raíz (*Root Directory*) | `backend` |
| Entorno (*Runtime*) | Node (versión 24, tomada de `engines` en `package.json`) |
| Comando de compilación | `npm ci && npm run build` |
| Comando de inicio | `npm run start:prod` |
| Ruta de verificación (*Health Check Path*) | `/` |
| Variables de entorno | `DATABASE_URL` (cadena de Neon) y `FRONTEND_URL` (`https://el-trompo-feliz-jrivera.vercel.app`) |

La verificación usa `/` y no `/salud` para que Render no consulte la base de datos cada pocos segundos ni reinicie la API si Neon tarda en responder.

En el plan gratuito, el servicio se suspende tras 15 minutos sin visitas; la primera petición después de eso tarda alrededor de un minuto.

## Rutas disponibles

| Método y ruta | Respuesta |
|---|---|
| `GET /` | Nombre y estado de la API |
| `GET /salud` | Comprueba la conexión con PostgreSQL; responde 503 si no hay conexión |
| `GET /juguetes` | Catálogo: juguetes activos con su categoría, ordenados por nombre. `agotado` es `true` cuando el stock es 0 |
