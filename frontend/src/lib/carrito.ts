import { useSyncExternalStore } from "react";
import { API_URL } from "@/lib/api";

/** Una línea del carrito tal como la devuelve la API. */
export interface ItemCarrito {
  id: number;
  jugueteId: number;
  nombre: string;
  imagenUrl: string;
  precio: number;
  cantidad: number;
  stock: number;
  subtotal: number;
}

/** Respuesta de todas las rutas del carrito. */
export interface Carrito {
  items: ItemCarrito[];
  /** Suma de las cantidades: el número del contador del encabezado. */
  unidades: number;
  total: number;
}

/** Resultado de agregar, cambiar la cantidad o quitar un juguete del carrito. */
export type ResultadoCarrito =
  | { tipo: "listo"; carrito: Carrito }
  /** La API respondió 409: `mensaje` dice cuántas unidades quedan. */
  | { tipo: "sin-stock"; mensaje: string }
  /** 404: el juguete ya no se vende, o la línea ya no está en el carrito. */
  | { tipo: "no-encontrado" }
  | { tipo: "sesion-vencida" };

function cabeceras(token: string): HeadersInit {
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}

/** GET /carrito. Devuelve null si la API ya no acepta el token (401). */
export async function obtenerCarrito(token: string, signal?: AbortSignal): Promise<Carrito | null> {
  const respuesta = await fetch(`${API_URL}/carrito`, { headers: cabeceras(token), signal });
  if (respuesta.status === 401) return null;
  if (!respuesta.ok) throw new Error(`La API respondió ${respuesta.status}`);
  return respuesta.json();
}

/** Interpreta la respuesta de una ruta que cambia el carrito. Lanza un error si la API falla. */
async function resultadoDe(respuesta: Response): Promise<ResultadoCarrito> {
  if (respuesta.ok) return { tipo: "listo", carrito: (await respuesta.json()) as Carrito };
  if (respuesta.status === 401) return { tipo: "sesion-vencida" };
  if (respuesta.status === 404) return { tipo: "no-encontrado" };
  if (respuesta.status === 409) {
    const cuerpo = (await respuesta.json().catch(() => ({}))) as { message?: string };
    return { tipo: "sin-stock", mensaje: cuerpo.message ?? "No quedan más unidades de este juguete" };
  }
  throw new Error(`La API respondió ${respuesta.status}`);
}

/** POST /carrito/items: agrega una unidad del juguete (HU-05). */
export async function agregarAlCarrito(token: string, jugueteId: number): Promise<ResultadoCarrito> {
  return resultadoDe(
    await fetch(`${API_URL}/carrito/items`, {
      method: "POST",
      headers: cabeceras(token),
      body: JSON.stringify({ jugueteId }),
    }),
  );
}

/** PATCH /carrito/items/:itemId: guarda la nueva cantidad de una línea (HU-06). */
export async function cambiarCantidad(token: string, itemId: number, cantidad: number): Promise<ResultadoCarrito> {
  return resultadoDe(
    await fetch(`${API_URL}/carrito/items/${itemId}`, {
      method: "PATCH",
      headers: cabeceras(token),
      body: JSON.stringify({ cantidad }),
    }),
  );
}

/** DELETE /carrito/items/:itemId: quita una línea del carrito (HU-06). */
export async function quitarDelCarrito(token: string, itemId: number): Promise<ResultadoCarrito> {
  return resultadoDe(
    await fetch(`${API_URL}/carrito/items/${itemId}`, { method: "DELETE", headers: cabeceras(token) }),
  );
}

// El carrito se comparte entre el contador del encabezado, los botones «Agregar al carrito» y la página del carrito.
let carritoActual: Carrito | null = null;
const oyentes = new Set<() => void>();

function suscribir(oyente: () => void): () => void {
  oyentes.add(oyente);
  return () => oyentes.delete(oyente);
}

/** Reemplaza el carrito que muestra la tienda (null: todavía no se cargó o no hay sesión). */
export function guardarCarrito(carrito: Carrito | null): void {
  carritoActual = carrito;
  oyentes.forEach((oyente) => oyente());
}

export function useCarrito(): Carrito | null {
  return useSyncExternalStore(
    suscribir,
    () => carritoActual,
    () => null,
  );
}
