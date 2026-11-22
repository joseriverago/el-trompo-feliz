"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { FormularioPago } from "@/components/formulario-pago";
import { BOTON_PRINCIPAL } from "@/lib/estilos";
import { formatearPrecio } from "@/lib/juguetes";
import type { Pago } from "@/lib/pagos";
import { NOMBRE_ESTADO, obtenerPedido, type EstadoPedido, type LecturaPedido, type Pedido } from "@/lib/pedidos";
import { borrarSesion } from "@/lib/sesion";
import { useSesionObligatoria } from "@/lib/sesion-obligatoria";

/** 987654321 → 987 654 321, más fácil de leer. */
function formatearTelefono(telefono: string): string {
  return telefono.replace(/^(\d{3})(\d{3})(\d{3})$/, "$1 $2 $3");
}

/** Pendiente en ámbar; Pagado y los estados siguientes en verde. */
const COLOR_ESTADO: Record<EstadoPedido, string> = {
  PENDIENTE: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
  PAGADO: "bg-green-100 text-green-900 dark:bg-green-950 dark:text-green-200",
  ENVIADO: "bg-green-100 text-green-900 dark:bg-green-950 dark:text-green-200",
  ENTREGADO: "bg-green-100 text-green-900 dark:bg-green-950 dark:text-green-200",
};

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
            <span className={`rounded-full px-3 py-0.5 text-sm font-semibold ${COLOR_ESTADO[pedido.estado]}`}>
              {NOMBRE_ESTADO[pedido.estado]}
            </span>
          </dd>
        </div>
        <div className="rounded-2xl border border-zinc-200 px-4 py-3 dark:border-zinc-800">
          <dt className="text-xs text-zinc-500 dark:text-zinc-400">
            {pedido.estado === "PENDIENTE" ? "Total a pagar" : "Total pagado"}
          </dt>
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

/** Confirmación del pago (HU-09, criterio 1): recibe el foco para que se lea apenas aparece. */
function ConfirmacionPago({ pedido, pago }: { pedido: Pedido; pago: Pago | null }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.focus();
  }, []);
  return (
    <div
      ref={ref}
      role="status"
      tabIndex={-1}
      className="mt-6 rounded-2xl border border-green-200 bg-green-50 px-5 py-4 text-green-900 outline-none dark:border-green-900 dark:bg-green-950 dark:text-green-200"
    >
      <p className="text-lg font-semibold">¡Pago aprobado! Tu compra está confirmada.</p>
      <p className="mt-1">
        Tu número de pedido es <strong className="font-mono">{pedido.numero}</strong>.
        {pago
          ? ` Pagaste ${formatearPrecio(pago.monto)} con la tarjeta terminada en ${pago.ultimosDigitos}.`
          : " Este pedido ya está pagado."}
      </p>
      <p className="mt-1 text-sm">Guarda el número: te servirá para consultar el estado de tu pedido.</p>
    </div>
  );
}

/**
 * Página de pago de un pedido (CU-09 y CU-10). Si el pedido está Pendiente, muestra sus
 * datos y el formulario de pago con tarjeta simulada (HU-09); al aprobarse el pago, la
 * confirmación con el número de pedido. Si ya estaba pagado, muestra directamente la confirmación.
 */
export function VistaPago({ numero }: { numero: string }) {
  const sesion = useSesionObligatoria(`/pedidos/${encodeURIComponent(numero)}/pago`);
  const token = sesion?.token;
  const [lectura, setLectura] = useState<LecturaPedido | "fallo" | null>(null);
  const [intento, setIntento] = useState(0);
  /** El pago recién aprobado en esta página, para mostrar el monto y los últimos 4 dígitos. */
  const [pago, setPago] = useState<Pago | null>(null);

  function releer() {
    setLectura(null);
    setIntento((anterior) => anterior + 1);
  }

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
        <button type="button" onClick={releer} className={BOTON_PRINCIPAL}>
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
  if (pedido.estado !== "PENDIENTE") {
    return (
      <>
        <ConfirmacionPago pedido={pedido} pago={pago} />
        <DatosDelPedido pedido={pedido} />
        <div className="mt-8">
          <Link href="/" className={BOTON_PRINCIPAL}>
            Seguir comprando
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <div role="status" className="mt-6 rounded-2xl border border-green-200 bg-green-50 px-5 py-4 text-green-900 dark:border-green-900 dark:bg-green-950 dark:text-green-200">
        <p className="font-semibold">¡Tu pedido fue generado!</p>
        <p className="mt-1 text-sm">
          Guardamos tus datos de entrega y los juguetes con el precio que tenían al comprar. Paga con tarjeta para
          confirmar tu compra.
        </p>
      </div>
      <DatosDelPedido pedido={pedido} />
      <FormularioPago
        token={token}
        numero={pedido.numero}
        total={pedido.total}
        onPagado={(aprobado) => {
          setPago(aprobado);
          setLectura({ tipo: "listo", pedido: { ...pedido, estado: aprobado.estado } });
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
        onReleer={releer}
      />
    </>
  );
}
