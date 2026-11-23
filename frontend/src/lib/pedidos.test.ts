import { describe, expect, it } from "vitest";
import { soloDigitos, validarEntrega, type DatosEntrega } from "@/lib/pedidos";

const ENTREGA: DatosEntrega = {
  destinatario: "Rosa Quispe Huamán",
  telefono: "987 654 321",
  direccion: "Av. Los Olivos 123, dpto. 302",
  distrito: "San Miguel",
  referencia: "",
};

describe("soloDigitos", () => {
  it("quita espacios y guiones del teléfono", () => {
    expect(soloDigitos("987 654 321")).toBe("987654321");
    expect(soloDigitos("987-654-321")).toBe("987654321");
  });
});

describe("validarEntrega (HU-08)", () => {
  it("acepta una entrega en Lima con el teléfono escrito con espacios y sin referencia", () => {
    expect(validarEntrega(ENTREGA)).toEqual({});
  });

  it("con todo vacío pide los 4 datos obligatorios; la referencia es opcional", () => {
    expect(validarEntrega({ destinatario: "", telefono: "", direccion: "", distrito: "", referencia: "" })).toEqual({
      destinatario: "Ingresa el nombre de quien recibe",
      telefono: "Ingresa el teléfono",
      direccion: "Ingresa la dirección de entrega",
      distrito: "Ingresa el distrito",
    });
  });

  it.each(["98765432", "9876543210", "987 654 32a"])("rechaza el teléfono «%s»: debe tener 9 dígitos", (telefono) => {
    expect(validarEntrega({ ...ENTREGA, telefono }).telefono).toBe("El teléfono debe tener 9 dígitos");
  });

  it("limita la longitud de cada campo, como la API", () => {
    expect(
      validarEntrega({
        destinatario: "Ñ".repeat(101),
        telefono: "987654321",
        direccion: "A".repeat(201),
        distrito: "B".repeat(81),
        referencia: "C".repeat(201),
      }),
    ).toEqual({
      destinatario: "El nombre puede tener hasta 100 caracteres",
      direccion: "La dirección puede tener hasta 200 caracteres",
      distrito: "El distrito puede tener hasta 80 caracteres",
      referencia: "La referencia puede tener hasta 200 caracteres",
    });
  });
});
