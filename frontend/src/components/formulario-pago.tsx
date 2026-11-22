"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { CampoFormulario } from "@/components/campo-formulario";
import { BOTON_COMPRA } from "@/lib/estilos";
import { formatearPrecio } from "@/lib/juguetes";
import {
  formatearNumeroTarjeta,
  formatearVencimiento,
  pagarPedido,
  validarTarjeta,
  type DatosTarjeta,
  type ErroresTarjeta,
  type FaltaStock,
  type Pago,
} from "@/lib/pagos";
import { borrarSesion } from "@/lib/sesion";

type Campo = keyof DatosTarjeta;

/** Campos en el orden de la pantalla: el foco va al primero que hay que corregir. */
const CAMPOS: {
  campo: Campo;
  etiqueta: string;
  autocompletar: string;
  /** Número y titular ocupan toda la fila; vencimiento y CVV van lado a lado. */
  filaCompleta: boolean;
  numerico: boolean;
  largoMaximo?: number;
  marcador?: string;
  ayuda?: string;
}[] = [
  {
    campo: "numero",
    etiqueta: "Número de tarjeta",
    autocompletar: "cc-number",
    filaCompleta: true,
    numerico: true,
    largoMaximo: 19,
    marcador: "0000 0000 0000 0000",
  },
  {
    campo: "titular",
    etiqueta: "Nombre del titular",
    autocompletar: "cc-name",
    filaCompleta: true,
    numerico: false,
    ayuda: "Tal como aparece en la tarjeta.",
  },
  {
    campo: "vencimiento",
    etiqueta: "Vencimiento",
    autocompletar: "cc-exp",
    filaCompleta: false,
    numerico: true,
    largoMaximo: 5,
    marcador: "MM/AA",
  },
  {
    campo: "cvv",
    etiqueta: "CVV",
    autocompletar: "cc-csc",
    filaCompleta: false,
    numerico: true,
    largoMaximo: 3,
    ayuda: "3 dígitos al reverso.",
  },
];

/** Aviso que reemplaza al formulario cuando el pago no se completó. */
type Aviso =
  | { tipo: "rechazado" }
  | { tipo: "sin-stock"; juguetes: FaltaStock[] }
  | { tipo: "error"; mensaje: string };

interface Props {
  token: string;
  numero: string;
  total: number;
  onPagado: (pago: Pago) => void;
  /** El pedido ya estaba pagado o ya no existe: la página vuelve a leerlo. */
  onReleer: () => void;
}

/**
 * Pago con tarjeta simulada (HU-09, CU-10). Valida la tarjeta antes de enviar; si la API la
 * rechaza (termina en 0000) o algún juguete se quedó sin stock, explica qué pasó y deja
 * reintentar. Mientras se procesa, el botón queda desactivado para no pagar dos veces.
 */
