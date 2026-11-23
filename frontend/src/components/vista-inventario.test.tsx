import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { VistaInventario } from "@/components/vista-inventario";
import type { JugueteCatalogo } from "@/lib/juguetes";
import { llamada, simularApi } from "@/test/respuestas";

vi.mock("@/lib/sesion", async (original) => ({
  ...(await original<typeof import("@/lib/sesion")>()),
  useSesion: () => ({ token: "token-de-prueba", usuario: { id: 1, nombre: "Lucía", correo: "", rol: "ADMINISTRADOR" } }),
}));

function juguete(id: number, nombre: string, stock: number): JugueteCatalogo {
  return {
    id,
    nombre,
    precio: 29.9,
    imagenUrl: "https://placehold.co/600x400",
    edadMinima: 3,
    edadMaxima: 99,
    stock,
    agotado: stock <= 0,
    categoria: { id: 1, nombre: "Juegos de mesa" },
  };
}

const CATALOGO = [juguete(1, "Ajedrez de madera", 9), juguete(2, "Llama de peluche andina", 0), juguete(3, "Trompo de madera", 4)];

const fila = (nombre: string) => screen.getByText(nombre).closest("tr") as HTMLElement;

describe("VistaInventario (HU-13)", () => {
  it("resalta como «Stock bajo» los juguetes con 5 unidades o menos, y «Agotado» el que tiene 0", async () => {
    simularApi({ estado: 200, cuerpo: CATALOGO });
    render(<VistaInventario />);

    expect(await screen.findByText("2 con stock bajo")).toBeInTheDocument();
    expect(within(fila("Trompo de madera")).getByText("Stock bajo")).toBeInTheDocument();
    expect(within(fila("Llama de peluche andina")).getByText("Agotado")).toBeInTheDocument();
    expect(within(fila("Ajedrez de madera")).queryByText("Stock bajo")).not.toBeInTheDocument();
  });

  it("guarda la nueva cantidad con PATCH y actualiza la fila", async () => {
    const api = simularApi(
      { estado: 200, cuerpo: CATALOGO },
      { estado: 200, cuerpo: { ...juguete(3, "Trompo de madera", 25), descripcion: "Trompo" } },
    );
    const usuario = userEvent.setup();
    render(<VistaInventario />);

    const campo = await screen.findByLabelText("Nueva cantidad de Trompo de madera");
    await usuario.clear(campo);
    await usuario.type(campo, "25");
    await usuario.click(within(fila("Trompo de madera")).getByRole("button", { name: "Guardar" }));

    expect(await screen.findByText("Stock actualizado")).toBeInTheDocument();
    expect(llamada(api, 1)).toEqual({ ruta: "/juguetes/3/stock", metodo: "PATCH", cuerpo: { stock: 25 } });
    expect(within(fila("Trompo de madera")).queryByText("Stock bajo")).not.toBeInTheDocument();
    expect(screen.getByText("1 con stock bajo")).toBeInTheDocument();
  });

  it.each(["-3", "2.5", "diez"])("con «%s» muestra el error y no llama a la API (criterio 4)", async (cantidad) => {
    const api = simularApi({ estado: 200, cuerpo: CATALOGO });
    const usuario = userEvent.setup();
    render(<VistaInventario />);

    const campo = await screen.findByLabelText("Nueva cantidad de Ajedrez de madera");
    await usuario.clear(campo);
    await usuario.type(campo, cantidad);
    await usuario.click(within(fila("Ajedrez de madera")).getByRole("button", { name: "Guardar" }));

    expect(screen.getByText("El stock debe ser un número entero de 0 o más")).toBeInTheDocument();
    expect(campo).toHaveFocus();
    expect(api).toHaveBeenCalledTimes(1);
    expect(within(fila("Ajedrez de madera")).getByText("9")).toBeInTheDocument();
  });

  it("«Ver solo los de stock bajo» oculta los demás", async () => {
    simularApi({ estado: 200, cuerpo: CATALOGO });
    const usuario = userEvent.setup();
    render(<VistaInventario />);

    await usuario.click(await screen.findByLabelText("Ver solo los de stock bajo"));

    expect(screen.queryByText("Ajedrez de madera")).not.toBeInTheDocument();
    expect(screen.getByText("Trompo de madera")).toBeInTheDocument();
  });
});
