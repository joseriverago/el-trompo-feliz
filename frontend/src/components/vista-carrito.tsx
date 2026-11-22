"use client";

import Link from "next/link";
import { IconoCarrito } from "@/components/icono-carrito";
import { LineaCarrito } from "@/components/linea-carrito";
import { useCarrito, useLeerCarrito } from "@/lib/carrito";
import { BOTON_COMPRA, BOTON_PRINCIPAL, ENLACE } from "@/lib/estilos";
import { formatearPrecio } from "@/lib/juguetes";
import { useSesionObligatoria } from "@/lib/sesion-obligatoria";

/**
 * Contenido de la página del carrito: cada juguete con su cantidad y «Quitar» (HU-06), los
 * subtotales y el total (HU-07), y «Comprar», que lleva a los datos de entrega (HU-08).
 * Si está vacío, «Tu carrito está vacío» con un enlace al catálogo.
 * Necesita sesión iniciada; el carrito se guarda en la base de datos.
 */
export function VistaCarrito() {
  const sesion = useSesionObligatoria("/carrito");
  const carrito = useCarrito();
  const token = sesion?.token;
  const { fallo, volverALeer } = useLeerCarrito(token);

  if (!token || (!carrito && !fallo)) {
    return (
      <div aria-busy="true" className="mt-8 flex flex-col gap-4">
        <p role="status" className="text-sm text-zinc-600 dark:text-zinc-400">
          Cargando tu carrito…
        </p>
        {[0, 1].map((fila) => (
          <div key={fila} className="h-24 animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-800" />
        ))}
      </div>
    );
  }

  if (!carrito) {
    return (
      <div role="alert" className="mt-12 flex flex-col items-center gap-4 text-center">
        <p className="text-lg font-medium">La tienda no responde en este momento.</p>
        <button type="button" onClick={volverALeer} className={BOTON_PRINCIPAL}>
          Reintentar
        </button>
      </div>
    );
  }

  if (carrito.items.length === 0) {
    return (
      <div className="mt-8 flex flex-col items-center gap-4 rounded-2xl border border-dashed border-zinc-300 px-6 py-14 text-center dark:border-zinc-700">
        <IconoCarrito className="h-12 w-12 text-zinc-400" />
        <p className="text-xl font-semibold">Tu carrito está vacío</p>
        <p className="max-w-sm text-zinc-600 dark:text-zinc-400">
          Mira el catálogo y agrega los juguetes que quieras comprar.
        </p>
        <Link href="/" className={BOTON_PRINCIPAL}>
          Ver el catálogo
        </Link>
      </div>
    );
  }

  const unidades = carrito.unidades === 1 ? "1 unidad" : `${carrito.unidades} unidades`;
  return (
    <section>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">
        {unidades} en tu carrito. Puedes cambiar las cantidades o quitar juguetes antes de comprar.
      </p>
      <ul className="mt-6 divide-y divide-zinc-200 border-y border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
        {carrito.items.map((item) => (
          <LineaCarrito key={item.id} item={item} token={token} onRecargar={volverALeer} />
        ))}
      </ul>
      {/* HU-07: suma de los subtotales. Llega en cada respuesta de la API, así que cambia con cada ajuste. */}
      <div className="mt-6 flex items-center justify-between gap-4 rounded-2xl bg-amber-50 px-5 py-4 dark:bg-zinc-900">
        <p className="font-semibold">
          Total <span className="text-sm font-normal text-zinc-600 dark:text-zinc-400">({unidades})</span>
        </p>
        <p aria-live="polite" className="text-2xl font-bold tabular-nums">
          {formatearPrecio(carrito.total)}
        </p>
      </div>
      <div className="mt-6 flex flex-col-reverse items-stretch gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Link href="/" className={`${ENLACE} text-center`}>
          ← Seguir comprando
        </Link>
        {/* HU-08: lleva a los datos de entrega; el stock de cada juguete se verifica al generar el pedido. */}
        <Link href="/comprar" className={BOTON_COMPRA}>
          Comprar
        </Link>
      </div>
    </section>
  );
}
