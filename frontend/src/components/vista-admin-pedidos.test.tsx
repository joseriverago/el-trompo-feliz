import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { VistaAdminPedidos } from "@/components/vista-admin-pedidos";
import { llamada, simularApi } from "@/test/respuestas";

vi.mock("@/lib/sesion", async (original) => {
  const sesion = { token: "token-de-prueba", usuario: { id: 1, nombre: "Lucía", correo: "", rol: "ADMINISTRADOR" } };
  return { ...(await original<typeof import("@/lib/sesion")>()), useSesion: () => sesion };
});

const fila = (numero: string, cliente: string, estado: string) => ({
  numero,
  cliente,
  estado,
  total: 100.5,
  unidades: 5,
  creadoEn: "2026-11-22T14:08:00.000Z",
});

describe("VistaAdminPedidos (HU-14)", () => {
  it("lista número, cliente, total y estado, con enlace al detalle", async () => {
    const api = simularApi({ estado: 200, cuerpo: [fila("TF-20261122-000001", "Rosa Quispe", "PAGADO")] });
    render(<VistaAdminPedidos />);

    const enlace = await screen.findByRole("link", { name: "TF-20261122-000001" });
    expect(enlace).toHaveAttribute("href", "/admin/pedidos/TF-20261122-000001");
    const celdas = within(enlace.closest("tr") as HTMLElement);
    expect(celdas.getByText("Rosa Quispe")).toBeInTheDocument();
    expect(celdas.getByText("S/ 100.50")).toBeInTheDocument();
    expect(celdas.getByText("Pagado")).toBeInTheDocument();
    expect(llamada(api).ruta).toBe("/admin/pedidos");
  });

  it("al elegir un estado pide solo esos pedidos", async () => {
    const api = simularApi(
      { estado: 200, cuerpo: [fila("TF-20261122-000001", "Rosa Quispe", "PAGADO")] },
      { estado: 200, cuerpo: [] },
    );
    const usuario = userEvent.setup();
    render(<VistaAdminPedidos />);

    await screen.findByRole("table");
    await usuario.selectOptions(screen.getByLabelText("Estado"), "ENVIADO");

    expect(await screen.findByText("No hay pedidos en estado Enviado.")).toBeInTheDocument();
    expect(new URL(String(api.mock.calls[1][0])).search).toBe("?estado=ENVIADO");
  });
});
