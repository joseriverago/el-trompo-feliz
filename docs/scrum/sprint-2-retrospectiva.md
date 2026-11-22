# Retrospectiva: Sprint 2

**Producto:** Tienda virtual de juguetes «El Trompo Feliz»  
**Sprint:** ETF Sprint 2, 22/11/2026 (se cierra en Jira al integrar T-08)  
**Fecha de la Retrospectiva:** 22/11/2026 por la tarde, después de la Sprint Review  
**Equipo Scrum:** José Luis Rivera Gonzales (Product Owner, Scrum Master y Developer)  
**Formato:** qué salió bien, qué se puede mejorar, acciones para un Sprint 3 y revisión de las acciones del Sprint 1.

Los resultados del sprint (lo terminado, el burndown y la velocidad) están en la [Sprint Review](sprint-2-review.md).

---

## 1. Qué salió bien

- **Se cumplió la meta y todo lo comprometido.** Se terminaron las 7 historias (24 puntos) y las 3 tareas, y con ellas la release v1.0. En el Sprint 1 se habían terminado 5 de 29 puntos.
- **El compromiso se basó en la capacidad real.** El Planning estimó cada actividad en horas, contó las tareas técnicas y comprometió solo lo que entraba en 10 a 11 horas.
- **El orden por dependencias evitó bloqueos.** Primero se construyó la sesión (HU-03 y HU-04), después el carrito (HU-05 a HU-07) y al final la compra (HU-08 y HU-09). Ninguna historia tuvo que esperar a otra.
- **Cada criterio se probó en local y en la tienda publicada**, con su captura en `docs/evidencias/sprint-2`. Los dos casos que no conviene repetir en producción (stock insuficiente y carrera por las últimas unidades) se provocaron en local y de forma controlada.
- **La seguridad se tuvo en cuenta desde el diseño:**
  - contraseñas con bcrypt;
  - un mensaje genérico cuando el inicio de sesión falla;
  - token JWT y `JwtAuthGuard` en las rutas del cliente;
  - del pago solo se guardan los últimos 4 dígitos, nunca el CVV;
  - restricciones `CHECK` e índice único parcial en la base de datos.

  La API se niega a arrancar sin `JWT_SECRET`, y eso detectó a tiempo la variable que faltaba en Render. Ningún secreto llegó al repositorio.
- **Las pruebas automatizadas pasaron de 20 a 147.** Usan datos en español: tildes, eñes, correos en mayúsculas y direcciones de Lima.
- **Los diagramas se hicieron junto con el código.** Los de secuencia 06a, 06b y 06c llegaron en el PR de su historia. Los de despliegue (08 y 09) se comprobaron con las cabeceras reales de Vercel y Render (`x-vercel-id`, `server: cloudflare`) y con los paneles de Neon. Al cerrar el sprint están los 9 diagramas que pide la actividad.

## 2. Qué se puede mejorar

| Problema | Causa | Efecto |
|---|---|---|
| HU-09 tomó 3 h 41 min, frente a 1,25 h estimadas. | La estimación no contó todo lo que trae un pago: la transacción que descuenta el stock, la carrera por las últimas unidades, el índice único parcial, la tarjeta de rechazo de prueba y la actualización de 5 diagramas. | T-06 y T-07 empezaron recién después de las 13:00. El sprint alcanzó porque otras historias tomaron menos de lo estimado. |
| La base de datos de Neon es la misma para local y producción. | En el Sprint 1 se creó una sola rama de Neon, y `backend/.env` apunta a ella. | Los clientes y pedidos de las pruebas locales quedaron en la base real. Para probar el criterio 4 de HU-08 hubo que bajar a mano el stock de un juguete real y restaurarlo después. |
| Las capturas no se integraron en el PR de cada actividad: cerca de 120 quedaron sin versionar hasta T-08, también algunas del Sprint 1. | Las capturas de producción y de Jira se toman después de integrar el PR, porque recién entonces se publica el cambio y se cierra la incidencia. Ya no queda un PR abierto donde subirlas. | Durante el sprint, el repositorio no mostraba toda la evidencia, y hubo que reunirla en un solo commit al final. |
| Los 4 commits de HU-08 citan «HU-08», pero no la clave `ETF-15`. | La clave se escribió en la rama y en el PR, pero no en los mensajes. Nada lo revisa antes de abrir el PR. | Un punto de la DoD no se cumplió en HU-08. Jira enlaza el trabajo solo por la rama y el PR. |
| El frontend no tiene pruebas automatizadas. | Se priorizaron las reglas del backend. Las validaciones de los formularios (registro, entrega y pago) se probaron a mano, con capturas. | Un error en los formularios solo se notaría probando a mano. La release v2.0 agrega más formularios, los de administración. |
| El burndown volvió a ocultar el avance de las tareas. | Las tareas técnicas no llevan puntos, igual que en el Sprint 1. | El gráfico llega a 0 a las 13:10, aunque T-06, T-07 y T-08 seguían en curso. |
| Los diagramas de despliegue y el de secuencia de CU-12 necesitaron varias vueltas de distribución. | PlantUML corta las imágenes de más de 4096 px, y Graphviz ubica mal los nodos anidados. Con Java 8 no se puede usar el motor ELK. | El diagrama 06d se dividió en 06d y 06e, y el 08 se rehízo varias veces. Las reglas que funcionaron (sin multiplicidades entre nodos anidados, sin `linetype ortho`, con `left to right direction`) no estaban escritas. |

