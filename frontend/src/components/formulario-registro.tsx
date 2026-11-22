"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import {
  registrar,
  validarRegistro,
  type DatosRegistro,
  type ErroresRegistro,
} from "@/lib/auth";
import { guardarSesion, useSesion } from "@/lib/sesion";

type Campo = keyof DatosRegistro;

const CAMPOS: { campo: Campo; etiqueta: string; tipo: string; autocompletar: string; ayuda?: string }[] = [
  { campo: "nombre", etiqueta: "Nombre", tipo: "text", autocompletar: "name" },
  { campo: "correo", etiqueta: "Correo", tipo: "email", autocompletar: "email" },
  {
    campo: "contrasena",
    etiqueta: "Contraseña",
    tipo: "password",
    autocompletar: "new-password",
    ayuda: "Al menos 8 caracteres.",
  },
];

const ENLACE = "font-medium text-amber-700 hover:underline dark:text-amber-400";

/** Formulario de registro de cliente (HU-03). Al crear la cuenta, la sesión queda iniciada. */
export function FormularioRegistro() {
  const router = useRouter();
  const sesion = useSesion();
  const [valores, setValores] = useState<DatosRegistro>({ nombre: "", correo: "", contrasena: "" });
  const [errores, setErrores] = useState<ErroresRegistro>({});
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [creada, setCreada] = useState(false);
  const entradas = useRef<Partial<Record<Campo, HTMLInputElement | null>>>({});

  function cambiar(campo: Campo, valor: string) {
    setValores((anteriores) => ({ ...anteriores, [campo]: valor }));
    // Al corregir un campo, su mensaje de error desaparece.
    setErrores((anteriores) => ({ ...anteriores, [campo]: undefined }));
  }

  function mostrarErrores(nuevos: ErroresRegistro): boolean {
    setErrores(nuevos);
    const primero = CAMPOS.find(({ campo }) => nuevos[campo]);
    if (primero) entradas.current[primero.campo]?.focus();
    return Boolean(primero);
  }

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErrorGeneral(null);
    if (mostrarErrores(validarRegistro(valores))) return;

    setEnviando(true);
    try {
      const resultado = await registrar(valores);
      if (resultado.ok) {
        setCreada(true);
        guardarSesion(resultado.sesion);
        router.push("/");
        return;
      }
      if (!mostrarErrores(resultado.errores)) {
        setErrorGeneral("No pudimos crear tu cuenta. Revisa los datos e inténtalo de nuevo.");
      }
    } catch {
      setErrorGeneral("No pudimos conectar con la tienda. Inténtalo de nuevo en unos segundos.");
    } finally {
      setEnviando(false);
    }
  }

  if (creada) {
    return (
      <p role="status" className="mt-8 text-zinc-700 dark:text-zinc-300">
        ¡Cuenta creada! Te llevamos al catálogo…
      </p>
    );
  }

  if (sesion) {
    return (
      <p className="mt-8 text-zinc-700 dark:text-zinc-300">
        Ya tienes la sesión iniciada como <strong>{sesion.usuario.nombre}</strong>.{" "}
        <Link href="/" className={ENLACE}>
          Ir al catálogo
        </Link>
      </p>
    );
  }

  return (
    <form noValidate onSubmit={enviar} className="mt-8 flex flex-col gap-5">
      {CAMPOS.map(({ campo, etiqueta, tipo, autocompletar, ayuda }) => {
        const error = errores[campo];
        const idMensaje = `${campo}-mensaje`;
        return (
          <div key={campo} className="flex flex-col gap-1.5">
            <label htmlFor={campo} className="text-sm font-medium">
              {etiqueta}
            </label>
            <input
              id={campo}
              name={campo}
              type={tipo}
              autoComplete={autocompletar}
              value={valores[campo]}
              onChange={(evento) => cambiar(campo, evento.target.value)}
              ref={(elemento) => {
                entradas.current[campo] = elemento;
              }}
              aria-invalid={error ? true : undefined}
              aria-describedby={error || ayuda ? idMensaje : undefined}
              className={`h-11 rounded-lg border bg-white px-3 text-zinc-950 outline-none transition-colors focus:ring-2 focus:ring-amber-400 dark:bg-zinc-900 dark:text-zinc-50 ${
                error ? "border-red-500" : "border-zinc-300 dark:border-zinc-700"
              }`}
            />
            {error ? (
              <p id={idMensaje} className="text-sm text-red-600 dark:text-red-400">
                {error}
              </p>
            ) : ayuda ? (
              <p id={idMensaje} className="text-sm text-zinc-500 dark:text-zinc-400">
                {ayuda}
              </p>
            ) : null}
          </div>
        );
      })}

      {errorGeneral && (
        <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {errorGeneral}
        </p>
      )}

      <button
        type="submit"
        disabled={enviando}
        className="h-11 rounded-full bg-amber-500 px-5 text-sm font-semibold text-zinc-950 transition-colors hover:bg-amber-400 disabled:cursor-wait disabled:opacity-70"
      >
        {enviando ? "Creando tu cuenta…" : "Crear cuenta"}
      </button>
      {enviando && (
        <p role="status" className="text-center text-sm text-zinc-500 dark:text-zinc-400">
          Si la tienda estuvo inactiva, puede tardar hasta un minuto.
        </p>
      )}
    </form>
  );
}
