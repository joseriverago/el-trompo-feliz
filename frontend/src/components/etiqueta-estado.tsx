import { NOMBRE_ESTADO, type EstadoPedido } from "@/lib/pedidos";

/** Pendiente en ámbar; Pagado y los estados siguientes en verde. */
const COLOR_ESTADO: Record<EstadoPedido, string> = {
  PENDIENTE: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
  PAGADO: "bg-green-100 text-green-900 dark:bg-green-950 dark:text-green-200",
  ENVIADO: "bg-green-100 text-green-900 dark:bg-green-950 dark:text-green-200",
  ENTREGADO: "bg-green-100 text-green-900 dark:bg-green-950 dark:text-green-200",
};

/** El estado del pedido como etiqueta de color: Pendiente, Pagado, Enviado o Entregado. */
export function EtiquetaEstado({ estado }: { estado: EstadoPedido }) {
  return (
    <span className={`whitespace-nowrap rounded-full px-3 py-0.5 text-sm font-semibold ${COLOR_ESTADO[estado]}`}>
      {NOMBRE_ESTADO[estado]}
    </span>
  );
}
