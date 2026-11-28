/** Texto en minúsculas y sin tildes, para comparar búsquedas: «Ábaco» y «abaco» son iguales. */
export function normalizarTexto(texto: string): string {
  return (
    texto
      .normalize('NFD')
      // La tilde de la ñ no se quita: «ñ» y «n» son letras distintas.
      .replace(/(?<![nN])̃|[̀-̂̄-ͯ]/g, '')
      .normalize('NFC')
      .toLocaleLowerCase('es')
  );
}
