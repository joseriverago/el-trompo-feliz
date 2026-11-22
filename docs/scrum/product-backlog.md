# Product Backlog: El Trompo Feliz

**Producto:** Tienda virtual de juguetes «El Trompo Feliz»  
**Curso:** Taller de Software IV, Actividad 2 (USIL, 2026-2)  
**Espacio en Jira:** El Trompo Feliz - Tienda Virtual (clave `ETF`)  
**Versión:** borrador para revisión del Product Owner, 21/11/2026

Este documento y el archivo [`jira-historias.csv`](jira-historias.csv) contienen las mismas historias. Los acuerdos de calidad están en [`definicion-de-listo-y-terminado.md`](definicion-de-listo-y-terminado.md).

---

## 1. Equipo Scrum

| Rol | Integrante | Responsabilidad |
|---|---|---|
| Product Owner | José Luis Rivera Gonzales | Define el objetivo del producto, ordena el backlog por valor y acepta cada historia según sus criterios de aceptación. |
| Scrum Master | José Luis Rivera Gonzales | Organiza los eventos de Scrum (Planning, Daily, Review y Retrospectiva), cuida el uso de Jira y resuelve los impedimentos. |
| Developer | José Luis Rivera Gonzales | Modela, construye, prueba y despliega el incremento, con apoyo supervisado de herramientas de inteligencia artificial. |

El equipo tiene un solo integrante, que asume las tres responsabilidades que define Scrum.

## 2. Objetivo del producto

> Que los clientes de El Trompo Feliz compren juguetes en línea viendo el stock real y sigan el estado de sus pedidos, y que la tienda administre su catálogo, su stock y sus pedidos desde un solo lugar, sin anotaciones a mano ni hojas de cálculo.

| Problema actual | Cómo lo resuelve el producto |
|---|---|
| Los pedidos se anotan a mano. | Cada compra genera un pedido con número único, datos de entrega y estado. |
| El stock se controla en una hoja de cálculo. | El stock vive en la base de datos y se descuenta con cada pago aprobado. |
| Con frecuencia se ofrecen productos agotados. | El catálogo marca «Agotado» y el carrito y el pago validan el stock disponible. |
| El cliente no sabe en qué va su pedido. | El cliente ve el estado de cada pedido: Pendiente, Pagado, Enviado o Entregado. |

## 3. Glosario del dominio

Estos nombres se usan igual en las historias, en los diagramas UML y en el código.

| Término | Significado | Nombre en el código |
|---|---|---|
| Visitante | Persona que navega por la tienda sin iniciar sesión. | (usuario no autenticado) |
| Cliente | Persona registrada que compra en la tienda. | `Usuario` con `rol = CLIENTE` |
| Administrador | Personal de la tienda que gestiona el catálogo, el stock y los pedidos. | `Usuario` con `rol = ADMINISTRADOR` |
| Juguete (producto) | Artículo que vende la tienda. Los casos de uso dicen «producto», como el enunciado. | `Juguete` |
| Categoría | Grupo de juguetes, por ejemplo Peluches o Didácticos. | `Categoria` |
| Edad recomendada | Rango de edad en años para el que se recomienda el juguete. | `edadMinima`, `edadMaxima` |
| Stock | Unidades disponibles de un juguete. | `stock` |
| Carrito | Juguetes que el cliente piensa comprar; se guarda en la base de datos. | `Carrito`, `ItemCarrito` |
| Pedido | Compra generada desde el carrito, con número único. | `Pedido`, `DetallePedido` |
| Datos de entrega | Quién recibe, teléfono, dirección, distrito y referencia. | `DatosEntrega` |
| Pago simulado | Pago con una tarjeta de prueba, sin pasarela real. | `Pago` |
| Estado del pedido | Pendiente → Pagado → Enviado → Entregado. | `EstadoPedido`: `PENDIENTE`, `PAGADO`, `ENVIADO`, `ENTREGADO` |

## 4. Épicas

Se crean a mano en Jira **en este orden**, antes de importar las historias, para que tomen las claves ETF-1 a ETF-7. El archivo CSV vincula cada historia con su épica usando esa clave.

| Clave esperada | Épica | Alcance | Historias | Puntos |
|---|---|---|---|---|
| ETF-1 | Catálogo de juguetes | Listado, búsqueda, filtros y página de detalle de los juguetes. | HU-01, HU-02, HU-16, HU-17 | 12 |
| ETF-2 | Cuentas de cliente | Registro, inicio de sesión y cierre de sesión. | HU-03, HU-04, HU-18 | 7 |
| ETF-3 | Carrito de compras | Agregar juguetes, cambiar cantidades, quitar, calcular subtotales y total, y validar el stock. | HU-05, HU-06, HU-07 | 8 |
| ETF-4 | Compra y pago simulado | Datos de entrega, generación del pedido, pago simulado y descuento del stock. | HU-08, HU-09 | 10 |
| ETF-5 | Pedidos del cliente | Historial de pedidos y estado de cada pedido. | HU-10, HU-11 | 4 |
| ETF-6 | Administración del catálogo | Registro, edición y eliminación de juguetes y categorías, y actualización del stock. | HU-12, HU-13, HU-19, HU-20 | 13 |
| ETF-7 | Administración de pedidos | Consulta de todos los pedidos y cambio de su estado. | HU-14, HU-15 | 6 |

