import { describe, expect, it } from "vitest";
import { formatearNumeroTarjeta, formatearVencimiento, validarTarjeta, type DatosTarjeta } from "@/lib/pagos";

/** El 22/11/2026: las tarjetas que vencen antes de noviembre de 2026 están vencidas. */
const HOY = new Date(2026, 10, 22);

const TARJETA: DatosTarjeta = {
  numero: "4242 4242 4242 4242",
  titular: "Rosa Quispe Huamán",
  vencimiento: "08/29",
  cvv: "123",
};

describe("formatearNumeroTarjeta", () => {
  it("agrupa de 4 en 4 mientras se escribe y no pasa de 16 dígitos", () => {
    expect(formatearNumeroTarjeta("4242424242424242")).toBe("4242 4242 4242 4242");
    expect(formatearNumeroTarjeta("42424")).toBe("4242 4");
    expect(formatearNumeroTarjeta("4242-4242-4242-4242-99")).toBe("4242 4242 4242 4242");
  });
});

describe("formatearVencimiento", () => {
  it("agrega la barra después del mes al escribir, pero no al borrar", () => {
    expect(formatearVencimiento("08", "0")).toBe("08/");
    expect(formatearVencimiento("0829", "")).toBe("08/29");
    expect(formatearVencimiento("08", "08/")).toBe("08");
  });
});

describe("validarTarjeta (HU-09)", () => {
  it("acepta una tarjeta de 16 dígitos con titular con tildes, vencimiento futuro y CVV de 3 dígitos", () => {
    expect(validarTarjeta(TARJETA, HOY)).toEqual({});
  });

  it("con todo vacío pide los 4 datos", () => {
    expect(validarTarjeta({ numero: "", titular: "", vencimiento: "", cvv: "" }, HOY)).toEqual({
      numero: "Ingresa el número de la tarjeta",
      titular: "Ingresa el nombre del titular",
      vencimiento: "Ingresa el vencimiento",
      cvv: "Ingresa el CVV",
    });
  });

  it("pide 16 dígitos en el número", () => {
    expect(validarTarjeta({ ...TARJETA, numero: "4242 4242 4242 424" }, HOY).numero).toBe(
      "El número de la tarjeta debe tener 16 dígitos",
    );
  });

  it("el titular solo lleva letras, también con tildes y eñes", () => {
    expect(validarTarjeta({ ...TARJETA, titular: "José Ñique-Salas" }, HOY)).toEqual({});
    expect(validarTarjeta({ ...TARJETA, titular: "Rosa 123" }, HOY).titular).toBe(
      "Escribe el nombre como aparece en la tarjeta, solo con letras",
    );
  });

  it("rechaza el vencimiento con otro formato y la tarjeta vencida; el mes actual todavía vale", () => {
    expect(validarTarjeta({ ...TARJETA, vencimiento: "13/29" }, HOY).vencimiento).toBe(
      "Escribe el vencimiento como MM/AA, por ejemplo 08/29",
    );
    expect(validarTarjeta({ ...TARJETA, vencimiento: "10/26" }, HOY).vencimiento).toBe("La tarjeta está vencida");
    expect(validarTarjeta({ ...TARJETA, vencimiento: "11/26" }, HOY)).toEqual({});
  });

  it("pide un CVV de 3 dígitos", () => {
    expect(validarTarjeta({ ...TARJETA, cvv: "12" }, HOY).cvv).toBe("El CVV debe tener 3 dígitos");
  });
});
