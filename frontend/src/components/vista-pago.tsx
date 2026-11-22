"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BOTON_PRINCIPAL } from "@/lib/estilos";
import { formatearPrecio } from "@/lib/juguetes";
import { NOMBRE_ESTADO, obtenerPedido, type LecturaPedido, type Pedido } from "@/lib/pedidos";
import { borrarSesion } from "@/lib/sesion";
import { useSesionObligatoria } from "@/lib/sesion-obligatoria";

/** 987654321 → 987 654 321, más fácil de leer. */
function formatearTelefono(telefono: string): string {
  return telefono.replace(/^(\d{3})(\d{3})(\d{3})$/, "$1 $2 $3");
}

function DatosDelPedido({ pedido }: { pedido: Pedido }) {
  const { entrega } = pedido;
  const unidades = pedido.unidades === 1 ? "1 unidad" : `${pedido.unidades} unidades`;
  return (
    <>
      <dl className="mt-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-zinc-200 px-4 py-3 dark:border-zinc-800">
          <dt className="text-xs text-zinc-500 dark:text-zinc-400">Número de pedido</dt>
          <dd className="mt-1 font-mono text-lg font-bold">{pedido.numero}</dd>
        </div>
        <div className="rounded-2xl border border-zinc-200 px-4 py-3 dark:border-zinc-800">
          <dt className="text-xs text-zinc-500 dark:text-zinc-400">Estado</dt>
          <dd className="mt-1">
            <span className="rounded-full bg-amber-100 px-3 py-0.5 text-sm font-semibold text-amber-900 dark:bg-amber-950 dark:text-amber-200">
              {NOMBRE_ESTADO[pedido.estado]}
            </span>
          </dd>
        </div>
        <div className="rounded-2xl border border-zinc-200 px-4 py-3 dark:border-zinc-800">
          <dt className="text-xs text-zinc-500 dark:text-zinc-400">Total a pagar</dt>
          <dd className="mt-1 text-lg font-bold tabular-nums">{formatearPrecio(pedido.total)}</dd>
        </div>
      </dl>

      <div className="mt-8 grid gap-8 sm:grid-cols-2">
        <section aria-labelledby="titulo-juguetes">
          <h2 id="titulo-juguetes" className="font-semibold">
            Juguetes ({unidades})
          </h2>
          <ul className="mt-3 divide-y divide-zinc-200 border-y border-zinc-200 text-sm dark:divide-zinc-800 dark:border-zinc-800">
            {pedido.detalles.map((detalle) => (
              <li key={detalle.jugueteId} className="flex items-start justify-between gap-3 py-2.5">
                <span>
                  <span className="font-medium">{detalle.nombre}</span>
                  <span className="block text-zinc-600 dark:text-zinc-400">
                    {detalle.cantidad} × {formatearPrecio(detalle.precioUnitario)}
                  </span>
                </span>
                <span className="font-semibold tabular-nums">{formatearPrecio(detalle.subtotal)}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 flex justify-between font-semibold">
            Total <span className="tabular-nums">{formatearPrecio(pedido.total)}</span>
          </p>
        </section>

        <section aria-labelledby="titulo-entrega">
          <h2 id="titulo-entrega" className="font-semibold">
            Entrega
          </h2>
          <dl className="mt-3 flex flex-col gap-2 text-sm">
            <div>
              <dt className="text-zinc-500 dark:text-zinc-400">Recibe</dt>
              <dd className="font-medium">{entrega.destinatario}</dd>
            </div>
            <div>
              <dt className="text-zinc-500 dark:text-zinc-400">Teléfono</dt>
              <dd className="font-medium">{formatearTelefono(entrega.telefono)}</dd>
            </div>
            <div>
              <dt className="text-zinc-500 dark:text-zinc-400">Dirección</dt>
              <dd className="font-medium">
                {entrega.direccion}, {entrega.distrito}
              </dd>
            </div>
            {entrega.referencia && (
              <div>
                <dt className="text-zinc-500 dark:text-zinc-400">Referencia</dt>
                <dd className="font-medium">{entrega.referencia}</dd>
              </div>
            )}
          </dl>
        </section>
      </div>
    </>
  );
}

/**
 * Página de pago de un pedido (CU-09). En HU-08 muestra el pedido recién generado, Pendiente,
 * con su número, los juguetes al precio con que se compraron y la entrega. El pago con
 * tarjeta simulada se agrega en HU-09.
 */
export function VistaPago({ numero }: { numero: string }) {
  const sesion = useSesionObligatoria(`/pedidos/${encodeURIComponent(numero)}/pago`);
  const token = sesion?.token;
  const [lectura, setLectura] = useState<LecturaPedido | "fallo" | null>(null);
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    if (!token) return;
    const controlador = new AbortController();
    obtenerPedido(token, numero, controlador.signal)
      .then((leida) => {
        if (leida.tipo === "sesion-vencida") borrarSesion();
        else setLectura(leida);
      })
      .catch(() => {
        if (!controlador.signal.aborted) setLectura("fallo");
      });
    return () => controlador.abort();
  }, [token, numero, intento]);

  if (!token || lectura === null) {
    return (
      <div aria-busy="true" className="mt-8 flex flex-col gap-4">
        <p role="status" className="text-sm text-zinc-600 dark:text-zinc-400">
          Cargando tu pedido…
        </p>
        <div className="h-24 animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-800" />
        <div className="h-48 animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-800" />
      </div>
    );
  }

  if (lectura === "fallo") {
    return (
      <div role="alert" className="mt-12 flex flex-col items-center gap-4 text-center">
        <p className="text-lg font-medium">La tienda no responde en este momento.</p>
        <button
          type="button"
          onClick={() => {
            setLectura(null);
            setIntento((anterior) => anterior + 1);
          }}
          className={BOTON_PRINCIPAL}
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (lectura.tipo !== "listo") {
    return (
      <div className="mt-12 flex flex-col items-center gap-4 text-center">
        <p className="text-xl font-semibold">No encontramos este pedido</p>
        <p className="max-w-sm text-zinc-600 dark:text-zinc-400">Revisa el número o vuelve al catálogo.</p>
        <Link href="/" className={BOTON_PRINCIPAL}>
          Ver el catálogo
        </Link>
      </div>
    );
  }

  const { pedido } = lectura;
  return (
    <>
      {pedido.estado === "PENDIENTE" && (
        <div role="status" className="mt-6 rounded-2xl border border-green-200 bg-green-50 px-5 py-4 text-green-900 dark:border-green-900 dark:bg-green-950 dark:text-green-200">
          <p className="font-semibold">¡Tu pedido fue generado!</p>
          <p className="mt-1 text-sm">
            Guardamos tus datos de entrega y los juguetes con el precio que tenían al comprar.
          </p>
        </div>
      )}
      <DatosDelPedido pedido={pedido} />
      {pedido.estado === "PENDIENTE" && (
        <section aria-labelledby="titulo-pago" className="mt-8 rounded-2xl bg-amber-50 px-5 py-4 dark:bg-zinc-900">
          <h2 id="titulo-pago" className="font-semibold">
            Pago con tarjeta
          </h2>
          <p className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">
            Muy pronto podrás pagar aquí con una tarjeta simulada. Mientras tanto, tu pedido queda guardado como
            Pendiente.
          </p>
        </section>
      )}
    </>
  );
}