## 5. Historias de usuario ordenadas por valor

El número de cada historia (HU-01, HU-02…) sigue el orden de valor para el negocio. Como el CSV las crea en ese orden, el backlog de Jira queda ordenado por valor desde el inicio. La clave esperada supone que antes solo se crearon las 7 épicas.

| Orden | HU | Clave esperada | Historia | Épica | Pts | Prioridad | Release | Sprint | Caso de uso |
|---|---|---|---|---|---|---|---|---|---|
| 1 | HU-01 | ETF-8 | Ver el catálogo de juguetes | Catálogo | 3 | Más alta | v1.0 | 1 | CU-01 |
| 2 | HU-02 | ETF-9 | Ver el detalle de un juguete | Catálogo | 2 | Más alta | v1.0 | 1 | CU-02 |
| 3 | HU-03 | ETF-10 | Registrarme como cliente | Cuentas | 3 | Más alta | v1.0 | 1 | CU-04 |
| 4 | HU-04 | ETF-11 | Iniciar sesión | Cuentas | 3 | Más alta | v1.0 | 1 | CU-05 |
| 5 | HU-05 | ETF-12 | Agregar un juguete al carrito | Carrito | 3 | Más alta | v1.0 | 1 | CU-07 |
| 6 | HU-06 | ETF-13 | Cambiar cantidades y quitar juguetes del carrito | Carrito | 3 | Alta | v1.0 | 1 | CU-08 |
| 7 | HU-07 | ETF-14 | Ver subtotales y total del carrito | Carrito | 2 | Alta | v1.0 | 1 | CU-08 |
| 8 | HU-08 | ETF-15 | Ingresar los datos de entrega y generar el pedido | Compra | 5 | Más alta | v1.0 | 1 | CU-09 |
| 9 | HU-09 | ETF-16 | Pagar el pedido con pago simulado | Compra | 5 | Más alta | v1.0 | 1 | CU-09, CU-10 |
| 10 | HU-10 | ETF-17 | Consultar mi historial de pedidos | Pedidos del cliente | 2 | Alta | v2.0 | 2 | CU-11 |
| 11 | HU-11 | ETF-18 | Ver el detalle y el estado de un pedido | Pedidos del cliente | 2 | Alta | v2.0 | 2 | CU-11 |
| 12 | HU-12 | ETF-19 | Registrar y editar juguetes | Admin. catálogo | 5 | Alta | v2.0 | 2 | CU-12 |
| 13 | HU-13 | ETF-20 | Actualizar el stock | Admin. catálogo | 3 | Alta | v2.0 | 2 | CU-14 |
| 14 | HU-14 | ETF-21 | Consultar los pedidos de la tienda | Admin. pedidos | 3 | Alta | v2.0 | 2 | CU-15 |
| 15 | HU-15 | ETF-22 | Cambiar el estado de un pedido | Admin. pedidos | 3 | Alta | v2.0 | 2 | CU-15 |
| 16 | HU-16 | ETF-23 | Buscar juguetes por nombre | Catálogo | 2 | Media | v2.0 | 2 | CU-03 |
| 17 | HU-17 | ETF-24 | Filtrar juguetes por categoría, edad y precio | Catálogo | 5 | Media | v2.0 | 2 | CU-03 |
| 18 | HU-18 | ETF-25 | Cerrar sesión | Cuentas | 1 | Media | v2.0 | 2 | CU-06 |
| 19 | HU-19 | ETF-26 | Gestionar categorías | Admin. catálogo | 3 | Media | v2.0 | 2 | CU-13 |
| 20 | HU-20 | ETF-27 | Eliminar juguetes | Admin. catálogo | 2 | Media | v2.0 | 2 | CU-12 |
| | | | **Total** | | **60** | | | | |

## 6. Detalle de las historias

### HU-01 · Ver el catálogo de juguetes

**Clave esperada:** ETF-8 · **Épica:** ETF-1 Catálogo de juguetes · **Puntos:** 3 · **Prioridad:** Más alta · **Release:** v1.0 (Sprint 1) · **Caso de uso:** CU-01 Consultar catálogo

> Como **visitante**, quiero **ver el listado de juguetes de la tienda**, para **conocer qué juguetes puedo comprar**.

**Criterios de aceptación**

1. Dado que existen juguetes registrados, cuando ingreso al catálogo, entonces veo de cada juguete su imagen, nombre, precio en soles (S/ con dos decimales), categoría y edad recomendada.
2. Dado que un juguete tiene stock 0, cuando aparece en el catálogo, entonces se muestra con la etiqueta «Agotado» y sin el botón «Agregar al carrito».
3. Dado que no hay juguetes registrados, cuando ingreso al catálogo, entonces veo el mensaje «Por ahora no hay juguetes disponibles».

