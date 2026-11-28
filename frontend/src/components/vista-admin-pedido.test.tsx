import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { VistaAdminPedido } from "@/components/vista-admin-pedido";
import type { EstadoPedido } from "@/lib/pedidos";
import { llamada, simularApi } from "@/test/respuestas";

vi.mock("@/lib/sesion", async (original) => {
  const sesion = { token: "token-de-prueba", usuario: { id: 1, nombre: "Lucía", correo: "", rol: "ADMINISTRADOR" } };
  return { ...(await original<typeof import("@/lib/sesion")>()), useSesion: () => sesion };
});

const NUMERO = "TF-20261122-000001";
const pedido = (estado: EstadoPedido) => ({
  numero: NUMERO,
  cliente: "Rosa Quispe",
  estado,
  total: 24.9,
  unidades: 1,
  creadoEn: "2026-11-22T14:08:00.000Z",
  entrega: {
    destinatario: "Rosa Quispe",
    telefono: "987654321",
    direccion: "Av. Los Olivos 123",
    distrito: "San Miguel",
    referencia: null,
  },
  detalles: [{ jugueteId: 8, nombre: "Ábaco de colores", precioUnitario: 24.9, cantidad: 1, subtotal: 24.9 }],
});

describe("VistaAdminPedido: cambiar el estado (HU-15)", () => {
  it("un pedido Pagado se marca Enviado y luego ofrece Entregado", async () => {
    const api = simularApi({ estado: 200, cuerpo: pedido("PAGADO") }, { estado: 200, cuerpo: pedido("ENVIADO") });
    const usuario = userEvent.setup();
    render(<VistaAdminPedido numero={NUMERO} />);

    await usuario.click(await screen.findByRole("button", { name: "Marcar como Enviado" }));

    expect(await screen.findByText("Pedido marcado como Enviado.")).toBeInTheDocument();
    expect(llamada(api, 1)).toEqual({
      ruta: `/admin/pedidos/${NUMERO}/estado`,
      metodo: "PATCH",
      cuerpo: { estado: "ENVIADO" },
    });
    expect(screen.getByRole("button", { name: "Marcar como Entregado" })).toBeInTheDocument();
  });

  it.each([
    ["PENDIENTE", "Espera el pago del cliente. Cuando esté Pagado podrás marcarlo como Enviado."],
    ["ENTREGADO", "El pedido está Entregado: ya no cambia de estado."],
  ] as const)("un pedido %s no ofrece cambios", async (estado, texto) => {
    simularApi({ estado: 200, cuerpo: pedido(estado) });
    render(<VistaAdminPedido numero={NUMERO} />);

    expect(await screen.findByText(texto)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Marcar como/ })).not.toBeInTheDocument();
  });

  it("si el pedido ya había cambiado (409), muestra el motivo y lo vuelve a leer", async () => {
    const mensaje = "El pedido ya está Enviado: solo puede marcarse como Entregado";
    simularApi(
      { estado: 200, cuerpo: pedido("PAGADO") },
      { estado: 409, cuerpo: { message: mensaje } },
      { estado: 200, cuerpo: pedido("ENVIADO") },
    );
    const usuario = userEvent.setup();
    render(<VistaAdminPedido numero={NUMERO} />);

    await usuario.click(await screen.findByRole("button", { name: "Marcar como Enviado" }));

    expect(await screen.findByRole("button", { name: "Marcar como Entregado" })).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent(mensaje);
  });
});
