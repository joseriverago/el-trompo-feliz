import { API_URL } from "@/lib/api";

/** Categoría tal como la devuelve GET /categorias. */
export interface Categoria {
  id: number;
  nombre: string;
}

/** GET /categorias: lista pública, ordenada por nombre. */
export async function obtenerCategorias(signal?: AbortSignal): Promise<Categoria[]> {
  const respuesta = await fetch(`${API_URL}/categorias`, { signal });
  if (!respuesta.ok) {
    throw new Error(`La API respondió ${respuesta.status}`);
  }
  return respuesta.json();
}
