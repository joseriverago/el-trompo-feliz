import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { FormularioRegistro } from "@/components/formulario-registro";
import { llamada, simularApi } from "@/test/respuestas";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

async function llenar(
  usuario: ReturnType<typeof userEvent.setup>,
  datos: { nombre: string; correo: string; contrasena: string },
) {
  await usuario.type(screen.getByLabelText("Nombre"), datos.nombre);
  await usuario.type(screen.getByLabelText("Correo"), datos.correo);
  await usuario.type(screen.getByLabelText("Contraseña"), datos.contrasena);
}

describe("FormularioRegistro (HU-03)", () => {
  it("con los campos vacíos muestra un mensaje en cada uno, lleva el foco al nombre y no llama a la API", async () => {
    const api = simularApi();
    const usuario = userEvent.setup();
    render(<FormularioRegistro />);

    await usuario.click(screen.getByRole("button", { name: "Crear cuenta" }));

    expect(screen.getByText("Ingresa tu nombre")).toBeInTheDocument();
    expect(screen.getByText("Ingresa tu correo")).toBeInTheDocument();
    expect(screen.getByText("Ingresa una contraseña")).toBeInTheDocument();
    expect(screen.getByLabelText("Nombre")).toHaveFocus();
    expect(screen.getByLabelText("Nombre")).toHaveAttribute("aria-invalid", "true");
    expect(api).not.toHaveBeenCalled();
  });

  it("avisa del correo inválido y de la contraseña corta; el aviso desaparece al corregir el campo", async () => {
    simularApi();
    const usuario = userEvent.setup();
    render(<FormularioRegistro />);

    await llenar(usuario, { nombre: "Begoña Ñahui Ávila", correo: "begona@correo", contrasena: "corta" });
    await usuario.click(screen.getByRole("button", { name: "Crear cuenta" }));

    expect(screen.getByText("Ingresa un correo válido, por ejemplo nombre@correo.com")).toBeInTheDocument();
    expect(screen.getByText("La contraseña debe tener al menos 8 caracteres")).toBeInTheDocument();
    expect(screen.getByLabelText("Correo")).toHaveFocus();

    await usuario.type(screen.getByLabelText("Correo"), ".pe");
    expect(screen.queryByText("Ingresa un correo válido, por ejemplo nombre@correo.com")).not.toBeInTheDocument();
  });

  it("con datos válidos crea la cuenta y lleva al catálogo", async () => {
    const api = simularApi({
      estado: 201,
      cuerpo: { token: "token-de-prueba", usuario: { id: 9, nombre: "Begoña Ñahui Ávila", rol: "CLIENTE" } },
    });
    const usuario = userEvent.setup();
    render(<FormularioRegistro />);

    await llenar(usuario, { nombre: "Begoña Ñahui Ávila", correo: "begona.nahui@correo.pe", contrasena: "Trompo2026" });
    await usuario.click(screen.getByRole("button", { name: "Crear cuenta" }));

    expect(llamada(api)).toEqual({
      ruta: "/auth/registro",
      metodo: "POST",
      cuerpo: { nombre: "Begoña Ñahui Ávila", correo: "begona.nahui@correo.pe", contrasena: "Trompo2026" },
    });
    expect(await screen.findByText("¡Cuenta creada! Te llevamos al catálogo…")).toBeInTheDocument();
    expect(push).toHaveBeenCalledWith("/");
  });

  it("si el correo ya tiene cuenta (409), muestra el mensaje de la API en el campo Correo", async () => {
    simularApi({ estado: 409, cuerpo: { errores: { correo: "Ya existe una cuenta con ese correo" } } });
    const usuario = userEvent.setup();
    render(<FormularioRegistro />);

    await llenar(usuario, { nombre: "Rosa Quispe Huamán", correo: "rosa.quispe@correo.pe", contrasena: "Trompo2026" });
    await usuario.click(screen.getByRole("button", { name: "Crear cuenta" }));

    expect(await screen.findByText("Ya existe una cuenta con ese correo")).toBeInTheDocument();
    expect(screen.getByLabelText("Correo")).toHaveFocus();
  });
});
