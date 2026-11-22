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
| `JWT_SECRET` | Clave para firmar los JWT de la sesión, de 32 caracteres o más y distinta en cada entorno. Sin ella la API no arranca |
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
| Variables de entorno | `DATABASE_URL` (cadena de Neon), `FRONTEND_URL` (`https://el-trompo-feliz-jrivera.vercel.app`) y `JWT_SECRET` (una clave propia de producción) |

La verificación usa `/` y no `/salud` para que Render no consulte la base de datos cada pocos segundos ni reinicie la API si Neon tarda en responder.

En el plan gratuito, el servicio se suspende tras 15 minutos sin visitas; la primera petición después de eso tarda alrededor de un minuto.

## Rutas disponibles

| Método y ruta | Respuesta |
|---|---|
| `GET /` | Nombre y estado de la API |
| `GET /salud` | Comprueba la conexión con PostgreSQL; responde 503 si no hay conexión |
| `GET /juguetes` | Catálogo: juguetes activos con su categoría, ordenados por nombre. `agotado` es `true` cuando el stock es 0 |
| `GET /juguetes/:id` | Detalle de un juguete activo, con su descripción. Responde 404 «Juguete no encontrado» si no existe, está desactivado o el id no es un número |
| `POST /auth/registro` | Registra un cliente con `nombre`, `correo` y `contrasena` (8 caracteres o más). Responde 201 con `{ token, usuario }` (sesión iniciada), 400 con `errores` por campo o 409 «Este correo ya está registrado». El correo se guarda en minúsculas y la contraseña cifrada con bcrypt |
| `POST /auth/inicio-sesion` | Inicia sesión con `correo` y `contrasena`. Responde 200 con `{ token, usuario }`, 400 con `errores` por campo si falta un dato, o 401 «Correo o contraseña incorrectos», el mismo mensaje si el correo no existe o si la contraseña no coincide |
| `GET /carrito` | Carrito del cliente con sesión iniciada (cabecera `Authorization: Bearer <token>`): `items` con precio, cantidad y subtotal, `unidades` y `total`. Si todavía no tiene carrito, lo crea vacío. Responde 401 «Inicia sesión para continuar» sin un token válido |
| `POST /carrito/items` | Agrega una unidad del juguete `jugueteId` al carrito; si ya estaba, suma 1 a su línea. Responde 200 con el carrito, 400 si falta el juguete, 401 sin sesión, 404 «Juguete no encontrado» o 409 «Solo quedan N unidades» si no hay stock |
| `PATCH /carrito/items/:itemId` | Cambia la cantidad de una línea del carrito con `{ cantidad }`. Responde 200 con el carrito, 400 «La cantidad debe ser un número entero de 1 o más», 401 sin sesión, 404 «Este juguete ya no está en tu carrito» si la línea no es del carrito del cliente, o 409 «Solo quedan N unidades» si supera el stock |
| `DELETE /carrito/items/:itemId` | Quita una línea del carrito. Responde 200 con el carrito sin ella, 401 sin sesión o 404 «Este juguete ya no está en tu carrito» |