### HU-02 · Ver el detalle de un juguete

**Clave esperada:** ETF-9 · **Épica:** ETF-1 Catálogo de juguetes · **Puntos:** 2 · **Prioridad:** Más alta · **Release:** v1.0 (Sprint 1) · **Caso de uso:** CU-02 Ver detalle de juguete

> Como **visitante**, quiero **ver la página de detalle de un juguete**, para **conocer su descripción y disponibilidad antes de comprarlo**.

**Criterios de aceptación**

1. Dado que estoy en el catálogo, cuando hago clic en un juguete, entonces veo su página de detalle con imagen, nombre, descripción, precio, categoría, edad recomendada y unidades disponibles.
2. Dado que el juguete tiene stock 0, cuando veo su detalle, entonces se muestra «Agotado» y no puedo agregarlo al carrito.
3. Dado que ingreso la dirección de un juguete que no existe, cuando carga la página, entonces veo el mensaje «Juguete no encontrado» y un enlace para volver al catálogo.

### HU-03 · Registrarme como cliente

**Clave esperada:** ETF-10 · **Épica:** ETF-2 Cuentas de cliente · **Puntos:** 3 · **Prioridad:** Más alta · **Release:** v1.0 (Sprint 1) · **Caso de uso:** CU-04 Registrarse

> Como **visitante**, quiero **crear una cuenta con mi nombre, correo y contraseña**, para **poder comprar y consultar mis pedidos**.

**Criterios de aceptación**

1. Dado que completo mi nombre, un correo válido y una contraseña de al menos 8 caracteres, cuando envío el formulario, entonces se crea mi cuenta como cliente y quedo con la sesión iniciada.
2. Dado que el correo ya está registrado, cuando envío el formulario, entonces veo el mensaje «Este correo ya está registrado» y no se crea otra cuenta.
3. Dado que dejo campos vacíos o el correo no es válido, cuando envío el formulario, entonces veo qué campo debo corregir.
4. Dado que se creó mi cuenta, cuando se revisa la base de datos, entonces la contraseña está guardada cifrada con bcrypt y nunca en texto plano.

### HU-04 · Iniciar sesión

**Clave esperada:** ETF-11 · **Épica:** ETF-2 Cuentas de cliente · **Puntos:** 3 · **Prioridad:** Más alta · **Release:** v1.0 (Sprint 1) · **Caso de uso:** CU-05 Iniciar sesión

> Como **cliente**, quiero **iniciar sesión con mi correo y contraseña**, para **usar mi carrito y ver mis pedidos**.

**Criterios de aceptación**

1. Dado que ingreso un correo y una contraseña correctos, cuando inicio sesión, entonces veo mi nombre en la barra de navegación y puedo usar el carrito.
2. Dado que el correo o la contraseña son incorrectos, cuando intento iniciar sesión, entonces veo el mensaje genérico «Correo o contraseña incorrectos», sin indicar cuál de los dos falló.
3. Dado que inicié sesión, cuando recargo la página o navego por la tienda, entonces mi sesión se mantiene.

### HU-05 · Agregar un juguete al carrito

**Clave esperada:** ETF-12 · **Épica:** ETF-3 Carrito de compras · **Puntos:** 3 · **Prioridad:** Más alta · **Release:** v1.0 (Sprint 1) · **Caso de uso:** CU-07 Agregar producto al carrito

> Como **cliente**, quiero **agregar juguetes a mi carrito**, para **comprar varios juguetes en un solo pedido**.

**Criterios de aceptación**

1. Dado que inicié sesión y el juguete tiene stock, cuando presiono «Agregar al carrito» en el catálogo o en el detalle, entonces el juguete se agrega con cantidad 1 y el contador del carrito aumenta.
2. Dado que el juguete ya está en mi carrito, cuando lo agrego otra vez, entonces su cantidad aumenta en 1, sin duplicar la línea.
3. Dado que la cantidad en mi carrito ya es igual al stock disponible, cuando intento agregar otra unidad, entonces veo el mensaje «Solo quedan N unidades» y la cantidad no cambia.
4. Dado que no he iniciado sesión, cuando presiono «Agregar al carrito», entonces se me lleva a la página de inicio de sesión.

### HU-06 · Cambiar cantidades y quitar juguetes del carrito

**Clave esperada:** ETF-13 · **Épica:** ETF-3 Carrito de compras · **Puntos:** 3 · **Prioridad:** Alta · **Release:** v1.0 (Sprint 1) · **Caso de uso:** CU-08 Gestionar carrito

> Como **cliente**, quiero **cambiar la cantidad de cada juguete o quitarlo de mi carrito**, para **ajustar mi compra antes de pagar**.

**Criterios de aceptación**

