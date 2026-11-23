import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FormularioPago } from "@/components/formulario-pago";
import { llamada, simularApi } from "@/test/respuestas";

function mostrar() {
  const onPagado = vi.fn();
  const onReleer = vi.fn();
  render(
    <FormularioPago token="token-de-prueba" numero="TF-20261122-483920" total={24.9} onPagado={onPagado} onReleer={onReleer} />,
  );
  return { onPagado, onReleer };
}

async function llenarTarjeta(usuario: ReturnType<typeof userEvent.setup>, numero: string, vencimiento: string) {
  await usuario.type(screen.getByLabelText("Número de tarjeta"), numero);
  await usuario.type(screen.getByLabelText("Nombre del titular"), "Rosa Quispe Huamán");
  await usuario.type(screen.getByLabelText("Vencimiento"), vencimiento);
  await usuario.type(screen.getByLabelText("CVV"), "123");
}

const pagar = () => screen.getByRole("button", { name: "Pagar S/ 24.90" });

describe("FormularioPago (HU-09)", () => {
  // Solo se fija la fecha (22/11/2026), para que «vencida» no dependa del día en que se ejecuta la prueba.
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 10, 22, 20, 0));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("da formato al número y al vencimiento mientras se escriben, y el CVV solo acepta 3 dígitos", async () => {
    const usuario = userEvent.setup();
    mostrar();

    await usuario.type(screen.getByLabelText("Número de tarjeta"), "4242424242424242");
    await usuario.type(screen.getByLabelText("Vencimiento"), "0829");
    await usuario.type(screen.getByLabelText("CVV"), "1a234");

    expect(screen.getByLabelText("Número de tarjeta")).toHaveValue("4242 4242 4242 4242");
    expect(screen.getByLabelText("Vencimiento")).toHaveValue("08/29");
    expect(screen.getByLabelText("CVV")).toHaveValue("123");
  });

  it("con los campos vacíos muestra un mensaje en cada uno y no envía el pago", async () => {
    const api = simularApi();
    const usuario = userEvent.setup();
    mostrar();

    await usuario.click(pagar());

    expect(screen.getByText("Ingresa el número de la tarjeta")).toBeInTheDocument();
    expect(screen.getByText("Ingresa el nombre del titular")).toBeInTheDocument();
    expect(screen.getByText("Ingresa el vencimiento")).toBeInTheDocument();
    expect(screen.getByText("Ingresa el CVV")).toBeInTheDocument();
    expect(screen.getByLabelText("Número de tarjeta")).toHaveFocus();
    expect(api).not.toHaveBeenCalled();
  });

  it("no envía una tarjeta vencida", async () => {
    const api = simularApi();
    const usuario = userEvent.setup();
    mostrar();

    await llenarTarjeta(usuario, "4242424242424242", "1026");
    await usuario.click(pagar());

    expect(screen.getByText("La tarjeta está vencida")).toBeInTheDocument();
    expect(screen.getByLabelText("Vencimiento")).toHaveFocus();
    expect(api).not.toHaveBeenCalled();
  });

  it("con una tarjeta válida paga el pedido y avisa a la página", async () => {
    const pago = {
      numero: "TF-20261122-483920",
      estado: "PAGADO",
      monto: 24.9,
      ultimosDigitos: "4242",
      pagadoEn: "2026-11-23T01:00:00.000Z",
    };
    const api = simularApi({ estado: 201, cuerpo: pago });
    const usuario = userEvent.setup();
    const { onPagado } = mostrar();

    await llenarTarjeta(usuario, "4242424242424242", "0829");
    await usuario.click(pagar());

    expect(llamada(api)).toMatchObject({ ruta: "/pedidos/TF-20261122-483920/pago", metodo: "POST" });
    expect(onPagado).toHaveBeenCalledWith(pago);
  });

  it("si la API rechaza la tarjeta (402), muestra «Pago rechazado»", async () => {
    simularApi({ estado: 402, cuerpo: { message: "Pago rechazado" } });
    const usuario = userEvent.setup();
    const { onPagado } = mostrar();

    await llenarTarjeta(usuario, "4242424242420000", "0829");
    await usuario.click(pagar());

    expect(await screen.findByText("Pago rechazado")).toBeInTheDocument();
    expect(onPagado).not.toHaveBeenCalled();
  });
});
