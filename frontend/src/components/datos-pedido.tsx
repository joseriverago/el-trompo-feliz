import { EtiquetaEstado } from "@/components/etiqueta-estado";
import { formatearPrecio } from "@/lib/juguetes";
import type { Pedido } from "@/lib/pedidos";

/** 987654321 → 987 654 321, más fácil de leer. */
function formatearTelefono(telefono: string): string {
  return telefono.replace(/^(\d{3})(\d{3})(\d{3})$/, "$1 $2 $3");
}

/**
 * Número, estado y total del pedido, sus juguetes con cantidades y precios, y los datos de
 * entrega. Lo usan la página de pago (HU-09) y el detalle del pedido (HU-11).
 */
export function DatosPedido({ pedido }: { pedido: Pedido }) {
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
            <EtiquetaEstado estado={pedido.estado} />
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
