/** Recorta los espacios de los extremos. */
export function recortar({ value }: { value: unknown }): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

/** El correo se guarda en minúsculas, así «Ana@Correo.pe» y «ana@correo.pe» son la misma cuenta. */
export function normalizarCorreo({ value }: { value: unknown }): unknown {
  return typeof value === 'string' ? value.trim().toLowerCase() : value;
}

/** Quita espacios y guiones: «987 654 321» y «987-654-321» quedan como 987654321. */
export function soloDigitos({ value }: { value: unknown }): unknown {
  return typeof value === 'string' ? value.replace(/[\s-]/g, '') : value;
}
