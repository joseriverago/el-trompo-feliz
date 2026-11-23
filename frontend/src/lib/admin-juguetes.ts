import { API_URL } from "@/lib/api";
import type { JugueteDetalle } from "@/lib/juguetes";

/** Formulario de «Administración > Juguetes» (HU-12), con los valores tal como se escriben. */
export interface DatosJuguete {
  nombre: string;
  descripcion: string;
  precio: string;
  imagenUrl: string;
  categoriaId: string;
  edadMinima: string;
  edadMaxima: string;
  /** Solo al registrar: después el stock se cambia en el inventario (HU-13). */
  stock: string;
}

export type ErroresJuguete = Partial<Record<keyof DatosJuguete, string>>;

export const MENSAJE_SIN_ACCESO = "Tu cuenta no tiene acceso a la administración";
export const EDADES_INVERTIDAS = "La edad mínima no puede ser mayor que la máxima";
const STOCK_VALIDO = "El stock debe ser un número entero de 0 o más";

export const DATOS_VACIOS: DatosJuguete = {
  nombre: "",
  descripcion: "",
  precio: "",
  imagenUrl: "",
  categoriaId: "",
  edadMinima: "",
  edadMaxima: "",
  stock: "",
};

/** Valores del formulario para editar un juguete que ya existe. */
export function datosDeJuguete(juguete: JugueteDetalle): DatosJuguete {
  return {
    nombre: juguete.nombre,
    descripcion: juguete.descripcion,
    precio: juguete.precio.toFixed(2),
    imagenUrl: juguete.imagenUrl,
    categoriaId: String(juguete.categoria.id),
    edadMinima: String(juguete.edadMinima),
    edadMaxima: String(juguete.edadMaxima),
    stock: String(juguete.stock),
  };
}

/** Precio escrito con punto o con coma decimal: «39.90» y «39,90» son 39.9. */
export function leerPrecio(texto: string): number {
  return Number(texto.trim().replace(",", "."));
}

function esUrlWeb(texto: string): boolean {
  try {
    const url = new URL(texto);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

/** Las mismas reglas que valida la API, para avisar antes de enviar. La API vuelve a validar todo. */
export function validarJuguete(datos: DatosJuguete, nuevo: boolean): ErroresJuguete {
  const errores: ErroresJuguete = {};
  const texto = (campo: "nombre" | "descripcion" | "imagenUrl", vacio: string, maximo: number, largo: string) => {
    const valor = datos[campo].trim();
    if (!valor) errores[campo] = vacio;
    else if (valor.length > maximo) errores[campo] = largo;
  };
  const entero = (campo: "edadMinima" | "edadMaxima" | "stock", vacio: string, invalido: string, maximo: number, alto: string) => {
    const valor = datos[campo].trim();
    if (!valor) errores[campo] = vacio;
    else if (!/^\d+$/.test(valor)) errores[campo] = invalido;
    else if (Number(valor) > maximo) errores[campo] = alto;
  };

  texto("nombre", "Ingresa el nombre", 120, "El nombre puede tener hasta 120 caracteres");
  texto("descripcion", "Ingresa la descripción", 1000, "La descripción puede tener hasta 1000 caracteres");

  const precio = leerPrecio(datos.precio);
  if (!datos.precio.trim()) errores.precio = "Ingresa el precio";
  else if (Number.isNaN(precio)) errores.precio = "El precio debe ser un número con hasta 2 decimales";
  else if (precio <= 0) errores.precio = "El precio debe ser mayor que 0";
  else if (!/^\d+([.,]\d{1,2})?$/.test(datos.precio.trim()))
    errores.precio = "El precio debe ser un número con hasta 2 decimales";
  else if (precio > 9999.99) errores.precio = "El precio puede ser hasta S/ 9999.99";

  texto("imagenUrl", "Ingresa la dirección (URL) de la imagen", 500, "La URL puede tener hasta 500 caracteres");
  if (!errores.imagenUrl && !esUrlWeb(datos.imagenUrl.trim()))
    errores.imagenUrl = "Ingresa una URL válida, por ejemplo https://sitio.com/foto.jpg";

  if (!datos.categoriaId) errores.categoriaId = "Elige una categoría de la lista";

  entero(
    "edadMinima",
    "Ingresa la edad mínima",
    "La edad mínima debe ser un número entero de años",
    99,
    "La edad mínima puede ser hasta 99 años",
  );
  entero(
    "edadMaxima",
    "Ingresa la edad máxima",
    "La edad máxima debe ser un número entero de años",
    99,
    "La edad máxima puede ser hasta 99 años (99 es «sin límite»)",
  );
  if (!errores.edadMinima && !errores.edadMaxima && Number(datos.edadMinima) > Number(datos.edadMaxima))
    errores.edadMinima = EDADES_INVERTIDAS;

  if (nuevo) entero("stock", "Ingresa el stock inicial", STOCK_VALIDO, 100_000, "El stock puede ser hasta 100000 unidades");
  return errores;
}

/** Cuerpo de POST /juguetes (con stock) o de PUT /juguetes/:id (sin stock). */
export function cuerpoJuguete(datos: DatosJuguete, nuevo: boolean) {
  return {
    nombre: datos.nombre.trim(),
    descripcion: datos.descripcion.trim(),
    precio: leerPrecio(datos.precio),
    imagenUrl: datos.imagenUrl.trim(),
    categoriaId: Number(datos.categoriaId),
    edadMinima: Number(datos.edadMinima),
    edadMaxima: Number(datos.edadMaxima),
    ...(nuevo ? { stock: Number(datos.stock) } : {}),
  };
}

export type ResultadoGuardar =
  | { tipo: "listo"; juguete: JugueteDetalle }
  /** 400: un mensaje por campo. */
  | { tipo: "datos-invalidos"; errores: ErroresJuguete }
  /** 404 al editar: otro administrador lo eliminó. */
  | { tipo: "no-encontrado" }
  /** 403: la cuenta no es de administrador. */
  | { tipo: "sin-permiso" }
  | { tipo: "sesion-vencida" };

export function cabecerasAdmin(token: string): HeadersInit {
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}

/** POST /juguetes (sin `id`) o PUT /juguetes/:id (con `id`): registra o edita un juguete (HU-12). */
export async function guardarJuguete(token: string, datos: DatosJuguete, id?: number): Promise<ResultadoGuardar> {
  const nuevo = id === undefined;
  const respuesta = await fetch(nuevo ? `${API_URL}/juguetes` : `${API_URL}/juguetes/${id}`, {
    method: nuevo ? "POST" : "PUT",
    headers: cabecerasAdmin(token),
    body: JSON.stringify(cuerpoJuguete(datos, nuevo)),
  });
  if (respuesta.ok) return { tipo: "listo", juguete: (await respuesta.json()) as JugueteDetalle };
  if (respuesta.status === 401) return { tipo: "sesion-vencida" };
  if (respuesta.status === 403) return { tipo: "sin-permiso" };
  if (respuesta.status === 404) return { tipo: "no-encontrado" };
  if (respuesta.status === 400) {
    const cuerpo = (await respuesta.json().catch(() => ({}))) as { errores?: ErroresJuguete };
    return { tipo: "datos-invalidos", errores: cuerpo.errores ?? {} };
  }
  throw new Error(`La API respondió ${respuesta.status}`);
}
