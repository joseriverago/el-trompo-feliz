# El Trompo Feliz: tienda virtual de juguetes

Tienda en línea donde los clientes consultan el catálogo de juguetes, arman su carrito y compran con un pago simulado, y el administrador gestiona juguetes, categorías, stock y pedidos.

Actividad 2 del curso Taller de Software IV (USIL, 2026-2).

## Integrante

José Luis Rivera Gonzales: Product Owner, Scrum Master y Developer.

## Tecnologías

| Capa | Tecnología | Despliegue |
|---|---|---|
| Frontend | Next.js (App Router) + Tailwind CSS, en TypeScript | Vercel |
| Backend | API REST con NestJS + TypeORM, en TypeScript | Render |
| Base de datos | PostgreSQL | Neon |

## Estructura del repositorio

```
el-trompo-feliz/
├── frontend/      Aplicación web (Next.js + Tailwind CSS)
├── backend/       API REST (NestJS)
└── docs/
    ├── scrum/     Product Backlog, Definición de Listo y de Terminado, importación a Jira
    └── uml/       Diagramas UML en PlantUML
```

## Ejecución local

Requisitos: Node.js 20.9 o superior y npm.

**Backend** (queda en http://localhost:4000):

```bash
cd backend
npm install
npm run start:dev
```

**Frontend** (queda en http://localhost:3000):

```bash
cd frontend
npm install
npm run dev
```

Las variables de entorno se documentan en el archivo `.env.example` de cada proyecto. Los archivos `.env` con valores reales nunca se suben al repositorio.

## Gestión del proyecto

- Scrum en Jira, espacio **ETF**: épicas, historias de usuario, sprints y releases.
- Cada historia o tarea se desarrolla en una rama `feature/ETF-<número>-<descripción>` y se integra a `main` con un pull request.
- Cada commit cita la clave de Jira, por ejemplo: `ETF-28 crea la estructura del repositorio`.

## Aplicación publicada

Pendiente: se publica en la tarea ETF-30.
