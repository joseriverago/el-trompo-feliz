import { cabecerasAdmin } from "@/lib/admin-juguetes";
import { API_URL } from "@/lib/api";
import type { EstadoPedido, Pedido, PedidoResumen } from "@/lib/pedidos";

/** Fila de «Administración > Pedidos» (HU-14). */
export interface PedidoAdminResumen extends PedidoResumen {
  cliente: string;
}

export interface PedidoAdmin extends Pedido {
  cliente: string;
}

export type LecturaPedidosAdmin =
  | { tipo: "listo"; pedidos: PedidoAdminResumen[] }
  | { tipo: "sin-permiso" }
  | { tipo: "sesion-vencida" };

/** GET /admin/pedidos?estado=: todos los pedidos, o solo los de un estado. */
export async function listarPedidosAdmin(
  token: string,
  estado: EstadoPedido | "",
  signal?: AbortSignal,
): Promise<LecturaPedidosAdmin> {
  const consulta = estado ? `?estado=${estado}` : "";
  const respuesta = await fetch(`${API_URL}/admin/pedidos${consulta}`, { headers: cabecerasAdmin(token), signal });
  if (respuesta.ok) return { tipo: "listo", pedidos: (await respuesta.json()) as PedidoAdminResumen[] };
  if (respuesta.status === 401) return { tipo: "sesion-vencida" };
  if (respuesta.status === 403) return { tipo: "sin-permiso" };
  throw new Error(`La API respondió ${respuesta.status}`);
}

export type LecturaPedidoAdmin =
  | { tipo: "listo"; pedido: PedidoAdmin }
  | { tipo: "no-encontrado" }
  | { tipo: "sin-permiso" }
  | { tipo: "sesion-vencida" };

/** GET /admin/pedidos/:numero: un pedido de cualquier cliente. */
export async function obtenerPedidoAdmin(token: string, numero: string, signal?: AbortSignal): Promise<LecturaPedidoAdmin> {
  const respuesta = await fetch(`${API_URL}/admin/pedidos/${encodeURIComponent(numero)}`, {
    headers: cabecerasAdmin(token),
    signal,
  });
  if (respuesta.ok) return { tipo: "listo", pedido: (await respuesta.json()) as PedidoAdmin };
  if (respuesta.status === 401) return { tipo: "sesion-vencida" };
  if (respuesta.status === 403) return { tipo: "sin-permiso" };
  if (respuesta.status === 404) return { tipo: "no-encontrado" };
  throw new Error(`La API respondió ${respuesta.status}`);
}

/** El paso que el administrador puede dar desde cada estado (HU-15). Sin entrada, no hay cambio. */
export const SIGUIENTE_ESTADO: Partial<Record<EstadoPedido, "ENVIADO" | "ENTREGADO">> = {
  PAGADO: "ENVIADO",
  ENVIADO: "ENTREGADO",
};

export type ResultadoEstado =
  | { tipo: "listo"; pedido: PedidoAdmin }
  /** 409: el pedido no admite ese cambio, por ejemplo porque ya cambió. */
  | { tipo: "no-permitido"; mensaje: string }
  | { tipo: "no-encontrado" }
  | { tipo: "sin-permiso" }
  | { tipo: "sesion-vencida" };

/** PATCH /admin/pedidos/:numero/estado: marca el pedido Enviado o Entregado. */
export async function cambiarEstadoPedido(
  token: string,
  numero: string,
  estado: "ENVIADO" | "ENTREGADO",
): Promise<ResultadoEstado> {
  const respuesta = await fetch(`${API_URL}/admin/pedidos/${encodeURIComponent(numero)}/estado`, {
    method: "PATCH",
    headers: cabecerasAdmin(token),
    body: JSON.stringify({ estado }),
  });
  if (respuesta.ok) return { tipo: "listo", pedido: (await respuesta.json()) as PedidoAdmin };
  if (respuesta.status === 401) return { tipo: "sesion-vencida" };
  if (respuesta.status === 403) return { tipo: "sin-permiso" };
  if (respuesta.status === 404) return { tipo: "no-encontrado" };
  if (respuesta.status === 409) {
    const cuerpo = (await respuesta.json().catch(() => ({}))) as { message?: string };
    return { tipo: "no-permitido", mensaje: cuerpo.message ?? "El pedido no admite ese cambio" };
  }
  throw new Error(`La API respondió ${respuesta.status}`);
}
