import { formatearEdad, formatearPrecio, type JugueteCatalogo } from "@/lib/juguetes";

export function TarjetaJuguete({ juguete }: { juguete: JugueteCatalogo }) {
  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="relative aspect-[3/2] bg-zinc-100 dark:bg-zinc-800">
        {/* <img> y no next/image: el administrador puede registrar imágenes de cualquier sitio. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={juguete.imagenUrl}
          alt={juguete.nombre}
          loading="lazy"
          className={`h-full w-full object-cover ${juguete.agotado ? "opacity-60 grayscale" : ""}`}
        />
        {juguete.agotado && (
          <span className="absolute left-3 top-3 rounded-full bg-red-600 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
            Agotado
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400">
          {juguete.categoria.nombre}
        </p>
        <h2 className="text-base font-semibold leading-snug">{juguete.nombre}</h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Edad recomendada: {formatearEdad(juguete.edadMinima, juguete.edadMaxima)}
        </p>
        <div className="mt-auto flex flex-col gap-3 pt-3">
          <p className="text-xl font-bold">{formatearPrecio(juguete.precio)}</p>
          {juguete.agotado ? (
            <p className="flex h-10 items-center justify-center rounded-full bg-zinc-100 text-sm text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
              Sin unidades por ahora
            </p>
          ) : (
            // La acción del botón llega con HU-05 (agregar un juguete al carrito).
            <button
              type="button"
              className="h-10 rounded-full bg-amber-500 px-4 text-sm font-semibold text-zinc-950 transition-colors hover:bg-amber-400"
            >
              Agregar al carrito
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
