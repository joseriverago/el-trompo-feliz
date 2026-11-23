import { describe, expect, it } from "vitest";
import { validarInicioSesion, validarRegistro } from "@/lib/auth";

const VALIDOS = { nombre: "Begoña Ñahui Ávila", correo: "begona.nahui@correo.pe", contrasena: "Trompo2026" };

describe("validarRegistro (HU-03)", () => {
  it("acepta un nombre con tildes y eñes, un correo válido y una contraseña de 8 o más caracteres", () => {
    expect(validarRegistro(VALIDOS)).toEqual({});
  });

  it("con todo vacío pide los 3 datos", () => {
    expect(validarRegistro({ nombre: "", correo: "", contrasena: "" })).toEqual({
      nombre: "Ingresa tu nombre",
      correo: "Ingresa tu correo",
      contrasena: "Ingresa una contraseña",
    });
  });

  it("un nombre con solo espacios cuenta como vacío", () => {
    expect(validarRegistro({ ...VALIDOS, nombre: "   " }).nombre).toBe("Ingresa tu nombre");
  });

  it("acepta el correo con espacios alrededor, igual que la API", () => {
    expect(validarRegistro({ ...VALIDOS, correo: "  Begona.Nahui@Correo.PE " })).toEqual({});
  });

  it.each(["begona", "begona@correo", "begona @correo.pe", "@correo.pe"])("rechaza el correo «%s»", (correo) => {
    expect(validarRegistro({ ...VALIDOS, correo }).correo).toBe(
      "Ingresa un correo válido, por ejemplo nombre@correo.com",
    );
  });

  it("pide al menos 8 caracteres de contraseña y como máximo 72", () => {
    expect(validarRegistro({ ...VALIDOS, contrasena: "Trompo7" }).contrasena).toBe(
      "La contraseña debe tener al menos 8 caracteres",
    );
    expect(validarRegistro({ ...VALIDOS, contrasena: "a".repeat(73) }).contrasena).toBe(
      "La contraseña puede tener hasta 72 caracteres",
    );
  });

  it("limita el nombre a 100 caracteres y el correo a 150", () => {
    expect(validarRegistro({ ...VALIDOS, nombre: "Ñ".repeat(101) }).nombre).toBe(
      "El nombre puede tener hasta 100 caracteres",
    );
    // 141 + 10 de «@correo.pe» = 151 caracteres; con 150 todavía se acepta.
    expect(validarRegistro({ ...VALIDOS, correo: `${"a".repeat(141)}@correo.pe` }).correo).toBe(
      "El correo puede tener hasta 150 caracteres",
    );
    expect(validarRegistro({ ...VALIDOS, correo: `${"a".repeat(140)}@correo.pe` })).toEqual({});
  });
});

describe("validarInicioSesion (HU-04)", () => {
  it("solo pide el correo con forma de correo y la contraseña", () => {
    expect(validarInicioSesion({ correo: "rosa.quispe@correo.pe", contrasena: "x" })).toEqual({});
    expect(validarInicioSesion({ correo: "", contrasena: "" })).toEqual({
      correo: "Ingresa tu correo",
      contrasena: "Ingresa tu contraseña",
    });
  });
});