1. Dado que tengo un juguete en el carrito, cuando aumento o disminuyo su cantidad, entonces se guarda la nueva cantidad, que no puede ser menor que 1 ni mayor que el stock disponible.
2. Dado que tengo un juguete en el carrito, cuando presiono «Quitar», entonces el juguete desaparece del carrito.
3. Dado que mi carrito queda vacío, cuando lo abro, entonces veo el mensaje «Tu carrito está vacío» y un enlace al catálogo.

### HU-07 · Ver subtotales y total del carrito

**Clave esperada:** ETF-14 · **Épica:** ETF-3 Carrito de compras · **Puntos:** 2 · **Prioridad:** Alta · **Release:** v1.0 (Sprint 1) · **Caso de uso:** CU-08 Gestionar carrito

> Como **cliente**, quiero **ver el subtotal de cada juguete y el total de mi carrito**, para **saber cuánto voy a pagar**.

**Criterios de aceptación**

1. Dado que tengo juguetes en el carrito, cuando lo abro, entonces cada línea muestra el precio unitario, la cantidad y el subtotal (precio × cantidad), y al final se muestra el total (suma de subtotales).
2. Dado que cambio una cantidad o quito un juguete, cuando se actualiza el carrito, entonces los subtotales y el total se recalculan de inmediato.
3. Dado que cierro el navegador y vuelvo a entrar con mi cuenta, cuando abro el carrito, entonces encuentro los mismos juguetes y cantidades, porque el carrito se guarda en la base de datos.

### HU-08 · Ingresar los datos de entrega y generar el pedido

**Clave esperada:** ETF-15 · **Épica:** ETF-4 Compra y pago simulado · **Puntos:** 5 · **Prioridad:** Más alta · **Release:** v1.0 (Sprint 1) · **Caso de uso:** CU-09 Realizar compra

> Como **cliente**, quiero **ingresar los datos de entrega y confirmar mi carrito**, para **generar mi pedido**.

**Criterios de aceptación**

1. Dado que tengo juguetes en el carrito, cuando presiono «Comprar», entonces veo un formulario de entrega (nombre de quien recibe, teléfono, dirección, distrito y referencia opcional) junto al resumen del carrito y el total.
2. Dado que falta un dato obligatorio o el teléfono no tiene 9 dígitos, cuando presiono «Continuar al pago», entonces veo qué campo debo corregir y no se genera el pedido.
3. Dado que los datos son válidos y hay stock suficiente de cada juguete, cuando presiono «Continuar al pago», entonces se genera un pedido en estado Pendiente con un número de pedido único, se guarda el precio vigente de cada juguete, mi carrito queda vacío y paso a la página de pago.
4. Dado que la cantidad de algún juguete supera su stock actual, cuando presiono «Continuar al pago», entonces veo qué juguete debo ajustar y no se genera el pedido.

### HU-09 · Pagar el pedido con pago simulado

**Clave esperada:** ETF-16 · **Épica:** ETF-4 Compra y pago simulado · **Puntos:** 5 · **Prioridad:** Más alta · **Release:** v1.0 (Sprint 1) · **Caso de uso:** CU-09 Realizar compra, CU-10 Procesar pago simulado

> Como **cliente**, quiero **pagar mi pedido con una tarjeta simulada**, para **completar la compra sin usar una pasarela de pago real**.

**Criterios de aceptación**

1. Dado que tengo un pedido Pendiente, cuando ingreso una tarjeta de 16 dígitos que no termina en 0000, el nombre del titular, un vencimiento no pasado y un CVV de 3 dígitos, entonces el pago se aprueba, el pedido pasa a Pagado, se descuenta del stock la cantidad de cada juguete y veo la confirmación con el número de pedido.
2. Dado que la tarjeta termina en 0000 (tarjeta de rechazo de prueba), cuando pago, entonces veo «Pago rechazado», el pedido sigue Pendiente, el stock no cambia y puedo reintentar.
3. Dado que otro cliente compró las últimas unidades de un juguete antes de mi pago, cuando pago, entonces veo qué juguete ya no tiene stock suficiente, el pedido sigue Pendiente y no se descuenta nada, porque el pago y el descuento del stock ocurren en una sola transacción.
4. Dado que el pedido ya está Pagado, cuando intento pagarlo otra vez (por ejemplo, con doble clic), entonces no se repite el pago ni el descuento del stock.
5. Dado que se procesó un pago, cuando se revisa la base de datos, entonces solo se guardan los últimos 4 dígitos de la tarjeta y el resultado del pago, nunca el número completo ni el CVV.

### HU-10 · Consultar mi historial de pedidos

**Clave esperada:** ETF-17 · **Épica:** ETF-5 Pedidos del cliente · **Puntos:** 2 · **Prioridad:** Alta · **Release:** v2.0 (Sprint 2) · **Caso de uso:** CU-11 Consultar mis pedidos

> Como **cliente**, quiero **ver la lista de mis pedidos**, para **hacer seguimiento a mis compras**.

**Criterios de aceptación**

