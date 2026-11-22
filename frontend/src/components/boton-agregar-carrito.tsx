/**
 * Botón «Agregar al carrito» del catálogo y del detalle. Solo se muestra si el juguete tiene stock.
 * Su acción llega con HU-05 (agregar un juguete al carrito).
 */
export function BotonAgregarCarrito({ className = "" }: { className?: string }) {
  return (
    <button
      type="button"
      className={`h-10 rounded-full bg-amber-500 px-5 text-sm font-semibold text-zinc-950 transition-colors hover:bg-amber-400 ${className}`}
    >
      Agregar al carrito
    </button>
  );
}
