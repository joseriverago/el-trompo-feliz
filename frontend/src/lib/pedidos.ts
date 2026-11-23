import { API_URL } from "@/lib/api";

/** Formulario de entrega de «Comprar» (HU-08). */
export interface DatosEntrega {
  destinatario: string;
  telefono: string;
  direccion: string;
  distrito: string;
  referencia: string;
}

export type ErroresEntrega = Partial<Record<keyof DatosEntrega, string>>;

export type EstadoPedido = "PENDIENTE" | "PAGADO" | "ENVIADO" | "ENTREGADO";

export const NOMBRE_ESTADO: Record<EstadoPedido, string> = {
  PENDIENTE: "Pendiente",
  PAGADO: "Pagado",
  ENVIADO: "Enviado",
  ENTREGADO: "Entregado",
};

/** Una línea del pedido con el precio que tenía el juguete al comprarlo. */
export interface DetallePedido {
  jugueteId: number;
  nombre: string;
  precioUnitario: number;
  cantidad: number;
  subtotal: number;
}

/** Una fila de «Mis pedidos» (GET /pedidos, HU-10). */
export interface PedidoResumen {
  numero: string;
  estado: EstadoPedido;
  total: number;
  unidades: number;
  creadoEn: string;
}

/** Pedido tal como lo devuelve la API, con sus líneas y la entrega. */
export interface Pedido extends PedidoResumen {
  entrega: Omit<DatosEntrega, "referencia"> & { referencia: string | null };
  detalles: DetallePedido[];
}

/** Fecha y hora de Lima, por ejemplo «22 nov 2026, 7:45 p. m.». */
const FECHA_PEDIDO = new Intl.DateTimeFormat("es-PE", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "America/Lima",
});

export function formatearFechaPedido(creadoEn: string): string {
  return FECHA_PEDIDO.format(new Date(creadoEn));
}

/** Un juguete cuya cantidad supera el stock actual (409 de POST /pedidos). */
export interface JugueteSinStock {
  itemId: number;
  jugueteId: number;
  nombre: string;
  stock: number;
  mensaje: string;
}

export type ResultadoPedido =
  | { tipo: "listo"; pedido: Pedido }
  /** 400: un mensaje por campo del formulario. */
  | { tipo: "datos-invalidos"; errores: ErroresEntrega }
  /** 409: los juguetes que hay que ajustar en el carrito (HU-08, criterio 4). */
  | { tipo: "sin-stock"; juguetes: JugueteSinStock[] }
  /** El carrito está vacío o cambió mientras se compraba: hay que revisarlo. */
  | { tipo: "revisar-carrito"; mensaje: string }
  | { tipo: "sesion-vencida" };

/** Quita espacios y guiones, igual que la API: «987 654 321» es 987654321. */
export function soloDigitos(telefono: string): string {
  return telefono.replace(/[\s-]/g, "");
}

/** Las mismas reglas que valida la API, para avisar antes de enviar. La API vuelve a validar todo. */
export function validarEntrega(datos: DatosEntrega): ErroresEntrega {
  const errores: ErroresEntrega = {};
  const largo = (campo: keyof DatosEntrega, maximo: number, mensaje: string) => {
    if (datos[campo].trim().length > maximo) errores[campo] = mensaje;
  };

  if (!datos.destinatario.trim()) errores.destinatario = "Ingresa el nombre de quien recibe";
  else largo("destinatario", 100, "El nombre puede tener hasta 100 caracteres");

  const telefono = soloDigitos(datos.telefono);
  if (!telefono) errores.telefono = "Ingresa el teléfono";
  else if (!/^\d{9}$/.test(telefono)) errores.telefono = "El teléfono debe tener 9 dígitos";

  if (!datos.direccion.trim()) errores.direccion = "Ingresa la dirección de entrega";
  else largo("direccion", 200, "La dirección puede tener hasta 200 caracteres");

  if (!datos.distrito.trim()) errores.distrito = "Ingresa el distrito";
  else largo("distrito", 80, "El distrito puede tener hasta 80 caracteres");

  largo("referencia", 200, "La referencia puede tener hasta 200 caracteres");
  return errores;
}

function cabeceras(token: string): HeadersInit {
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}

/** POST /pedidos: genera el pedido con el carrito y los datos de entrega (HU-08). */
export async function generarPedido(token: string, datos: DatosEntrega): Promise<ResultadoPedido> {
  const respuesta = await fetch(`${API_URL}/pedidos`, {
    method: "POST",
    headers: cabeceras(token),
    body: JSON.stringify(datos),
  });
  if (respuesta.ok) return { tipo: "listo", pedido: (await respuesta.json()) as Pedido };
  if (respuesta.status === 401) return { tipo: "sesion-vencida" };
  if (respuesta.status === 400 || respuesta.status === 409) {
    const cuerpo = (await respuesta.json().catch(() => ({}))) as {
      message?: string;
      errores?: ErroresEntrega;
      juguetes?: JugueteSinStock[];
    };
    if (cuerpo.juguetes?.length) return { tipo: "sin-stock", juguetes: cuerpo.juguetes };
    if (cuerpo.errores && Object.keys(cuerpo.errores).length > 0)
      return { tipo: "datos-invalidos", errores: cuerpo.errores };
    return { tipo: "revisar-carrito", mensaje: cuerpo.message ?? "Revisa tu carrito y vuelve a intentarlo" };
  }
  throw new Error(`La API respondió ${respuesta.status}`);
}

export type LecturaMisPedidos = { tipo: "listo"; pedidos: PedidoResumen[] } | { tipo: "sesion-vencida" };

/** GET /pedidos: los pedidos del cliente del token, del más reciente al más antiguo (HU-10). */
export async function listarMisPedidos(token: string, signal?: AbortSignal): Promise<LecturaMisPedidos> {
  const respuesta = await fetch(`${API_URL}/pedidos`, { headers: cabeceras(token), signal });
  if (respuesta.ok) return { tipo: "listo", pedidos: (await respuesta.json()) as PedidoResumen[] };
  if (respuesta.status === 401) return { tipo: "sesion-vencida" };
  throw new Error(`La API respondió ${respuesta.status}`);
}

export type LecturaPedido ={ tipo: "listo"; pedido: Pedido } | { tipo: "no-encontrado" } | { tipo: "sesion-vencida" };

/** GET /pedidos/:numero: un pedido del cliente. Con el número de otro cliente responde «no encontrado». */
export async function obtenerPedido(token: string, numero: string, signal?: AbortSignal): Promise<LecturaPedido> {
  const respuesta = await fetch(`${API_URL}/pedidos/${encodeURIComponent(numero)}`, {
    headers: cabeceras(token),
    signal,
  });
  if (respuesta.ok) return { tipo: "listo", pedido: (await respuesta.json()) as Pedido };
  if (respuesta.status === 401) return { tipo: "sesion-vencida" };
  if (respuesta.status === 404) return { tipo: "no-encontrado" };
  throw new Error(`La API respondió ${respuesta.status}`);
}