1. Dado que tengo pedidos, cuando entro a «Mis pedidos», entonces veo cada pedido con su número, fecha, total y estado (Pendiente, Pagado, Enviado o Entregado), del más reciente al más antiguo.
2. Dado que otros clientes también tienen pedidos, cuando entro a «Mis pedidos», entonces solo veo los míos.
3. Dado que todavía no tengo pedidos, cuando entro a «Mis pedidos», entonces veo el mensaje «Todavía no tienes pedidos» y un enlace al catálogo.

### HU-11 · Ver el detalle y el estado de un pedido

**Clave esperada:** ETF-18 · **Épica:** ETF-5 Pedidos del cliente · **Puntos:** 2 · **Prioridad:** Alta · **Release:** v2.0 (Sprint 2) · **Caso de uso:** CU-11 Consultar mis pedidos

> Como **cliente**, quiero **ver el detalle de uno de mis pedidos**, para **saber qué compré y en qué estado está**.

**Criterios de aceptación**

1. Dado que estoy en «Mis pedidos», cuando abro un pedido, entonces veo sus juguetes, cantidades, precios, total, datos de entrega y estado actual.
2. Dado que el pedido está Pendiente, cuando veo su detalle, entonces tengo el botón «Pagar ahora», que me lleva a la página de pago.
3. Dado que intento abrir el pedido de otro cliente cambiando la dirección de la página, cuando carga, entonces veo «Pedido no encontrado» y no se muestran sus datos.

### HU-12 · Registrar y editar juguetes

**Clave esperada:** ETF-19 · **Épica:** ETF-6 Administración del catálogo · **Puntos:** 5 · **Prioridad:** Alta · **Release:** v2.0 (Sprint 2) · **Caso de uso:** CU-12 Gestionar productos

> Como **administrador**, quiero **registrar y editar juguetes con todos sus datos**, para **mantener actualizado el catálogo**.

**Criterios de aceptación**

1. Dado que inicié sesión como administrador, cuando entro a «Administración > Juguetes», entonces veo la lista de juguetes con su nombre, categoría, precio y stock, y un botón «Nuevo juguete».
2. Dado que completo nombre, descripción, precio mayor que 0, imagen (URL), categoría, edad mínima y máxima recomendadas y stock inicial (entero mayor o igual a 0), cuando guardo, entonces el juguete se registra y aparece en el catálogo.
3. Dado que edito un juguete, cuando guardo los cambios, entonces el catálogo muestra los datos nuevos.
4. Dado que un dato es inválido (precio menor o igual a 0, edad mínima mayor que la máxima o campos vacíos), cuando guardo, entonces veo el error y no se guarda nada.
5. Dado que un usuario que no es administrador intenta entrar a la administración, cuando carga la página, entonces se le niega el acceso.

### HU-13 · Actualizar el stock

**Clave esperada:** ETF-20 · **Épica:** ETF-6 Administración del catálogo · **Puntos:** 3 · **Prioridad:** Alta · **Release:** v2.0 (Sprint 2) · **Caso de uso:** CU-14 Actualizar stock

> Como **administrador**, quiero **actualizar el stock de cada juguete**, para **que la tienda no ofrezca juguetes agotados**.

**Criterios de aceptación**

1. Dado que entro a «Administración > Inventario», cuando carga la página, entonces veo cada juguete con su stock actual, y los que tienen 5 unidades o menos aparecen resaltados como «Stock bajo».
2. Dado que ingreso una nueva cantidad (entero mayor o igual a 0), cuando la guardo, entonces el stock se actualiza y el catálogo muestra la nueva disponibilidad.
3. Dado que pongo el stock de un juguete en 0, cuando un cliente lo ve en el catálogo, entonces aparece como «Agotado».
4. Dado que ingreso un valor negativo o que no es un número entero, cuando guardo, entonces veo un error y el stock no cambia.

### HU-14 · Consultar los pedidos de la tienda

**Clave esperada:** ETF-21 · **Épica:** ETF-7 Administración de pedidos · **Puntos:** 3 · **Prioridad:** Alta · **Release:** v2.0 (Sprint 2) · **Caso de uso:** CU-15 Gestionar pedidos

> Como **administrador**, quiero **ver todos los pedidos y filtrarlos por estado**, para **organizar los despachos**.

**Criterios de aceptación**

1. Dado que entro a «Administración > Pedidos», cuando carga la página, entonces veo todos los pedidos con su número, cliente, fecha, total y estado, del más reciente al más antiguo.
2. Dado que elijo un estado en el filtro, cuando se aplica, entonces solo veo los pedidos en ese estado.
3. Dado que abro un pedido, cuando carga su detalle, entonces veo sus juguetes, cantidades, total y datos de entrega.

### HU-15 · Cambiar el estado de un pedido

**Clave esperada:** ETF-22 · **Épica:** ETF-7 Administración de pedidos · **Puntos:** 3 · **Prioridad:** Alta · **Release:** v2.0 (Sprint 2) · **Caso de uso:** CU-15 Gestionar pedidos

