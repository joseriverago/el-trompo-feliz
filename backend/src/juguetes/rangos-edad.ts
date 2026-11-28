/** Rangos de edad del filtro del catálogo (HU-17): [desde, hasta] en años. 99 es «sin límite». */
export const RANGOS_EDAD = {
  '0-2': [0, 2],
  '3-5': [3, 5],
  '6-8': [6, 8],
  '9-12': [9, 12],
  '13+': [13, 99],
} as const;

export type RangoEdad = keyof typeof RANGOS_EDAD;
