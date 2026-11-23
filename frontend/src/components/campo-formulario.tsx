import type { Ref } from "react";

/** Estilo de un campo de formulario (input, select o textarea); con error, el borde es rojo. */
export function clasesCampo(error?: string): string {
  return `rounded-lg border bg-white px-3 text-zinc-950 outline-none transition-colors placeholder:text-zinc-400 focus:ring-2 focus:ring-amber-400 dark:bg-zinc-900 dark:text-zinc-50 ${
    error ? "border-red-500" : "border-zinc-300 dark:border-zinc-700"
  }`;
}

interface Props {
  campo: string;
  etiqueta: string;
  tipo: string;
  autocompletar: string;
  valor: string;
  onCambio: (valor: string) => void;
  error?: string;
  ayuda?: string;
  /** Teclado del celular: «numeric» muestra solo números y «decimal» agrega el punto. */
  modoTeclado?: "numeric" | "decimal" | "text";
  largoMaximo?: number;
  /** Ejemplo dentro del campo vacío, por ejemplo «MM/AA». */
  marcador?: string;
  ref?: Ref<HTMLInputElement>;
}

/** Campo con su etiqueta y su mensaje: el error, si lo hay, o la ayuda. */
export function CampoFormulario({
  campo,
  etiqueta,
  tipo,
  autocompletar,
  valor,
  onCambio,
  error,
  ayuda,
  modoTeclado,
  largoMaximo,
  marcador,
  ref,
}: Props) {
  const idMensaje = `${campo}-mensaje`;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={campo} className="text-sm font-medium">
        {etiqueta}
      </label>
      <input
        id={campo}
        name={campo}
        type={tipo}
        autoComplete={autocompletar}
        inputMode={modoTeclado}
        maxLength={largoMaximo}
        placeholder={marcador}
        value={valor}
        onChange={(evento) => onCambio(evento.target.value)}
        ref={ref}
        aria-invalid={error ? true : undefined}
        aria-describedby={error || ayuda ? idMensaje : undefined}
        className={`h-11 ${clasesCampo(error)}`}
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
}
