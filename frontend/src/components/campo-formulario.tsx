import type { Ref } from "react";

interface Props {
  campo: string;
  etiqueta: string;
  tipo: string;
  autocompletar: string;
  valor: string;
  onCambio: (valor: string) => void;
  error?: string;
  ayuda?: string;
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
        value={valor}
        onChange={(evento) => onCambio(evento.target.value)}
        ref={ref}
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
}
