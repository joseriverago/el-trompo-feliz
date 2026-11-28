"use client";

import { useEffect, useState } from "react";
import { BuscadorCatalogo } from "@/components/buscador-catalogo";
import { TarjetaJuguete } from "@/components/tarjeta-juguete";
import { BOTON_PRINCIPAL } from "@/lib/estilos";
import { consultaCatalogo, mensajeSinResultados, type FiltrosCatalogo } from "@/lib/filtros-catalogo";
import { obtenerCatalogo, type JugueteCatalogo } from "@/lib/juguetes";

type Estado =
  | { tipo: "cargando" }
  | { tipo: "listo"; juguetes: JugueteCatalogo[] }
  | { tipo: "error" };

const CUADRICULA = "grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";

/**
 * Catálogo de juguetes con búsqueda (HU-16) y filtros (HU-17). Se carga en el navegador para mostrar un
 * aviso mientras la API despierta: en el plan gratuito de Render puede tardar alrededor de un minuto.
 */
export function Catalogo() {
  const [estado, setEstado] = useState<Estado>({ tipo: "cargando" });
  const [intento, setIntento] = useState(0);
  const [filtros, setFiltros] = useState<FiltrosCatalogo>({});

  useEffect(() => {
    const controlador = new AbortController();
    obtenerCatalogo(controlador.signal, filtros)
      .then((juguetes) => setEstado({ tipo: "listo", juguetes }))
      .catch(() => {
        if (!controlador.signal.aborted) setEstado({ tipo: "error" });
      });
    return () => controlador.abort();
  }, [intento, filtros]);

  /** Aplica otra búsqueda; si no cambia nada, no vuelve a pedir el catálogo. */
  function buscar(nuevos: FiltrosCatalogo) {
    if (consultaCatalogo(nuevos) === consultaCatalogo(filtros)) return;
    setEstado({ tipo: "cargando" });
    setFiltros(nuevos);
  }

  function reintentar() {
    setEstado({ tipo: "cargando" });
    setIntento((anterior) => anterior + 1);
  }

  return (
    <>
      <BuscadorCatalogo onBuscar={buscar} />
      <Resultados
        estado={estado}
        sinResultados={mensajeSinResultados(filtros)}
        onReintentar={reintentar}
      />
    </>
  );
}

interface PropsResultados {
  estado: Estado;
  /** Mensaje cuando no aparece ningún juguete. */
  sinResultados: string;
  onReintentar: () => void;
}

function Resultados({ estado, sinResultados, onReintentar }: PropsResultados) {
  if (estado.tipo === "cargando") {
    return (
      <section className="mt-8" aria-busy="true">
        <p role="status" className="text-sm text-zinc-600 dark:text-zinc-400">
          Cargando juguetes… Si la tienda estuvo inactiva, la primera carga puede tardar hasta un minuto.
        </p>
        <div className={`mt-6 ${CUADRICULA}`}>
          {Array.from({ length: 8 }, (_, indice) => (
            <div
              key={indice}
              className="h-80 animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-800"
            />
          ))}
        </div>
      </section>
    );
  }

  if (estado.tipo === "error") {
    return (
      <section role="alert" className="mt-12 flex flex-col items-center gap-4 text-center">
        <p className="text-lg font-medium">La tienda no responde en este momento.</p>
        <button
          type="button"
          onClick={onReintentar}
          className={BOTON_PRINCIPAL}
        >
          Reintentar
        </button>
      </section>
    );
  }

  if (estado.juguetes.length === 0) {
    return (
      <p role="status" className="mt-12 text-center text-lg text-zinc-600 dark:text-zinc-400">
        {sinResultados}
      </p>
    );
  }

  return (
    <section className="mt-8">
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        {estado.juguetes.length} {estado.juguetes.length === 1 ? "juguete" : "juguetes"}
      </p>
      <div className={`mt-4 ${CUADRICULA}`}>
        {estado.juguetes.map((juguete) => (
          <TarjetaJuguete key={juguete.id} juguete={juguete} />
        ))}
      </div>
    </section>
  );
}