> Como **administrador**, quiero **cambiar el estado de un pedido**, para **informar al cliente cómo avanza su entrega**.

**Criterios de aceptación**

1. Dado que un pedido está Pagado, cuando lo marco como Enviado, entonces su estado cambia y el cliente lo ve actualizado en «Mis pedidos».
2. Dado que un pedido está Enviado, cuando lo marco como Entregado, entonces su estado cambia a Entregado.
3. Dado que un pedido está Pendiente, cuando intento marcarlo como Enviado, entonces el sistema no lo permite, porque el pedido solo avanza en el orden Pendiente → Pagado → Enviado → Entregado y el paso a Pagado ocurre únicamente con el pago.
4. Dado que un pedido está Entregado, cuando veo sus acciones, entonces ya no puedo cambiar su estado.

### HU-16 · Buscar juguetes por nombre

**Clave esperada:** ETF-23 · **Épica:** ETF-1 Catálogo de juguetes · **Puntos:** 2 · **Prioridad:** Media · **Release:** v2.0 (Sprint 2) · **Caso de uso:** CU-03 Buscar y filtrar juguetes

> Como **visitante**, quiero **buscar juguetes por su nombre**, para **encontrar rápido el juguete que busco**.

**Criterios de aceptación**

1. Dado que escribo parte del nombre de un juguete (por ejemplo, «pelu»), cuando busco, entonces veo los juguetes cuyo nombre contiene ese texto, sin importar mayúsculas o minúsculas.
2. Dado que ningún juguete coincide, cuando busco, entonces veo el mensaje «No encontramos juguetes con ese nombre».
3. Dado que borro el texto de búsqueda, cuando busco, entonces vuelvo a ver todo el catálogo.

### HU-17 · Filtrar juguetes por categoría, edad y precio

**Clave esperada:** ETF-24 · **Épica:** ETF-1 Catálogo de juguetes · **Puntos:** 5 · **Prioridad:** Media · **Release:** v2.0 (Sprint 2) · **Caso de uso:** CU-03 Buscar y filtrar juguetes

> Como **visitante**, quiero **filtrar el catálogo por categoría, rango de edad y rango de precio**, para **ver solo los juguetes adecuados para quien los recibirá**.

**Criterios de aceptación**

1. Dado que elijo una categoría, cuando aplico el filtro, entonces solo veo los juguetes de esa categoría.
2. Dado que elijo un rango de edad (0–2, 3–5, 6–8, 9–12 o 13 años a más), cuando aplico el filtro, entonces veo los juguetes cuya edad recomendada coincide con ese rango.
3. Dado que ingreso un precio mínimo, un precio máximo o ambos, cuando aplico el filtro, entonces solo veo juguetes con precio dentro de ese rango; si el mínimo es mayor que el máximo, veo un aviso.
4. Dado que combino la búsqueda con los filtros, cuando los aplico, entonces se cumplen todos a la vez, y con «Limpiar filtros» vuelvo al catálogo completo.

### HU-18 · Cerrar sesión

**Clave esperada:** ETF-25 · **Épica:** ETF-2 Cuentas de cliente · **Puntos:** 1 · **Prioridad:** Media · **Release:** v2.0 (Sprint 2) · **Caso de uso:** CU-06 Cerrar sesión

> Como **cliente**, quiero **cerrar mi sesión**, para **que nadie más use mi cuenta en este dispositivo**.

**Criterios de aceptación**

1. Dado que inicié sesión, cuando presiono «Cerrar sesión», entonces mi sesión termina y vuelvo al catálogo como visitante.
2. Dado que cerré sesión, cuando intento entrar a «Mis pedidos» o al carrito, entonces se me lleva a la página de inicio de sesión.

### HU-19 · Gestionar categorías

**Clave esperada:** ETF-26 · **Épica:** ETF-6 Administración del catálogo · **Puntos:** 3 · **Prioridad:** Media · **Release:** v2.0 (Sprint 2) · **Caso de uso:** CU-13 Gestionar categorías

> Como **administrador**, quiero **registrar, editar y eliminar categorías**, para **organizar el catálogo de juguetes**.

**Criterios de aceptación**

1. Dado que entro a «Administración > Categorías», cuando registro una categoría con un nombre que no existe, entonces aparece en la lista y en el filtro del catálogo.
2. Dado que el nombre ya existe, cuando intento registrar la categoría, entonces veo el mensaje «Ya existe una categoría con ese nombre».
3. Dado que edito el nombre de una categoría, cuando guardo, entonces los juguetes de esa categoría muestran el nombre nuevo.
4. Dado que una categoría tiene juguetes asignados, cuando intento eliminarla, entonces el sistema no lo permite y me indica cuántos juguetes debo reasignar; si no tiene juguetes, se elimina.

### HU-20 · Eliminar juguetes

