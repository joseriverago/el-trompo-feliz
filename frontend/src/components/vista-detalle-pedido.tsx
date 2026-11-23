"use client";

import Link from "next/link";
import { DatosPedido } from "@/components/datos-pedido";
import { BOTON_COMPRA, BOTON_PRINCIPAL, ENLACE } from "@/lib/estilos";
import { formatearFechaPedido, NOMBRE_ESTADO, type EstadoPedido } from "@/lib/pedidos";
import { useSesionObligatoria } from "@/lib/sesion-obligatoria";
import { useLecturaPedido } from "@/lib/usar-pedido";

const ETAPAS: EstadoPedido[] = ["PENDIENTE", "PAGADO", "ENVIADO", "ENTREGADO"];

/** Las 4 etapas del pedido; las ya cumplidas y la actual se marcan. */
function SeguimientoPedido({ estado }: { estado: EstadoPedido }) {
  const actual = ETAPAS.indexOf(estado);
  return (
    <ol aria-label="Seguimiento del pedido" className="mt-6 grid grid-cols-4 gap-2 text-center text-xs sm:text-sm">
      {ETAPAS.map((etapa, posicion) => {
        const cumplida = posicion <= actual;
        return (
          <li key={etapa} aria-current={posicion === actual ? "step" : undefined} className="flex flex-col items-center gap-2">
            <span
              className={`h-2 w-full rounded-full ${cumplida ? "bg-amber-500" : "bg-zinc-200 dark:bg-zinc-800"}`}
              aria-hidden="true"
            />
            <span
              className={
                posicion === actual
                  ? "font-semibold"
                  : cumplida
                    ? "text-zinc-700 dark:text-zinc-300"
                    : "text-zinc-400 dark:text-zinc-500"
              }
            >
              {NOMBRE_ESTADO[etapa]}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

/**
 * Detalle de un pedido del cliente (HU-11): juguetes, cantidades, precios, total, entrega y
 * estado actual. Si está Pendiente, ofrece «Pagar ahora». Con el número de un pedido ajeno, la
 * API responde 404 y la página muestra «Pedido no encontrado», sin ningún dato del pedido.
 */
export function VistaDetallePedido({ numero }: { numero: string }) {
  const sesion = useSesionObligatoria(`/pedidos/${encodeURIComponent(numero)}`);
  const token = sesion?.token;
  const { lectura, releer } = useLecturaPedido(token, numero);

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
        <p className="text-xl font-semibold">Pedido no encontrado</p>
        <p className="max-w-sm text-zinc-600 dark:text-zinc-400">
          Revisa el número o búscalo en la lista de tus pedidos.
        </p>
        <Link href="/pedidos" className={BOTON_PRINCIPAL}>
          Ver mis pedidos
        </Link>
      </div>
    );
  }

  const { pedido } = lectura;
  return (
    <>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">
        {/* Sin punto final: la hora ya termina en «a. m.» o «p. m.». */}
        Pedido hecho el <time dateTime={pedido.creadoEn}>{formatearFechaPedido(pedido.creadoEn)}</time>
      </p>
      <SeguimientoPedido estado={pedido.estado} />
      {pedido.estado === "PENDIENTE" && (
        <div className="mt-6 flex flex-col items-start gap-4 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-amber-900 dark:bg-zinc-900">
          <p className="text-amber-950 dark:text-amber-100">
            <span className="font-semibold">Este pedido espera tu pago.</span> Págalo para confirmar tu compra.
          </p>
          <Link href={`/pedidos/${encodeURIComponent(pedido.numero)}/pago`} className={BOTON_COMPRA}>
            Pagar ahora
          </Link>
        </div>
      )}
      <DatosPedido pedido={pedido} />
      <p className="mt-8">
        <Link href="/pedidos" className={ENLACE}>
          ← Volver a mis pedidos
        </Link>
      </p>
    </>
  );
}
