/** Recorta los espacios de los extremos. */
export function recortar({ value }: { value: unknown }): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

/** El correo se guarda en minúsculas, así «Ana@Correo.pe» y «ana@correo.pe» son la misma cuenta. */
export function normalizarCorreo({ value }: { value: unknown }): unknown {
  return typeof value === 'string' ? value.trim().toLowerCase() : value;
}
