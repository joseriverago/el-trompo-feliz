"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { DatosPedido } from "@/components/datos-pedido";
import { FormularioPago } from "@/components/formulario-pago";
import { BOTON_PRINCIPAL } from "@/lib/estilos";
import { formatearPrecio } from "@/lib/juguetes";
import type { Pago } from "@/lib/pagos";
import type { Pedido } from "@/lib/pedidos";
import { useSesionObligatoria } from "@/lib/sesion-obligatoria";
import { useLecturaPedido } from "@/lib/usar-pedido";

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
        Tu número de pedido es <strong className="whitespace-nowrap font-mono">{pedido.numero}</strong>.
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
  const { lectura, setLectura, releer } = useLecturaPedido(token, numero);
  /** El pago recién aprobado en esta página, para mostrar el monto y los últimos 4 dígitos. */
  const [pago, setPago] = useState<Pago | null>(null);

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
        <DatosPedido pedido={pedido} />
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
      <DatosPedido pedido={pedido} />
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
