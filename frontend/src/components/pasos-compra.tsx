const PASOS = ["Carrito", "Entrega", "Pago"] as const;

/** Dónde está el cliente dentro de la compra (CU-09): carrito, datos de entrega y pago. */
export function PasosCompra({ actual }: { actual: (typeof PASOS)[number] }) {
  const posicionActual = PASOS.indexOf(actual);
  return (
    <ol aria-label="Pasos de la compra" className="flex flex-wrap items-center gap-2 text-sm">
      {PASOS.map((paso, posicion) => {
        const estilo =
          posicion === posicionActual
            ? "bg-amber-500 text-zinc-950"
            : posicion < posicionActual
              ? "bg-amber-100 text-amber-900 dark:bg-zinc-800 dark:text-amber-300"
              : "bg-zinc-100 text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400";
        return (
          <li key={paso} className="flex items-center gap-2">
            {posicion > 0 && <span aria-hidden="true" className="h-px w-5 bg-zinc-300 dark:bg-zinc-700" />}
            <span
              aria-current={posicion === posicionActual ? "step" : undefined}
              className={`rounded-full px-3 py-1 font-semibold ${estilo}`}
            >
              {posicion + 1}. {paso}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
