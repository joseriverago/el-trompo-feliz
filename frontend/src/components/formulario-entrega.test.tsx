import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { FormularioEntrega } from "@/components/formulario-entrega";
import { llamada, simularApi } from "@/test/respuestas";

function mostrar() {
  const onGenerado = vi.fn();
  const onRevisarCarrito = vi.fn();
  render(
    <FormularioEntrega
      token="token-de-prueba"
      nombreInicial="Rosa Quispe Huamán"
      onGenerado={onGenerado}
      onRevisarCarrito={onRevisarCarrito}
    />,
  );
  return { onGenerado, onRevisarCarrito };
}

const continuar = () => screen.getByRole("button", { name: "Continuar al pago" });

describe("FormularioEntrega (HU-08)", () => {
  it("propone el nombre del cliente como quien recibe", () => {
    mostrar();
    expect(screen.getByLabelText("Nombre de quien recibe")).toHaveValue("Rosa Quispe Huamán");
  });

  it("sin teléfono, dirección ni distrito muestra un mensaje en cada campo y no genera el pedido", async () => {
    const api = simularApi();
    const usuario = userEvent.setup();
    mostrar();

    await usuario.click(continuar());

    expect(screen.getByText("Ingresa el teléfono")).toBeInTheDocument();
    expect(screen.getByText("Ingresa la dirección de entrega")).toBeInTheDocument();
    expect(screen.getByText("Ingresa el distrito")).toBeInTheDocument();
    expect(screen.getByLabelText("Teléfono")).toHaveFocus();
    expect(api).not.toHaveBeenCalled();
  });

  it("avisa si el teléfono no tiene 9 dígitos", async () => {
    simularApi();
    const usuario = userEvent.setup();
    mostrar();

    await usuario.type(screen.getByLabelText("Teléfono"), "987 654 32");
    await usuario.type(screen.getByLabelText("Dirección"), "Av. Los Olivos 123, dpto. 302");
    await usuario.type(screen.getByLabelText("Distrito"), "San Miguel");
    await usuario.click(continuar());

    expect(screen.getByText("El teléfono debe tener 9 dígitos")).toBeInTheDocument();
  });

  it("con datos válidos genera el pedido con POST /pedidos y lo entrega a la página", async () => {
    const pedido = { numero: "TF-20261122-483920", estado: "PENDIENTE", total: 24.9 };
    const api = simularApi({ estado: 201, cuerpo: pedido });
    const usuario = userEvent.setup();
    const { onGenerado } = mostrar();

    await usuario.type(screen.getByLabelText("Teléfono"), "987 654 321");
    await usuario.type(screen.getByLabelText("Dirección"), "Av. Los Olivos 123, dpto. 302");
    await usuario.type(screen.getByLabelText("Distrito"), "San Miguel");
    await usuario.type(screen.getByLabelText("Referencia (opcional)"), "Frente al parque");
    await usuario.click(continuar());

    expect(llamada(api)).toEqual({
      ruta: "/pedidos",
      metodo: "POST",
      cuerpo: {
        destinatario: "Rosa Quispe Huamán",
        telefono: "987 654 321",
        direccion: "Av. Los Olivos 123, dpto. 302",
        distrito: "San Miguel",
        referencia: "Frente al parque",
      },
    });
    expect(onGenerado).toHaveBeenCalledWith(pedido);
  });
});
