# El Trompo Feliz: tienda virtual de juguetes

Tienda en línea de juguetes. El cliente consulta el catálogo, crea su cuenta, arma su carrito y compra con un pago simulado que descuenta el stock.

Actividad 2 del curso Taller de Software IV (USIL, 2026-2). El proyecto se gestionó con Scrum en Jira y se modeló con 9 diagramas UML.

## Aplicación publicada

| Parte | URL |
|---|---|
| Tienda (frontend en Vercel) | https://el-trompo-feliz-jrivera.vercel.app |
| API (backend en Render) | https://el-trompo-feliz-api.onrender.com |
| Estado de la API y de la base de datos | https://el-trompo-feliz-api.onrender.com/salud |

Cada cambio integrado en `main` se publica de forma automática en Vercel y en Render. En el plan gratuito de Render, la primera petición después de 15 minutos sin visitas tarda alrededor de un minuto. Mientras tanto, la tienda muestra un aviso.

## Integrante

José Luis Rivera Gonzales: Product Owner, Scrum Master y Developer.

## Funcionalidades

**Release v1.0 · Compra en línea (terminada en el Sprint 2):**

| Historia | Qué puede hacer el cliente | Página |
|---|---|---|
| HU-01 | Ver el catálogo de juguetes con nombre, foto y precio; los agotados se marcan como «Agotado» | `/` |
| HU-02 | Ver el detalle de un juguete | `/juguetes/{id}` |
| HU-03 | Registrarse como cliente | `/registro` |
| HU-04 | Iniciar sesión; la sesión se mantiene 7 días | `/iniciar-sesion` |
| HU-05 | Agregar juguetes al carrito sin superar el stock | `/` y `/juguetes/{id}` |
| HU-06 | Cambiar cantidades y quitar juguetes del carrito | `/carrito` |
| HU-07 | Ver los subtotales y el total del carrito | `/carrito` |
| HU-08 | Ingresar los datos de entrega y generar el pedido | `/comprar` |
| HU-09 | Pagar el pedido con una tarjeta simulada; el pago aprobado descuenta el stock | `/pedidos/{numero}/pago` |

El pago es simulado: no se cobra nada ni se contacta a ningún banco. Una tarjeta que termina en `0000` se rechaza a propósito, para probar el caso de pago rechazado. Del pago solo se guardan los últimos 4 dígitos.

**Release v2.0 · Seguimiento y administración (pendiente, HU-10 a HU-20):** historial y estado de los pedidos, búsqueda y filtros del catálogo, cierre de sesión, y gestión de juguetes, categorías, stock y pedidos por el administrador. Está en el [Product Backlog](docs/scrum/product-backlog.md) para un Sprint 3, si el docente amplía el plazo.

## Tecnologías

| Capa | Tecnología | Despliegue |
|---|---|---|
| Frontend | Next.js 16 (App Router), React 19 y Tailwind CSS 4, en TypeScript | Vercel |
| Backend | API REST con NestJS 12 y TypeORM, en TypeScript. Sesión con JWT y contraseñas cifradas con bcrypt | Render |
| Base de datos | PostgreSQL 18 | Neon |
| Pruebas | Vitest (147 pruebas en el backend) | — |
| Modelado | PlantUML | — |

Las dos aplicaciones usan Node.js 24.

## API REST

| Método y ruta | Descripción | Requiere sesión |
|---|---|---|
| `GET /salud` | Estado de la API y de la base de datos | No |
| `GET /juguetes` | Catálogo de juguetes activos | No |
| `GET /juguetes/:id` | Detalle de un juguete | No |
| `POST /auth/registro` | Crea la cuenta de un cliente y devuelve la sesión | No |
| `POST /auth/inicio-sesion` | Inicia sesión y devuelve el token JWT | No |
| `GET /carrito` | Carrito del cliente con subtotales y total | Sí |
| `POST /carrito/items` | Agrega un juguete al carrito | Sí |
| `PATCH /carrito/items/:itemId` | Cambia la cantidad de una línea | Sí |
| `DELETE /carrito/items/:itemId` | Quita un juguete del carrito | Sí |
| `POST /pedidos` | Genera el pedido con los datos de entrega | Sí |
| `GET /pedidos/:numero` | Consulta un pedido del cliente | Sí |
| `POST /pedidos/:numero/pago` | Paga el pedido con la tarjeta simulada | Sí |

