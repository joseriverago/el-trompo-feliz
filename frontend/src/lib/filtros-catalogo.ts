import { leerPrecio } from "@/lib/admin-juguetes";

/** Lo que se busca en el catálogo (CU-03). Los campos vacíos no filtran. */
export interface FiltrosCatalogo {
  nombre?: string;
  categoriaId?: string;
  edad?: string;
  precioMin?: string;
  precioMax?: string;
}

/** Los rangos de edad de la API (HU-17). */
export const RANGOS_EDAD = [
  { valor: "0-2", nombre: "0 a 2 años" },
  { valor: "3-5", nombre: "3 a 5 años" },
  { valor: "6-8", nombre: "6 a 8 años" },
  { valor: "9-12", nombre: "9 a 12 años" },
  { valor: "13+", nombre: "13 años a más" },
];

export const PRECIOS_INVERTIDOS = "El precio mínimo no puede ser mayor que el máximo";
const PRECIO_VALIDO = "Escribe el precio como un número, por ejemplo 25.50";

export type ErroresPrecio = Partial<Record<"precioMin" | "precioMax", string>>;

/** Revisa el rango de precio (con punto o coma decimal) y lo devuelve como lo espera la API. */
export function validarPrecios(minimo: string, maximo: string) {
  const errores: ErroresPrecio = {};
  const leer = (campo: "precioMin" | "precioMax", texto: string) => {
    const valor = texto.trim();
    if (!valor) return "";
    if (!/^\d+([.,]\d{1,2})?$/.test(valor)) {
      errores[campo] = PRECIO_VALIDO;
      return "";
    }
    return String(leerPrecio(valor));
  };
  const precioMin = leer("precioMin", minimo);
  const precioMax = leer("precioMax", maximo);
  if (precioMin && precioMax && Number(precioMin) > Number(precioMax)) errores.precioMin = PRECIOS_INVERTIDOS;
  return { errores, precioMin, precioMax };
}

/** «?nombre=pelu&edad=3-5», o vacío si no hay nada que filtrar. */
export function consultaCatalogo(filtros: FiltrosCatalogo): string {
  const parametros = new URLSearchParams();
  for (const [campo, valor] of Object.entries(filtros)) {
    const texto = String(valor ?? "").trim();
    if (texto) parametros.set(campo, texto);
  }
  const consulta = parametros.toString();
  return consulta ? `?${consulta}` : "";
}

/** Qué decir cuando la búsqueda no encuentra nada (HU-16, criterio 2). */
export function mensajeSinResultados({ nombre, ...otros }: FiltrosCatalogo): string {
  if (consultaCatalogo(otros)) return "No encontramos juguetes con esos filtros";
  if (nombre?.trim()) return "No encontramos juguetes con ese nombre";
  return "Por ahora no hay juguetes disponibles";
}
