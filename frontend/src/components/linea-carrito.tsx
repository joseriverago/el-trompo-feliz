"use client";

import Link from "next/link";
import { useState } from "react";
import {
  cambiarCantidad,
  guardarCarrito,
  quitarDelCarrito,
  type ItemCarrito,
  type ResultadoCarrito,
} from "@/lib/carrito";
import { formatearPrecio } from "@/lib/juguetes";
import { borrarSesion } from "@/lib/sesion";

const BOTON_CANTIDAD =
  "flex h-9 w-9 items-center justify-center text-lg font-semibold transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:text-zinc-300 disabled:hover:bg-transparent dark:hover:bg-zinc-800 dark:disabled:text-zinc-600";

type Aviso = { tipo: "error" | "alerta" | "nota"; texto: string };

const COLOR_AVISO: Record<Aviso["tipo"], string> = {
  error: "text-red-700 dark:text-red-400",
  alerta: "text-amber-700 dark:text-amber-400",
  nota: "text-zinc-500 dark:text-zinc-400",
};

function unidades(cantidad: number): string {
  return cantidad === 1 ? "Solo queda 1 unidad" : `Solo quedan ${cantidad} unidades`;
}

/**
 * Explica por qué «+» está desactivado. Si el stock bajó por debajo de la cantidad
 * (otro cliente compró mientras tanto), pide bajarla o quitar el juguete.
 */
function avisoDeStock(item: ItemCarrito): Aviso | null {
  if (item.stock === 0) return { tipo: "alerta", texto: "Este juguete se agotó: quítalo de tu carrito" };
  if (item.cantidad > item.stock) return { tipo: "alerta", texto: `${unidades(item.stock)}: baja la cantidad` };
  if (item.cantidad === item.stock) return { tipo: "nota", texto: "Ya tienes todas las unidades disponibles" };
  return null;
}

interface Props {
  item: ItemCarrito;
  token: string;
  /** Vuelve a leer el carrito, por ejemplo si cambió el stock o la línea ya no existe. */
  onRecargar: () => void;
}

/**
 * Una línea de la página del carrito: el juguete, su precio unitario, los botones para
 * cambiar la cantidad entre 1 y el stock disponible y «Quitar» (HU-06), y el subtotal (HU-07).
 */
export function LineaCarrito({ item, token, onRecargar }: Props) {
  const [ocupado, setOcupado] = useState<"cantidad" | "quitar" | null>(null);
  const [error, setError] = useState<string | null>(null);

  // «−» resta una unidad; si la cantidad ya supera el stock, baja directo al máximo disponible.
  const menos = Math.min(item.cantidad - 1, item.stock);
  const mas = item.cantidad + 1;

  async function aplicar(accion: "cantidad" | "quitar", peticion: () => Promise<ResultadoCarrito>) {
    setOcupado(accion);
    setError(null);
    try {
      const resultado = await peticion();
      if (resultado.tipo === "listo") {
        guardarCarrito(resultado.carrito);
      } else if (resultado.tipo === "sin-stock") {
        // El stock cambió desde que se abrió la página: se muestra el aviso y se lee el stock actual.
        setError(resultado.mensaje);
        onRecargar();
      } else if (resultado.tipo === "no-encontrado") {
        setError("Este juguete ya no está disponible");
        onRecargar();
      } else {
        // La API ya no acepta el token: sin sesión, la página lleva a iniciar sesión.
        borrarSesion();
      }
    } catch {
      setError("No pudimos conectar con la tienda. Inténtalo de nuevo.");
    } finally {
      setOcupado(null);
    }
  }

  const aviso: Aviso | null = error ? { tipo: "error", texto: error } : avisoDeStock(item);
  const enlace = `/juguetes/${item.jugueteId}`;

  return (
    <li className="flex gap-4 py-5">
      <Link href={enlace} className="shrink-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.imagenUrl}
          alt={item.nombre}
          className="h-16 w-20 rounded-xl bg-zinc-100 object-cover sm:h-20 sm:w-28 dark:bg-zinc-800"
        />
      </Link>

      <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <Link href={enlace} className="font-semibold hover:underline">
            {item.nombre}
          </Link>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">{formatearPrecio(item.precio)} c/u</p>
          {/* aria-live: el lector de pantalla anuncia el aviso sin mover el foco. */}
          <p aria-live="polite" className={`min-h-5 text-sm font-medium ${aviso ? COLOR_AVISO[aviso.tipo] : ""}`}>
            {aviso?.texto}
          </p>
        </div>

        {/* En el celular, si no entra todo en una fila, el subtotal pasa a la fila de abajo. */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <div
            role="group"
            aria-label={`Cantidad de ${item.nombre}`}
            aria-busy={ocupado === "cantidad"}
            className="flex items-center overflow-hidden rounded-full border border-zinc-300 dark:border-zinc-700"
          >
            <button
              type="button"
              aria-label={`Restar una unidad de ${item.nombre}`}
              disabled={ocupado !== null || menos < 1}
              onClick={() => aplicar("cantidad", () => cambiarCantidad(token, item.id, menos))}
              className={BOTON_CANTIDAD}
            >
              −
            </button>
            <span className="w-10 text-center font-semibold tabular-nums">{item.cantidad}</span>
            <button
              type="button"
              aria-label={`Sumar una unidad de ${item.nombre}`}
              disabled={ocupado !== null || mas > item.stock}
              onClick={() => aplicar("cantidad", () => cambiarCantidad(token, item.id, mas))}
              className={BOTON_CANTIDAD}
            >
              +
            </button>
          </div>
          <button
            type="button"
            aria-label={`Quitar ${item.nombre} del carrito`}
            disabled={ocupado !== null}
            onClick={() => aplicar("quitar", () => quitarDelCarrito(token, item.id))}
            className="text-sm font-semibold text-red-700 hover:underline disabled:cursor-wait disabled:opacity-60 dark:text-red-400"
          >
            {ocupado === "quitar" ? "Quitando…" : "Quitar"}
          </button>
          {/* HU-07: precio × cantidad. Lo calcula la API en céntimos, sin errores de redondeo. */}
          <p className="ml-auto flex w-24 flex-col text-right sm:ml-0">
            <span className="text-xs text-zinc-500 dark:text-zinc-400">Subtotal</span>
            <span className="font-semibold tabular-nums">{formatearPrecio(item.subtotal)}</span>
          </p>
        </div>
      </div>
    </li>
  );
}
