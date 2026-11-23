import { vi } from "vitest";

/** Simula la API: cada llamada a fetch responde con el estado y el cuerpo indicados, en orden. */
export function simularApi(...respuestas: { estado: number; cuerpo?: unknown }[]) {
  const fetchSimulado = vi.fn<typeof fetch>();
  for (const { estado, cuerpo } of respuestas) {
    fetchSimulado.mockResolvedValueOnce(
      new Response(cuerpo === undefined ? null : JSON.stringify(cuerpo), {
        status: estado,
        headers: { "Content-Type": "application/json" },
      }),
    );
  }
  vi.stubGlobal("fetch", fetchSimulado);
  return fetchSimulado;
}

/** Ruta, método y cuerpo (ya convertido a objeto) de la llamada número `posicion` a fetch. */
export function llamada(fetchSimulado: ReturnType<typeof simularApi>, posicion = 0) {
  const [url, opciones] = fetchSimulado.mock.calls[posicion];
  return {
    ruta: new URL(String(url)).pathname,
    metodo: opciones?.method ?? "GET",
    cuerpo: opciones?.body ? (JSON.parse(String(opciones.body)) as Record<string, unknown>) : undefined,
  };
}
