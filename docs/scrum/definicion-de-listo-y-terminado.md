# Definición de Listo y Definición de Terminado

**Producto:** Tienda virtual de juguetes «El Trompo Feliz»
**Equipo Scrum:** José Luis Rivera Gonzales (Product Owner, Scrum Master y Developer)
**Versión:** borrador para revisión del Product Owner, 21/11/2026

Estos son los dos acuerdos de calidad del equipo:

- La **Definición de Listo** se revisa en el refinamiento del backlog y en el Sprint Planning. Una historia que no la cumple no entra al sprint.
- La **Definición de Terminado** se revisa antes de mover una historia a la columna **Terminado** de Jira. Una historia que no la cumple vuelve a **En curso**.

---

## Definición de Listo (Definition of Ready)

Una historia de usuario puede entrar a un sprint cuando cumple **todo** lo siguiente:

- [ ] Está redactada con el formato **Como / Quiero / Para**, desde un actor del sistema: visitante, cliente o administrador.
- [ ] Tiene **criterios de aceptación verificables**, escritos como **Dado / Cuando / Entonces**.
- [ ] Cumple **INVEST**. En particular, es lo bastante pequeña para terminarse dentro del sprint (5 puntos de historia o menos).
- [ ] Está **estimada en puntos de historia** con Planning Poker.
- [ ] Está **vinculada a su épica** y **ordenada en el backlog** según su valor para el negocio.
- [ ] Sus **dependencias están resueltas** o planificadas en el mismo sprint (por ejemplo, los datos semilla o una historia previa).
- [ ] Se sabe **qué caso de uso realiza**, para mantener la trazabilidad con el modelo de casos de uso.

---

## Definición de Terminado (Definition of Done)

Una historia de usuario está terminada cuando cumple **todo** lo siguiente:

### Funcionalidad

- [ ] Cumple **todos sus criterios de aceptación**, probados en la aplicación.
- [ ] Valida los datos **en el navegador y en el servidor**, y muestra mensajes comprensibles cuando hay un error.
- [ ] Los datos se **guardan en la base de datos PostgreSQL** (Neon) y se conservan al recargar la página.

### Código

- [ ] Está escrito en **TypeScript** y **compila sin errores** (`npm run build` en `frontend/` y en `backend/`).
- [ ] Se desarrolló en una **rama propia** y se integró a `main` mediante un **pull request**.
- [ ] Los **commits citan la clave de Jira** de la historia, por ejemplo: `ETF-12 agrega el formulario de datos de entrega`.
- [ ] El repositorio **no contiene contraseñas, claves ni cadenas de conexión**; esos valores van solo en variables de entorno.

### Despliegue y documentación

- [ ] El incremento está **desplegado** (frontend en Vercel y backend en Render) y se **verificó en la URL pública**.
- [ ] Los **diagramas UML afectados** (clases de diseño, secuencia, componentes) están actualizados y **coinciden con el código**.
- [ ] La historia está en la columna **Terminado** de Jira.
