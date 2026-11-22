"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { IconoCarrito } from "@/components/icono-carrito";
import { LineaCarrito } from "@/components/linea-carrito";
import { guardarCarrito, obtenerCarrito, useCarrito } from "@/lib/carrito";
import { ENLACE } from "@/lib/estilos";
import { formatearPrecio } from "@/lib/juguetes";
import { rutaIniciarSesion } from "@/lib/rutas";
import { borrarSesion, useSesion } from "@/lib/sesion";

const BOTON_PRINCIPAL =
  "rounded-full bg-amber-500 px-5 py-2 text-sm font-semibold text-zinc-950 transition-colors hover:bg-amber-400";

const RUTA = "/carrito";

/**
 * Contenido de la página del carrito: cada juguete con su cantidad y «Quitar» (HU-06), los
 * subtotales y el total (HU-07), o «Tu carrito está vacío» con un enlace al catálogo.
 * Necesita sesión iniciada; el carrito se guarda en la base de datos.
 */
export function VistaCarrito() {
  const router = useRouter();
  const sesion = useSesion();
  const carrito = useCarrito();
  const token = sesion?.token;
  const [fallo, setFallo] = useState(false);
  const [lectura, setLectura] = useState(0);

  // Sin sesión no hay carrito: se pide iniciarla y después se vuelve a esta página.
  useEffect(() => {
    if (sesion === null) router.replace(rutaIniciarSesion(RUTA));
  }, [sesion, router]);

  // Al abrir la página se vuelve a leer el carrito, para tener el stock actual de cada juguete.
  useEffect(() => {
    if (!token) return;
    const controlador = new AbortController();
    obtenerCarrito(token, controlador.signal)
      .then((leido) => {
        if (leido) guardarCarrito(leido);
        else borrarSesion(); // 401: el token ya no sirve.
      })
      .catch(() => {
        if (!controlador.signal.aborted) setFallo(true);
      });
    return () => controlador.abort();
  }, [token, lectura]);

  function volverALeer() {
    setFallo(false);
    setLectura((anterior) => anterior + 1);
  }

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
      <p className="mt-6">
        <Link href="/" className={ENLACE}>
          ← Seguir comprando
        </Link>
      </p>
    </section>
  );
}
