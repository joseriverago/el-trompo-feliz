import { API_URL } from "@/lib/api";
import type { EstadoPedido } from "@/lib/pedidos";

/**
 * Formulario de pago simulado (HU-09). Los datos solo viven en la página mientras se paga:
 * no se guardan en el navegador, y la API guarda únicamente los últimos 4 dígitos.
 */
export interface DatosTarjeta {
  numero: string;
  titular: string;
  vencimiento: string;
  cvv: string;
}

export type ErroresTarjeta = Partial<Record<keyof DatosTarjeta, string>>;

/** Confirmación del pago aprobado (201 de POST /pedidos/:numero/pago). */
export interface Pago {
  numero: string;
  estado: EstadoPedido;
  monto: number;
  ultimosDigitos: string;
  pagadoEn: string;
}

/** Un juguete que ya no tiene stock suficiente al pagar (HU-09, criterio 3). */
export interface FaltaStock {
  jugueteId: number;
  nombre: string;
  stock: number;
  mensaje: string;
}

export type ResultadoPago =
  | { tipo: "aprobado"; pago: Pago }
  /** 400: un mensaje por campo de la tarjeta. */
  | { tipo: "datos-invalidos"; errores: ErroresTarjeta }
  /** 402: la tarjeta de prueba que termina en 0000 (criterio 2). */
  | { tipo: "rechazado" }
  /** 409 con juguetes: otro cliente compró las últimas unidades (criterio 3). */
  | { tipo: "sin-stock"; juguetes: FaltaStock[] }
  /** 409 sin juguetes: el pedido ya estaba pagado, por ejemplo desde otra pestaña (criterio 4). */
  | { tipo: "ya-pagado" }
  | { tipo: "no-encontrado" }
  | { tipo: "sesion-vencida" };

/** «4242424242424242» → «4242 4242 4242 4242» mientras se escribe (máximo 16 dígitos). */
export function formatearNumeroTarjeta(valor: string): string {
  return valor
    .replace(/\D/g, "")
    .slice(0, 16)
    .replace(/(\d{4})(?=\d)/g, "$1 ");
}

/** «0829» → «08/29» mientras se escribe. Al borrar, la barra no vuelve a aparecer sola. */
export function formatearVencimiento(valor: string, anterior: string): string {
  const digitos = valor.replace(/\D/g, "").slice(0, 4);
  if (digitos.length > 2) return `${digitos.slice(0, 2)}/${digitos.slice(2)}`;
  if (digitos.length === 2 && valor.length > anterior.length) return `${digitos}/`;
  return digitos;
}

/** Hoy como un solo número (año × 12 + mes), para comparar con el vencimiento. */
function mesActual(hoy: Date): number {
  return hoy.getFullYear() * 12 + hoy.getMonth() + 1;
}

/** Las mismas reglas que valida la API, para avisar antes de enviar. La API vuelve a validar todo. */
export function validarTarjeta(datos: DatosTarjeta, hoy = new Date()): ErroresTarjeta {
  const errores: ErroresTarjeta = {};

  const numero = datos.numero.replace(/[\s-]/g, "");
  if (!numero) errores.numero = "Ingresa el número de la tarjeta";
  else if (!/^\d{16}$/.test(numero)) errores.numero = "El número de la tarjeta debe tener 16 dígitos";

  const titular = datos.titular.trim();
  if (!titular) errores.titular = "Ingresa el nombre del titular";
  else if (titular.length > 100) errores.titular = "El nombre puede tener hasta 100 caracteres";
  else if (!/^[\p{L}][\p{L} .'-]*$/u.test(titular))
    errores.titular = "Escribe el nombre como aparece en la tarjeta, solo con letras";

  const vencimiento = datos.vencimiento.replace(/\s/g, "");
  const partes = /^(0[1-9]|1[0-2])\/(\d{2})$/.exec(vencimiento);
  if (!vencimiento) errores.vencimiento = "Ingresa el vencimiento";
  else if (!partes) errores.vencimiento = "Escribe el vencimiento como MM/AA, por ejemplo 08/29";
  else if ((2000 + Number(partes[2])) * 12 + Number(partes[1]) < mesActual(hoy))
    errores.vencimiento = "La tarjeta está vencida";

  const cvv = datos.cvv.trim();
  if (!cvv) errores.cvv = "Ingresa el CVV";
  else if (!/^\d{3}$/.test(cvv)) errores.cvv = "El CVV debe tener 3 dígitos";

  return errores;
}

/** POST /pedidos/:numero/pago: paga el pedido con la tarjeta simulada (HU-09). */
export async function pagarPedido(token: string, numero: string, datos: DatosTarjeta): Promise<ResultadoPago> {
  const respuesta = await fetch(`${API_URL}/pedidos/${encodeURIComponent(numero)}/pago`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(datos),
  });
  if (respuesta.ok) return { tipo: "aprobado", pago: (await respuesta.json()) as Pago };
  if (respuesta.status === 401) return { tipo: "sesion-vencida" };
  if (respuesta.status === 402) return { tipo: "rechazado" };
  if (respuesta.status === 404) return { tipo: "no-encontrado" };
  if (respuesta.status === 400 || respuesta.status === 409) {
    const cuerpo = (await respuesta.json().catch(() => ({}))) as {
      errores?: ErroresTarjeta;
      juguetes?: FaltaStock[];
    };
    if (respuesta.status === 409) {
      return cuerpo.juguetes?.length ? { tipo: "sin-stock", juguetes: cuerpo.juguetes } : { tipo: "ya-pagado" };
    }
    if (cuerpo.errores && Object.keys(cuerpo.errores).length > 0) {
      return { tipo: "datos-invalidos", errores: cuerpo.errores };
    }
  }
  throw new Error(`La API respondió ${respuesta.status}`);
}
