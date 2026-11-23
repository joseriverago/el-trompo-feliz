import { describe, expect, it } from "vitest";
import { cuerpoJuguete, EDADES_INVERTIDAS, validarJuguete, type DatosJuguete } from "@/lib/admin-juguetes";

const VALIDOS: DatosJuguete = {
  nombre: "Cuy de peluche Ñuñu",
  descripcion: "Peluche suave de cuy andino, con bordados de colores.",
  precio: "39.90",
  imagenUrl: "https://placehold.co/600x400?text=Cuy",
  categoriaId: "2",
  edadMinima: "0",
  edadMaxima: "5",
  stock: "12",
};

describe("validarJuguete (HU-12)", () => {
  it("acepta un juguete completo", () => {
    expect(validarJuguete(VALIDOS, true)).toEqual({});
  });

  it("con todo vacío pide cada dato y, al registrar, el stock inicial", () => {
    const vacio = { ...VALIDOS, nombre: " ", descripcion: "", precio: "", imagenUrl: "", categoriaId: "", edadMinima: "", edadMaxima: "", stock: "" };
    expect(validarJuguete(vacio, true)).toEqual({
      nombre: "Ingresa el nombre",
      descripcion: "Ingresa la descripción",
      precio: "Ingresa el precio",
      imagenUrl: "Ingresa la dirección (URL) de la imagen",
      categoriaId: "Elige una categoría de la lista",
      edadMinima: "Ingresa la edad mínima",
      edadMaxima: "Ingresa la edad máxima",
      stock: "Ingresa el stock inicial",
    });
  });

  it.each([
    ["0", "El precio debe ser mayor que 0"],
    ["-5", "El precio debe ser mayor que 0"],
    ["doce", "El precio debe ser un número con hasta 2 decimales"],
    ["12.999", "El precio debe ser un número con hasta 2 decimales"],
    ["10000", "El precio puede ser hasta S/ 9999.99"],
  ])("rechaza el precio «%s»", (precio, mensaje) => {
    expect(validarJuguete({ ...VALIDOS, precio }, true)).toEqual({ precio: mensaje });
  });

  it("acepta el precio con coma decimal y lo envía como número", () => {
    const datos = { ...VALIDOS, precio: "39,90" };
    expect(validarJuguete(datos, true)).toEqual({});
    expect(cuerpoJuguete(datos, true).precio).toBe(39.9);
  });

  it("avisa si la edad mínima es mayor que la máxima", () => {
    expect(validarJuguete({ ...VALIDOS, edadMinima: "6", edadMaxima: "3" }, true)).toEqual({
      edadMinima: EDADES_INVERTIDAS,
    });
  });

  it("pide edades y stock enteros", () => {
    expect(validarJuguete({ ...VALIDOS, edadMaxima: "3.5", stock: "-1" }, true)).toEqual({
      edadMaxima: "La edad máxima debe ser un número entero de años",
      stock: "El stock debe ser un número entero de 0 o más",
    });
  });

  it("rechaza una imagen que no es una URL web", () => {
    expect(validarJuguete({ ...VALIDOS, imagenUrl: "foto-del-cuy.jpg" }, true)).toEqual({
      imagenUrl: "Ingresa una URL válida, por ejemplo https://sitio.com/foto.jpg",
    });
  });

  it("al editar no revisa ni envía el stock", () => {
    expect(validarJuguete({ ...VALIDOS, stock: "" }, false)).toEqual({});
    expect(cuerpoJuguete(VALIDOS, false)).not.toHaveProperty("stock");
    expect(cuerpoJuguete(VALIDOS, true)).toMatchObject({ stock: 12, categoriaId: 2, edadMinima: 0, edadMaxima: 5 });
  });
});
