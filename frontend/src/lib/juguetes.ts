import { API_URL } from "@/lib/api";

/** Juguete tal como lo devuelve GET /juguetes. */
export interface JugueteCatalogo {
  id: number;
  nombre: string;
  precio: number;
  imagenUrl: string;
  edadMinima: number;
  edadMaxima: number;
  stock: number;
  agotado: boolean;
  categoria: { id: number; nombre: string };
}

/** Juguete tal como lo devuelve GET /juguetes/:id. */
export interface JugueteDetalle extends JugueteCatalogo {
  descripcion: string;
}

export async function obtenerCatalogo(signal?: AbortSignal): Promise<JugueteCatalogo[]> {
  const respuesta = await fetch(`${API_URL}/juguetes`, { signal });
  if (!respuesta.ok) {
    throw new Error(`La API respondió ${respuesta.status}`);
  }
  return respuesta.json();
}

/** Detalle de un juguete, o null si no existe (la API responde 404). */
export async function obtenerJuguete(id: string, signal?: AbortSignal): Promise<JugueteDetalle | null> {
  const respuesta = await fetch(`${API_URL}/juguetes/${encodeURIComponent(id)}`, { signal });
  if (respuesta.status === 404) return null;
  if (!respuesta.ok) {
    throw new Error(`La API respondió ${respuesta.status}`);
  }
  return respuesta.json();
}

/** Precio en soles con dos decimales, por ejemplo «S/ 12.90». */
export function formatearPrecio(precio: number): string {
  return `S/ ${precio.toFixed(2)}`;
}

/** Edad recomendada en texto. Una edad máxima de 99 significa «sin límite». */
export function formatearEdad(edadMinima: number, edadMaxima: number): string {
  const anios = (edad: number) => (edad === 1 ? "año" : "años");
  if (edadMaxima >= 99) return `desde ${edadMinima} ${anios(edadMinima)}`;
  if (edadMinima === 0) return `hasta ${edadMaxima} ${anios(edadMaxima)}`;
  return `de ${edadMinima} a ${edadMaxima} ${anios(edadMaxima)}`;
}
