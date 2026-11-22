"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import { CampoFormulario } from "@/components/campo-formulario";
import {
  registrar,
  validarRegistro,
  type DatosRegistro,
  type ErroresRegistro,
} from "@/lib/auth";
import { ENLACE } from "@/lib/estilos";
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
    <>
      <form noValidate onSubmit={enviar} className="mt-8 flex flex-col gap-5">
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
      <p className="mt-6 text-center text-sm text-zinc-600 dark:text-zinc-400">
        ¿Ya tienes una cuenta?{" "}
        <Link href="/iniciar-sesion" className={ENLACE}>
          Inicia sesión
        </Link>
      </p>
    </>
  );
}
