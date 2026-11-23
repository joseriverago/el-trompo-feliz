"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FormularioJuguete } from "@/components/formulario-juguete";
import { obtenerCategorias, type Categoria } from "@/lib/categorias";
import { BOTON_PRINCIPAL, ENLACE } from "@/lib/estilos";
import { obtenerJuguete, type JugueteDetalle } from "@/lib/juguetes";
import { useSesion } from "@/lib/sesion";

type Lectura = { categorias: Categoria[]; juguete?: JugueteDetalle } | "no-encontrado" | "fallo" | null;

/**
 * Página «Nuevo juguete» o «Editar juguete» (HU-12): lee las categorías y, al editar, el juguete;
 * al guardar vuelve a la lista con el aviso «Juguete guardado».
 */
export function VistaFormularioJuguete({ id }: { id?: string }) {
  const router = useRouter();
  const token = useSesion()?.token;
  const [lectura, setLectura] = useState<Lectura>(null);
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    const controlador = new AbortController();
    Promise.all([obtenerCategorias(controlador.signal), id ? obtenerJuguete(id, controlador.signal) : undefined])
      .then(([categorias, juguete]) => setLectura(juguete === null ? "no-encontrado" : { categorias, juguete }))
      .catch(() => {
        if (!controlador.signal.aborted) setLectura("fallo");
      });
    return () => controlador.abort();
  }, [id, intento]);

  const titulo = id ? "Editar juguete" : "Nuevo juguete";
  const volver = (
    <Link href="/admin/juguetes" className={`mt-6 inline-block ${ENLACE}`}>
      ← Volver a los juguetes
    </Link>
  );

  if (lectura === "no-encontrado") {
    return (
      <div className="mt-8 flex flex-col items-center gap-4 rounded-2xl border border-dashed border-zinc-300 px-6 py-14 text-center dark:border-zinc-700">
        <p className="text-xl font-semibold">Juguete no encontrado</p>
        <p className="max-w-sm text-zinc-600 dark:text-zinc-400">No existe o fue eliminado del catálogo.</p>
        <Link href="/admin/juguetes" className={BOTON_PRINCIPAL}>
          Ver los juguetes
        </Link>
      </div>
    );
  }

  return (
    <section className="mt-6 max-w-3xl">
      <h1 className="text-3xl font-bold tracking-tight">{titulo}</h1>
      {lectura === null || !token ? (
        <div aria-busy="true" className="mt-6 grid gap-5 sm:grid-cols-2">
          <p role="status" className="text-sm text-zinc-600 sm:col-span-2 dark:text-zinc-400">
            Cargando el formulario…
          </p>
          {[0, 1, 2, 3].map((fila) => (
            <div key={fila} className="h-16 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-800" />
          ))}
        </div>
      ) : lectura === "fallo" ? (
        <div role="alert" className="mt-10 flex flex-col items-start gap-4">
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
      ) : (
        <FormularioJuguete
          token={token}
          categorias={lectura.categorias}
          juguete={lectura.juguete}
          onGuardado={(guardado) => router.push(`/admin/juguetes?guardado=${guardado.id}`)}
        />
      )}
      {volver}
    </section>
  );
}
