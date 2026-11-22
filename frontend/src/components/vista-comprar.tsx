"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FormularioEntrega } from "@/components/formulario-entrega";
import { IconoCarrito } from "@/components/icono-carrito";
import { CARRITO_VACIO, guardarCarrito, useCarrito, useLeerCarrito, type Carrito, type ItemCarrito } from "@/lib/carrito";
import { BOTON_PRINCIPAL, ENLACE } from "@/lib/estilos";
import { formatearPrecio } from "@/lib/juguetes";
import type { Pedido } from "@/lib/pedidos";
import { useSesionObligatoria } from "@/lib/sesion-obligatoria";

/** Aviso de una línea cuya cantidad ya supera el stock (otro cliente compró mientras tanto). */
function faltaStock(item: ItemCarrito): string | null {
  if (item.cantidad <= item.stock) return null;
  if (item.stock === 0) return "Se agotó: quítalo de tu carrito";
  return item.stock === 1 ? "Solo queda 1 unidad: baja la cantidad" : `Solo quedan ${item.stock} unidades: baja la cantidad`;
}

/** Resumen del carrito junto al formulario: cada juguete, su subtotal y el total (HU-08, criterio 1). */
function ResumenCompra({ carrito }: { carrito: Carrito }) {
  const unidades = carrito.unidades === 1 ? "1 unidad" : `${carrito.unidades} unidades`;
  return (
    <>
      <h2 id="titulo-resumen" className="text-lg font-semibold">
        Resumen de tu carrito
      </h2>
      <ul className="mt-4 flex flex-col gap-4">
        {carrito.items.map((item) => {
          const aviso = faltaStock(item);
          return (
            <li key={item.id} className="flex items-start gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.imagenUrl} alt="" className="h-12 w-14 shrink-0 rounded-lg bg-zinc-100 object-cover dark:bg-zinc-800" />
              <div className="min-w-0 flex-1">
                <p className="font-medium leading-snug">{item.nombre}</p>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  {item.cantidad} × {formatearPrecio(item.precio)}
                </p>
                {aviso && <p className="text-sm font-medium text-red-700 dark:text-red-400">{aviso}</p>}
              </div>
              <p className="font-semibold tabular-nums">{formatearPrecio(item.subtotal)}</p>
            </li>
          );
        })}
      </ul>
      <div className="mt-5 flex items-center justify-between gap-4 border-t border-amber-200 pt-4 dark:border-zinc-700">
        <p className="font-semibold">
          Total <span className="text-sm font-normal text-zinc-600 dark:text-zinc-400">({unidades})</span>
        </p>
        <p aria-live="polite" className="text-2xl font-bold tabular-nums">
          {formatearPrecio(carrito.total)}
        </p>
      </div>
      <p className="mt-4 text-sm">
        <Link href="/carrito" className={ENLACE}>
          Cambiar cantidades en mi carrito
        </Link>
      </p>
    </>
  );
}

/**
 * Página «Comprar» (HU-08, CU-09 Realizar compra): el formulario de entrega junto al resumen
 * del carrito. Al generar el pedido, el carrito queda vacío y se pasa a la página de pago.
 */
export function VistaComprar() {
  const router = useRouter();
  const sesion = useSesionObligatoria("/comprar");
  const carrito = useCarrito();
  const token = sesion?.token;
  const { fallo, volverALeer } = useLeerCarrito(token);
  const [generado, setGenerado] = useState<string | null>(null);

  function alGenerar(pedido: Pedido) {
    setGenerado(pedido.numero);
    // La API ya vació el carrito: el contador del encabezado pasa a 0.
    guardarCarrito(CARRITO_VACIO);
    router.push(`/pedidos/${encodeURIComponent(pedido.numero)}/pago`);
  }

  if (generado) {
    return (
      <p role="status" className="mt-8 text-zinc-700 dark:text-zinc-300">
        Pedido <strong>{generado}</strong> generado. Te llevamos al pago…
      </p>
    );
  }

  if (!sesion || (!carrito && !fallo)) {
    return (
      <div aria-busy="true" className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <p role="status" className="sr-only">
          Cargando tu carrito…
        </p>
        <div className="h-96 animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-800" />
        <div className="h-64 animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-800" />
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
        <p className="max-w-sm text-zinc-600 dark:text-zinc-400">Agrega juguetes a tu carrito para poder comprarlos.</p>
        <Link href="/" className={BOTON_PRINCIPAL}>
          Ver el catálogo
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
      {/* En el celular el resumen va primero, para ver el total antes de completar el formulario. */}
      <aside
        aria-labelledby="titulo-resumen"
        className="rounded-2xl bg-amber-50 p-5 lg:sticky lg:top-6 lg:col-start-2 lg:row-start-1 dark:bg-zinc-900"
      >
        <ResumenCompra carrito={carrito} />
      </aside>
      <section aria-labelledby="titulo-entrega" className="lg:col-start-1 lg:row-start-1">
        <h2 id="titulo-entrega" className="text-lg font-semibold">
          Datos de entrega
        </h2>
        <FormularioEntrega
          token={sesion.token}
          nombreInicial={sesion.usuario.nombre}
          onGenerado={alGenerar}
          onRevisarCarrito={volverALeer}
        />
      </section>
    </div>
  );
}
