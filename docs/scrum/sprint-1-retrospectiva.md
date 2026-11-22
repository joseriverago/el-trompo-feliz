# Retrospectiva: Sprint 1

**Producto:** Tienda virtual de juguetes «El Trompo Feliz»  
**Sprint:** ETF Sprint 1, 21/11/2026 (cerrado en Jira a las 23:52)  
**Fecha de la Retrospectiva:** después de la Sprint Review, en la noche del 21 al 22/11/2026  
**Equipo Scrum:** José Luis Rivera Gonzales (Product Owner, Scrum Master y Developer)  
**Formato:** qué salió bien, qué se puede mejorar y acciones concretas para el Sprint 2.

Los resultados del sprint (lo terminado, el burndown y la velocidad) están en la [Sprint Review](sprint-1-review.md).

---

## 1. Qué salió bien

- **La infraestructura quedó lista temprano.** En la primera hora y media del sprint quedaron el repositorio, la base de datos en Neon con datos semilla y el despliegue en Vercel y Render. Desde entonces, cada PR integrado en `main` se publica solo, y Vercel prueba cada PR antes de integrarlo.
- **El flujo de trabajo es trazable de punta a punta.** Cada actividad tuvo su rama `feature/ETF-…`, su pull request (10 en total) y commits con la clave de Jira. En Jira, cada actividad pasó por En curso y Terminado con un comentario que enlaza su PR.
- **Las historias se aceptaron con evidencia.** Cada criterio de aceptación de HU-01 y HU-02 se probó en la tienda publicada y tiene su captura en `docs/evidencias/sprint-1`.
- **La tienda prevé los casos de error.** El catálogo y el detalle muestran mensajes claros cuando la API de Render está despertando, cuando no responde, cuando no hay juguetes y cuando el juguete no existe.
- **El backend tiene pruebas automatizadas** (20 con Vitest), y el error encontrado en producción quedó cubierto por una prueba nueva.
- **Los diagramas coinciden con el código** y ya fijan los nombres de las clases que faltan construir (`AuthService`, `CarritoService`, `PedidosService`, `PagosService`, `JwtAuthGuard`…). Esto evita rehacer código o diagramas en el Sprint 2.
- **Ningún secreto llegó al repositorio:** la cadena de conexión y las contraseñas de prueba solo están en variables de entorno.

## 2. Qué se puede mejorar

| Problema | Causa | Efecto |
|---|---|---|
| Se comprometieron 29 puntos y se terminaron 5. | La velocidad de 30 puntos era una suposición, porque no había sprints anteriores. Además, el compromiso solo contó las historias y dejó fuera las 5 tareas técnicas, que ocuparon la mayor parte del sprint. | La meta del sprint no se cumplió y 7 historias pasan al Sprint 2. |
| El burndown no mostró el avance real. | Las tareas no llevan puntos. Desde las 19:45 la línea quedó plana, aunque se terminaron T-04 y T-05. | El gráfico no ayudó a ver a tiempo que el compromiso no se iba a cumplir. |
| Un error del catálogo apareció recién en producción: «Ábaco» salía después de la «Z». | El orden se pedía a la base de datos y Neon ordena por código de carácter. Las pruebas simulaban la base de datos, así que no podían detectarlo. | Hizo falta un PR extra (#7). Ahora `JuguetesService` ordena con `Intl.Collator('es')` y una prueba lo cubre. |
| Los diagramas UML llevaron varios intentos. | Ajustar la distribución de PlantUML (flechas que se cruzan, imágenes demasiado anchas, letra en negrita) costó varias vueltas por diagrama. | Quedó menos tiempo para las historias del carrito y la compra. |
| Las clases de análisis y de diseño se hicieron después de HU-01 y HU-02. | Se priorizó publicar el catálogo antes de modelar. | Funcionó porque las dos historias eran simples, pero el carrito, los pedidos y el pago tienen más reglas y conviene modelarlos antes de programarlos. |

## 3. Acciones para el Sprint 2

| # | Acción | Cómo se comprueba |
|---|---|---|
| 1 | **Comprometer según la capacidad real.** Primero las 7 historias de v1.0 que quedaron (24 puntos), y después historias de v2.0 en orden de prioridad, solo si hay capacidad. Dato para estimar: HU-01 y HU-02 (5 puntos) se programaron en unos 40 minutos, sin contar infraestructura ni diagramas; el carrito y el pago tienen más reglas. | En el Sprint 2 Planning queda escrita la capacidad estimada y los puntos comprometidos no la superan. |
| 2 | **Reservar tiempo para las tareas.** T-06, T-07 y T-08 se estiman en horas en el Sprint 2 Planning y ese tiempo se descuenta de la capacidad antes de elegir historias. | El Sprint 2 Planning lista las horas de cada tarea. |
| 3 | **Construir en el orden de las dependencias:** HU-03 y HU-04 primero, porque el carrito y la compra necesitan un cliente con sesión iniciada (`JwtAuthGuard`); luego HU-05 a HU-07 y al final HU-08 y HU-09. | El orden de los PR del Sprint 2 sigue esa secuencia. |
| 4 | **Probar con datos en español y contra la base de datos real:** nombres con tildes y eñe, correos en mayúsculas y direcciones peruanas en las pruebas del registro, del carrito y de los datos de entrega. Lo que depende de la base de datos (orden, correo único, descuento de stock) se prueba también en la URL pública, no solo con pruebas simuladas. | Las pruebas de HU-03 y HU-08 incluyen al menos un caso con tilde o eñe, y la evidencia de cada historia incluye la prueba en la URL pública. |
| 5 | **Hacer cada diagrama de secuencia junto con su historia** (CU-07 con HU-05, CU-09 con HU-08 y HU-09), con los nombres de las clases de diseño, y reutilizar `docs/uml/estilo.iuml` y las soluciones de distribución que ya funcionaron. | Los diagramas de T-06 usan los mismos nombres de métodos que el código. |

## 4. Revisión de las acciones anteriores

No aplica: es el primer sprint del equipo con este producto. Las acciones de la sección 3 se revisan en la Retrospectiva del Sprint 2.