## 3. Acciones para un Sprint 3

Se aplican si el docente amplía el plazo y se planifica un Sprint 3 para la release v2.0.

| # | Acción | Cómo se comprueba |
|---|---|---|
| 1 | **Separar la base de datos de desarrollo.** Crear una rama de desarrollo en Neon, prepararla con `npm run db:preparar` y apuntar a ella el `backend/.env` local. Producción queda solo para las pruebas en la URL pública. | Los pedidos de las pruebas locales del Sprint 3 no aparecen en la base de producción. |
| 2 | **Versionar las capturas a medida que se toman.** Las capturas locales van en el PR de su historia. Las de producción y de Jira van en un PR corto de evidencias apenas se cierra la incidencia, sin esperar al final del sprint. | Al cerrar el Sprint 3, `git status` no muestra capturas sin versionar. |
| 3 | **Revisar la clave de Jira antes de abrir cada PR**, con `git log main..HEAD`. Cada commit lleva `Refs ETF-…` en el asunto o en el cuerpo. | Ningún commit del Sprint 3 queda sin clave de Jira. |
| 4 | **Agregar pruebas al frontend** (Vitest y Testing Library) para las validaciones de los formularios de registro, entrega y pago, antes de construir los de administración. | `npm test` en `frontend` pasa y cubre los 3 formularios. |
| 5 | **Estimar con los datos reales de este sprint.** Las historias con transacción o reglas de concurrencia valen al menos el doble de horas que una historia de pantalla. La Review compara las horas estimadas con las reales, según los tiempos de En curso y Terminado en Jira. | La Sprint 3 Review tiene una tabla de horas estimadas y reales por actividad. |
| 6 | **Escribir las reglas de distribución de PlantUML** en `docs/uml/README.md`, para aplicarlas desde el primer intento: tamaño máximo, nodos anidados, dirección y división en vistas. | Los diagramas nuevos del Sprint 3 salen con una o dos renderizaciones. |

## 4. Revisión de las acciones del Sprint 1

| # | Acción del Sprint 1 | Resultado | Evidencia |
|---|---|---|---|
| 1 | Comprometer según la capacidad real | Cumplida | El [Planning](sprint-2-planning.md) escribió la capacidad (10 a 11 horas) y comprometió 24 puntos estimados en 10,5 horas. Se terminó todo. |
| 2 | Reservar tiempo para las tareas | Cumplida | El Planning estimó T-06 (1,5 h), T-07 (1,5 h) y T-08 (1 h) y descontó esas horas antes de elegir historias. |
| 3 | Construir en el orden de las dependencias | Cumplida | Los PR siguieron esa secuencia: #13 y #14 (sesión), #15 a #17 (carrito), #18 y #19 (compra). |
| 4 | Probar con datos en español y contra la base de datos real | Cumplida | Las pruebas de `AuthService` y `JwtAuthGuard` usan «Begoña Ñahui Ávila»; la del DTO de inicio de sesión, un correo en mayúsculas con espacios; y las de `PedidosService` y del DTO de entrega, «Av. Los Olivos 123, dpto. 302», en San Miguel. Cada historia tiene capturas en la URL pública. |
| 5 | Hacer cada diagrama de secuencia junto con su historia | Cumplida | 06a llegó en el PR #15 (HU-05), 06b en el #18 (HU-08) y 06c en el #19 (HU-09), con los mismos nombres de métodos que el código. Los de CU-12 (06d y 06e) se hicieron en T-06 (PR #20), porque esas historias son de la release v2.0. |