export function FormularioPago({ token, numero, total, onPagado, onReleer }: Props) {
  const [valores, setValores] = useState<DatosTarjeta>({ numero: "", titular: "", vencimiento: "", cvv: "" });
  const [errores, setErrores] = useState<ErroresTarjeta>({});
  const [aviso, setAviso] = useState<Aviso | null>(null);
  const [enviando, setEnviando] = useState(false);
  const entradas = useRef<Partial<Record<Campo, HTMLInputElement | null>>>({});
  const refAviso = useRef<HTMLDivElement>(null);

  // El aviso recibe el foco para que se lea apenas aparece.
  useEffect(() => {
    if (aviso) refAviso.current?.focus();
  }, [aviso]);

  function cambiar(campo: Campo, valor: string) {
    setValores((anteriores) => {
      if (campo === "numero") return { ...anteriores, numero: formatearNumeroTarjeta(valor) };
      if (campo === "vencimiento")
        return { ...anteriores, vencimiento: formatearVencimiento(valor, anteriores.vencimiento) };
      if (campo === "cvv") return { ...anteriores, cvv: valor.replace(/\D/g, "").slice(0, 3) };
      return { ...anteriores, [campo]: valor };
    });
    setErrores((anteriores) => ({ ...anteriores, [campo]: undefined }));
  }

  /** Muestra el mensaje de cada campo y lleva el foco al primero que hay que corregir. */
  function mostrarErrores(nuevos: ErroresTarjeta): boolean {
    setErrores(nuevos);
    const primero = CAMPOS.find(({ campo }) => nuevos[campo]);
    if (primero) entradas.current[primero.campo]?.focus();
    return Boolean(primero);
  }

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (enviando) return;
    setAviso(null);
    if (mostrarErrores(validarTarjeta(valores))) return;

    setEnviando(true);
    try {
      const resultado = await pagarPedido(token, numero, valores);
      if (resultado.tipo === "aprobado") {
        onPagado(resultado.pago);
      } else if (resultado.tipo === "datos-invalidos") {
        if (!mostrarErrores(resultado.errores))
          setAviso({ tipo: "error", mensaje: "Revisa los datos de la tarjeta." });
      } else if (resultado.tipo === "rechazado") {
        setAviso({ tipo: "rechazado" });
      } else if (resultado.tipo === "sin-stock") {
        setAviso({ tipo: "sin-stock", juguetes: resultado.juguetes });
      } else if (resultado.tipo === "sesion-vencida") {
        borrarSesion(); // 401: sin sesión, la página lleva a iniciarla y vuelve aquí.
      } else {
        onReleer(); // Ya pagado (otra pestaña) o ya no existe: se muestra el estado actual.
      }
    } catch {
      setAviso({ tipo: "error", mensaje: "No pudimos conectar con la tienda. Inténtalo de nuevo en unos segundos." });
    } finally {
      setEnviando(false);
    }
  }

  return (
    <section
      aria-labelledby="titulo-pago"
      className="mt-8 rounded-2xl border border-zinc-200 p-5 sm:p-6 dark:border-zinc-800"
    >
      <h2 id="titulo-pago" className="text-xl font-semibold">
        Pago con tarjeta
      </h2>
      <div className="mt-3 rounded-lg bg-sky-50 px-4 py-3 text-sm text-sky-900 dark:bg-sky-950 dark:text-sky-200">
        <p className="font-semibold">Pago simulado: no uses una tarjeta real.</p>
        <p className="mt-1">
          Cualquier número de 16 dígitos se aprueba. Si termina en <strong>0000</strong>, el pago se rechaza, para probar
          ese caso.
        </p>
      </div>

      <form noValidate onSubmit={enviar} className="mt-5 flex flex-col gap-5">
        <div className="grid grid-cols-2 gap-x-4 gap-y-5">
          {CAMPOS.map(({ campo, filaCompleta, numerico, ...configuracion }) => (
            <div key={campo} className={filaCompleta ? "col-span-2" : undefined}>
              <CampoFormulario
                {...configuracion}
                campo={campo}
                tipo="text"
                modoTeclado={numerico ? "numeric" : undefined}
                valor={valores[campo]}
                error={errores[campo]}
                onCambio={(valor) => cambiar(campo, valor)}
                ref={(elemento) => {
                  entradas.current[campo] = elemento;
                }}
              />
            </div>
          ))}
        </div>

        {aviso && (
          <div
            ref={refAviso}
            role="alert"
            tabIndex={-1}
            className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 outline-none dark:border-red-900 dark:bg-red-950 dark:text-red-200"
          >
            {aviso.tipo === "rechazado" && (
              <>
                <p className="text-base font-semibold">Pago rechazado</p>
                <p className="mt-1">
                  La tarjeta no fue aprobada. No se cobró nada y tu pedido sigue Pendiente: puedes intentarlo de nuevo
                  con otra tarjeta.
                </p>
              </>
            )}
            {aviso.tipo === "sin-stock" && (
              <>
                <p className="text-base font-semibold">No pudimos completar el pago</p>
                <p className="mt-1">Mientras pagabas, otro cliente compró las últimas unidades de:</p>
                <ul className="mt-2 list-disc pl-5">
                  {aviso.juguetes.map((juguete) => (
                    <li key={juguete.jugueteId}>
                      <strong>{juguete.nombre}</strong>: {juguete.mensaje.toLowerCase()}
                    </li>
                  ))}
                </ul>
                <p className="mt-2">No se cobró nada ni se descontó el stock. Tu pedido sigue Pendiente.</p>
              </>
            )}
            {aviso.tipo === "error" && <p>{aviso.mensaje}</p>}
          </div>
        )}

        <div className="flex flex-col gap-2">
          <button type="submit" disabled={enviando} className={BOTON_COMPRA}>
            {enviando ? "Procesando el pago…" : `Pagar ${formatearPrecio(total)}`}
          </button>
          <p role={enviando ? "status" : undefined} className="text-center text-sm text-zinc-500 dark:text-zinc-400">
            {enviando
              ? "No cierres esta página. Si la tienda estuvo inactiva, puede tardar hasta un minuto."
              : "Es un pago de prueba: no se hace ningún cobro real."}
          </p>
        </div>
      </form>
    </section>
  );
}