**Clave esperada:** ETF-27 · **Épica:** ETF-6 Administración del catálogo · **Puntos:** 2 · **Prioridad:** Media · **Release:** v2.0 (Sprint 2) · **Caso de uso:** CU-12 Gestionar productos

> Como **administrador**, quiero **eliminar los juguetes que la tienda ya no vende**, para **que no aparezcan en el catálogo**.

**Criterios de aceptación**

1. Dado que presiono «Eliminar» en un juguete, cuando confirmo en el mensaje de confirmación, entonces el juguete deja de aparecer en el catálogo y ya no se puede agregar al carrito; si estaba en el carrito de un cliente, se le avisa al intentar comprar.
2. Dado que el juguete aparece en pedidos anteriores, cuando lo elimino, entonces esos pedidos conservan su nombre, cantidad y precio, porque el juguete se desactiva y no se borra de la base de datos.
3. Dado que cancelo el mensaje de confirmación, cuando vuelvo a la lista, entonces el juguete sigue igual.

## 7. Tareas técnicas

Son trabajo necesario que no entrega valor directo a un usuario, por eso no se redactan como historias ni llevan puntos. Se crean en Jira con el tipo **Tarea** y entran al sprint junto con las historias.

| ID | Clave esperada | Tarea | Detalle | Sprint |
|---|---|---|---|---|
| T-01 | ETF-28 | Crear la estructura del repositorio | Proyecto frontend (Next.js + Tailwind CSS) en frontend/, proyecto backend (NestJS) en backend/, carpeta docs/, README y .gitignore. | 1 |
| T-02 | ETF-29 | Conectar el backend a PostgreSQL (Neon) y cargar datos semilla | Conexión con TypeORM mediante la variable DATABASE_URL; datos semilla: categorías, juguetes (uno con stock 0 y otros con stock bajo), un administrador y un cliente de prueba. | 1 |
| T-03 | ETF-30 | Desplegar el frontend en Vercel y el backend en Render | Primer despliegue público; después cada cambio en main se publica de forma automática. | 1 |
| T-04 | ETF-31 | Elaborar los modelos de requisitos y de análisis | Diagrama de casos de uso, diagrama de clases de análisis (boundary, control, entity) y diagrama de paquetes. | 1 |
| T-05 | ETF-32 | Elaborar el diagrama de clases de diseño y el de subsistemas | Clases de diseño con tipos, operaciones, visibilidad y relaciones refinadas; subsistemas con interfaces proporcionadas y requeridas. | 1 |
| T-06 | ETF-33 | Elaborar los diagramas de secuencia | Realización de los casos de uso Agregar producto al carrito, Realizar compra y Gestionar productos, con fragmentos alt, opt y loop. | 2 |
| T-07 | ETF-34 | Elaborar los modelos de implementación y de despliegue | Componentes y artefactos según el repositorio real; despliegue en forma de descriptor y de instancia según Vercel, Render y Neon. | 2 |
| T-08 | ETF-35 | Completar el README y las evidencias de los sprints | README final (descripción, tecnologías, instalación, ejecución, integrante y URL pública), Sprint Review, Retrospectiva, burndown y velocidad. | 2 |

## 8. Cumplimiento de INVEST

| Criterio | Cómo se cumple en este backlog |
|---|---|
| **I**ndependiente | Cada historia se construye y se prueba por separado. Los datos semilla (T-02) permiten que el catálogo y la compra funcionen antes de construir la administración. |
| **N**egociable | Las historias dicen qué necesita el usuario y para qué, no cómo se programa; los detalles se acuerdan al refinarlas. |
| **V**aliosa | Todas parten de un actor (visitante, cliente o administrador) y expresan su beneficio. El trabajo técnico va aparte, como tareas. |
| **E**stimable | Sus criterios de aceptación son concretos, por eso todas pudieron estimarse en puntos de historia. |
| **S**mall (pequeña) | Ninguna supera 5 puntos. Las grandes se dividieron: la compra en HU-08 y HU-09, y el carrito en HU-05, HU-06 y HU-07. |
| **T**estable (comprobable) | Cada criterio usa el formato Dado / Cuando / Entonces y sirve como prueba de aceptación en la Sprint Review. |

## 9. Estimación con Planning Poker

Las historias se estiman en puntos de historia con la baraja de Planning Poker y la escala de Fibonacci (1, 2, 3, 5, 8 y 13). Como el equipo tiene un solo integrante, la técnica se adapta: cada historia se compara con las historias de referencia de la tabla y se elige la carta; en una segunda pasada se revisan las estimaciones dudosas antes de cerrar el backlog.

| Puntos | Historia de referencia | Por qué tiene ese tamaño |
|---|---|---|
| 1 | HU-18 Cerrar sesión | Un botón que termina la sesión; no tiene reglas de negocio. |
| 2 | HU-02 Ver el detalle de un juguete | Una consulta y una página, con un solo caso de error (juguete no encontrado). |
| 3 | HU-05 Agregar un juguete al carrito | Página, servicio y base de datos, con dos validaciones: sesión iniciada y stock disponible. |
| 5 | HU-09 Pagar el pedido con pago simulado | Varias reglas (aprobado, rechazado, sin stock, doble pago) y una transacción que descuenta el stock. |
| 8 o más | Ninguna | Una historia de ese tamaño se divide antes de entrar al backlog. |

