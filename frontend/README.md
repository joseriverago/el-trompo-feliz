# Frontend: aplicación web de El Trompo Feliz

Aplicación en Next.js (App Router) con Tailwind CSS y TypeScript. Se despliega en Vercel.

## Comandos

| Comando | Para qué sirve |
|---|---|
| `npm install` | Instala las dependencias |
| `npm run dev` | Levanta la aplicación en modo desarrollo en http://localhost:3000 |
| `npm run build` | Genera la versión de producción |
| `npm start` | Ejecuta la versión de producción |
| `npm run lint` | Revisión de código con ESLint |

## Variables de entorno

| Variable | Uso |
|---|---|
| `NEXT_PUBLIC_API_URL` | URL de la API. Si no existe se usa `http://localhost:4000` |

Next.js incrusta las variables `NEXT_PUBLIC_*` al compilar: si se cambia en Vercel, hay que volver a desplegar.

## Despliegue en Vercel

URL de producción: https://el-trompo-feliz-jrivera.vercel.app

Proyecto conectado al repositorio de GitHub. Cada cambio integrado en `main` se publica en producción, y cada pull request genera una vista previa.

| Ajuste | Valor |
|---|---|
| Directorio raíz (*Root Directory*) | `frontend` |
| *Framework Preset* | Next.js (detectado de forma automática) |
| Versión de Node | 24, tomada de `engines` en `package.json` |
| Variable de entorno | `NEXT_PUBLIC_API_URL` con la URL del backend en Render |

## Páginas

| Ruta | Contenido |
|---|---|
| `/` | Catálogo de juguetes (HU-01): imagen, nombre, precio en soles, categoría y edad recomendada. Los juguetes sin stock se marcan «Agotado» |

El catálogo se carga en el navegador desde `GET /juguetes`. Mientras la API de Render despierta muestra un aviso de carga, y si no responde ofrece el botón «Reintentar».
