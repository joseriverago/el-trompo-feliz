"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { CampoFormulario } from "@/components/campo-formulario";
import { BOTON_COMPRA } from "@/lib/estilos";
import {
  generarPedido,
  validarEntrega,
  type DatosEntrega,
  type ErroresEntrega,
  type JugueteSinStock,
  type Pedido,
} from "@/lib/pedidos";
import { borrarSesion } from "@/lib/sesion";

type Campo = keyof DatosEntrega;

const CAMPOS: { campo: Campo; etiqueta: string; tipo: string; autocompletar: string; ayuda?: string }[] = [
  { campo: "destinatario", etiqueta: "Nombre de quien recibe", tipo: "text", autocompletar: "name" },
  {
    campo: "telefono",
    etiqueta: "Teléfono",
    tipo: "tel",
    autocompletar: "tel-national",
    ayuda: "Celular de 9 dígitos, por ejemplo 987 654 321.",
  },
  {
    campo: "direccion",
    etiqueta: "Dirección",
    tipo: "text",
    autocompletar: "street-address",
    ayuda: "Calle o avenida, número y, si hay, departamento.",
  },
  { campo: "distrito", etiqueta: "Distrito", tipo: "text", autocompletar: "address-level2" },
  {
    campo: "referencia",
    etiqueta: "Referencia (opcional)",
    tipo: "text",
    autocompletar: "off",
    ayuda: "Por ejemplo: frente al parque, puerta verde.",
  },
];

interface Props {
  token: string;
  /** Se propone el nombre del cliente como quien recibe; se puede cambiar. */
  nombreInicial: string;
  onGenerado: (pedido: Pedido) => void;
  /** Vuelve a leer el carrito, para que el resumen muestre el stock actual. */
  onRevisarCarrito: () => void;
}

/**
 * Formulario de entrega de «Comprar» (HU-08). Valida los campos antes de enviar (criterio 2);
 * si la API responde que algún juguete supera su stock, muestra cuáles ajustar (criterio 4).
 */
export function FormularioEntrega({ token, nombreInicial, onGenerado, onRevisarCarrito }: Props) {
  const [valores, setValores] = useState<DatosEntrega>({
    destinatario: nombreInicial,
    telefono: "",
    direccion: "",
    distrito: "",
    referencia: "",
  });
  const [errores, setErrores] = useState<ErroresEntrega>({});
  const [sinStock, setSinStock] = useState<JugueteSinStock[]>([]);
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const entradas = useRef<Partial<Record<Campo, HTMLInputElement | null>>>({});
  const avisoStock = useRef<HTMLDivElement>(null);

  // El aviso de stock recibe el foco para que se lea apenas aparece.
  useEffect(() => {
    if (sinStock.length > 0) avisoStock.current?.focus();
  }, [sinStock]);

  function cambiar(campo: Campo, valor: string) {
    setValores((anteriores) => ({ ...anteriores, [campo]: valor }));
    setErrores((anteriores) => ({ ...anteriores, [campo]: undefined }));
  }

  /** Muestra el mensaje de cada campo y lleva el foco al primero que hay que corregir. */
  function mostrarErrores(nuevos: ErroresEntrega): boolean {
    setErrores(nuevos);
    const primero = CAMPOS.find(({ campo }) => nuevos[campo]);
    if (primero) entradas.current[primero.campo]?.focus();
    return Boolean(primero);
  }

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErrorGeneral(null);
    setSinStock([]);
    if (mostrarErrores(validarEntrega(valores))) return;

    setEnviando(true);
    try {
      const resultado = await generarPedido(token, valores);
      if (resultado.tipo === "listo") {
        onGenerado(resultado.pedido);
      } else if (resultado.tipo === "datos-invalidos") {
        if (!mostrarErrores(resultado.errores)) setErrorGeneral("Revisa los datos de entrega.");
      } else if (resultado.tipo === "sin-stock") {
        setSinStock(resultado.juguetes);
        onRevisarCarrito();
      } else if (resultado.tipo === "revisar-carrito") {
        setErrorGeneral(resultado.mensaje);
        onRevisarCarrito();
      } else {
        borrarSesion(); // 401: sin sesión, la página lleva a iniciarla y vuelve aquí.
      }
    } catch {
      setErrorGeneral("No pudimos conectar con la tienda. Inténtalo de nuevo en unos segundos.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form noValidate onSubmit={enviar} className="mt-5 flex flex-col gap-5">
      {CAMPOS.map(({ campo, etiqueta, tipo, autocompletar, ayuda }) => (
        <CampoFormulario
          key={campo}
          campo={campo}
          etiqueta={etiqueta}
          tipo={tipo}
          autocompletar={autocompletar}
          ayuda={ayuda}
          valor={valores[campo]}
          error={errores[campo]}
          onCambio={(valor) => cambiar(campo, valor)}
          ref={(elemento) => {
            entradas.current[campo] = elemento;
          }}
        />
      ))}

      {sinStock.length > 0 && (
        <div
          ref={avisoStock}
          role="alert"
          tabIndex={-1}
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 outline-none dark:border-red-900 dark:bg-red-950 dark:text-red-200"
        >
          <p className="font-semibold">No generamos tu pedido: ajusta estos juguetes en tu carrito.</p>
          <ul className="mt-2 list-disc pl-5">
            {sinStock.map((juguete) => (
              <li key={juguete.itemId}>
                <strong>{juguete.nombre}</strong>: {juguete.mensaje.toLowerCase()}
              </li>
            ))}
          </ul>
          <Link href="/carrito" className="mt-3 inline-block font-semibold underline">
            Ajustar mi carrito
          </Link>
        </div>
      )}

      {errorGeneral && (
        <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {errorGeneral}
        </p>
      )}

      <div className="flex flex-col gap-2">
        <button type="submit" disabled={enviando} className={BOTON_COMPRA}>
          {enviando ? "Generando tu pedido…" : "Continuar al pago"}
        </button>
        <p role={enviando ? "status" : undefined} className="text-center text-sm text-zinc-500 dark:text-zinc-400">
          {enviando
            ? "Si la tienda estuvo inactiva, puede tardar hasta un minuto."
            : "Se genera tu pedido y pasas al pago. Todavía no se cobra nada."}
        </p>
      </div>
    </form>
  );
}