## 10. Priorización por valor para el negocio

1. **Primero, el flujo de compra completo (HU-01 a HU-09).** Ataca el problema principal, los pedidos anotados a mano, y es lo mínimo que permite vender en línea.
2. **Después, el seguimiento y la administración de stock y pedidos (HU-10 a HU-15).** Ataca el stock en hoja de cálculo y la venta de productos agotados.
3. **Al final, la búsqueda, los filtros y el mantenimiento del catálogo (HU-16 a HU-20).** Son útiles, pero la tienda puede vender sin ellos mientras su catálogo es pequeño.

## 11. Plan de entregas

- **Puntos comprometidos:** 60 puntos en 20 historias.
- **Velocidad prevista:** 30 puntos por sprint. Es una estimación inicial, porque es el primer sprint del equipo con este producto; se ajusta con la velocidad real del Sprint 1.
- **Sprints necesarios:** 60 ÷ 30 = 2 sprints.
- **Velocidad real del Sprint 1:** 5 puntos (HU-01 y HU-02). El sprint concentró la infraestructura y el modelado UML, que no llevan puntos; el detalle está en la [Sprint Review del Sprint 1](sprint-1-review.md#6-burndown-y-velocidad). El alcance del Sprint 2 se ajusta en su Sprint Planning.
- **Velocidad real del Sprint 2:** 24 puntos (HU-03 a HU-09), todo lo comprometido. Las 3 tareas técnicas (T-06 a T-08) también se terminaron; el detalle está en la [Sprint Review del Sprint 2](sprint-2-review.md#6-burndown-y-velocidad).
- **Proyección para v2.0:** con 24 puntos por sprint, las 6 historias de prioridad Alta (HU-10 a HU-15, 18 puntos) caben en un Sprint 3. Las 5 de prioridad Media (HU-16 a HU-20, 13 puntos) entrarían por orden si queda capacidad; si no, pasarían a un Sprint 4.

| Release | Contenido | Sprint | Puntos | Fecha | Estado |
|---|---|---|---|---|---|
| v1.0: Compra en línea | HU-01 a HU-09 | Sprint 1 (HU-01 y HU-02) y Sprint 2 (HU-03 a HU-09) | 29 | 22/11/2026 (fin del Sprint 2) | Terminada y publicada |
| v2.0: Seguimiento y administración | HU-10 a HU-20 | Sprint 3, si el docente amplía el plazo | 31 | Por confirmar | En el Product Backlog |

**Objetivos de los sprints (Sprint Goal)**

- **Sprint 1:** «Un cliente puede registrarse, encontrar un juguete, armar su carrito y completar una compra con pago simulado».
- **Sprint 2:** «Un cliente puede registrarse, armar su carrito y completar una compra con pago simulado que descuenta el stock, y los 9 diagramas UML quedan completos y coherentes con el código». Se redefinió en el [Sprint 2 Planning](sprint-2-planning.md), porque HU-03 a HU-09 pasaron del Sprint 1 al Sprint 2.
- **Sprint 3 (si el docente amplía el plazo):** «El cliente sigue el estado de sus pedidos y el administrador gestiona juguetes, categorías, stock y pedidos». Era la meta original del Sprint 2.

## 12. Casos de uso previstos (trazabilidad)

Lista preliminar para el diagrama de casos de uso; se confirma al elaborar el modelo de requisitos (T-04). Los nombres de CU-07, CU-09 y CU-12 son los que pide el enunciado para los diagramas de secuencia.

| Caso de uso | Actor principal | Historias |
|---|---|---|
| CU-01 Consultar catálogo | Visitante | HU-01 |
| CU-02 Ver detalle de juguete | Visitante | HU-02 |
| CU-03 Buscar y filtrar juguetes | Visitante | HU-16, HU-17 |
| CU-04 Registrarse | Visitante | HU-03 |
| CU-05 Iniciar sesión | Cliente | HU-04 |
| CU-06 Cerrar sesión | Cliente | HU-18 |
| CU-07 Agregar producto al carrito | Cliente | HU-05 |
| CU-08 Gestionar carrito | Cliente | HU-06, HU-07 |
| CU-09 Realizar compra | Cliente | HU-08, HU-09 |
| CU-10 Procesar pago simulado | Cliente (incluido en CU-09) | HU-09 |
| CU-11 Consultar mis pedidos | Cliente | HU-10, HU-11 |
| CU-12 Gestionar productos | Administrador | HU-12, HU-20 |
| CU-13 Gestionar categorías | Administrador | HU-19 |
| CU-14 Actualizar stock | Administrador | HU-13 |
| CU-15 Gestionar pedidos | Administrador | HU-14, HU-15 |