Las rutas que requieren sesión esperan la cabecera `Authorization: Bearer <token>`.

## Estructura del repositorio

```
el-trompo-feliz/
├── frontend/          Aplicación web (Next.js + Tailwind CSS)
├── backend/           API REST (NestJS + TypeORM)
└── docs/
    ├── scrum/         Product Backlog, Definición de Listo y de Terminado, importación a Jira,
    │                  Planning, Review y Retrospectiva de cada sprint
    ├── uml/           9 diagramas UML en PlantUML, con sus imágenes en uml/png
    └── evidencias/    Capturas de cada sprint: Jira, GitHub, la tienda en local y publicada
```

## Instalación y ejecución local

Requisitos: Node.js 24 y npm, y una base de datos PostgreSQL (el proyecto usa Neon).

**1. Backend** (queda en http://localhost:4000):

```bash
cd backend
npm install
cp .env.example .env      # completar DATABASE_URL, JWT_SECRET y los usuarios de prueba
npm run db:preparar       # crea las tablas y carga los datos semilla
npm run start:dev
```

**2. Frontend** (queda en http://localhost:3000):

```bash
cd frontend
npm install
npm run dev
```

El frontend llama a `http://localhost:4000` si no se define `NEXT_PUBLIC_API_URL`. Para otra API, se copia `frontend/.env.example` como `.env.local`.

**Pruebas y compilación:**

```bash
cd backend
npm test                  # 147 pruebas con Vitest
npm run build

cd ../frontend
npm run build
```

Las variables de entorno se documentan en el archivo `.env.example` de cada proyecto. Los archivos `.env` con valores reales nunca se suben al repositorio: en producción, los valores están solo en los paneles de Vercel y Render.

## Modelos UML

Los 9 diagramas están en [`docs/uml`](docs/uml/README.md), en PlantUML y en PNG:

1. Casos de uso
2. Clases de análisis
3. Paquetes
4. Clases de diseño
5. Subsistemas con interfaces
6. Secuencia (CU-07 Agregar al carrito, CU-09 Realizar compra y CU-12 Gestionar productos)
7. Componentes y artefactos
8. Despliegue (descriptor)
9. Despliegue (instancia)

## Gestión del proyecto

- Scrum en Jira, espacio **ETF**: épicas, historias de usuario, tareas técnicas, 2 sprints y las releases v1.0 y v2.0.
- Cada historia o tarea se desarrolla en una rama `feature/ETF-<número>-<descripción>` y se integra a `main` con un pull request.
- Cada commit cita la clave de Jira, por ejemplo: `ETF-28 crea la estructura del repositorio`.
- Documentos de Scrum:
  - [Product Backlog](docs/scrum/product-backlog.md) y [Definición de Listo y de Terminado](docs/scrum/definicion-de-listo-y-terminado.md).
  - Sprint 1 (21/11/2026): [Sprint Review](docs/scrum/sprint-1-review.md) y [Retrospectiva](docs/scrum/sprint-1-retrospectiva.md). Velocidad: 5 puntos.
  - Sprint 2 (22/11/2026): [Sprint Planning](docs/scrum/sprint-2-planning.md), [Sprint Review](docs/scrum/sprint-2-review.md) y [Retrospectiva](docs/scrum/sprint-2-retrospectiva.md). Velocidad: 24 puntos; con él se terminó la release v1.0.
- Las capturas de cada paso están en [`docs/evidencias/sprint-1`](docs/evidencias/sprint-1) y [`docs/evidencias/sprint-2`](docs/evidencias/sprint-2).
