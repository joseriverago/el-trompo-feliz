import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Catalogo } from "@/components/catalogo";
import type { JugueteCatalogo } from "@/lib/juguetes";
import { simularApi } from "@/test/respuestas";

vi.mock("@/components/tarjeta-juguete", () => ({
  TarjetaJuguete: ({ juguete }: { juguete: JugueteCatalogo }) => <article>{juguete.nombre}</article>,
}));

vi.mock("@/lib/categorias", () => ({
  obtenerCategorias: () => Promise.resolve([{ id: 2, nombre: "Peluches" }]),
}));

const juguete = (id: number, nombre: string) => ({ id, nombre }) as JugueteCatalogo;
const TODOS = [juguete(1, "Ábaco de colores"), juguete(3, "Osito de peluche Bruno")];
const consulta = (api: ReturnType<typeof simularApi>, posicion: number) =>
  new URL(String(api.mock.calls[posicion][0])).search;

describe("Catalogo: búsqueda por nombre (HU-16)", () => {
  it("pide a la API los juguetes con ese texto y, al borrarlo, vuelve a todo el catálogo", async () => {
    const api = simularApi(
      { estado: 200, cuerpo: TODOS },
      { estado: 200, cuerpo: [TODOS[1]] },
      { estado: 200, cuerpo: TODOS },
    );
    const usuario = userEvent.setup();
    render(<Catalogo />);
    await screen.findByText("2 juguetes");

    const campo = screen.getByLabelText("Buscar juguetes por nombre");
    await usuario.type(campo, "pelu{Enter}");

    expect(await screen.findByText("1 juguete")).toBeInTheDocument();
    expect(screen.queryByText("Ábaco de colores")).not.toBeInTheDocument();
    expect(consulta(api, 1)).toBe("?nombre=pelu");

    await usuario.clear(campo);
    await usuario.click(screen.getByRole("button", { name: "Buscar" }));

    expect(await screen.findByText("2 juguetes")).toBeInTheDocument();
    expect(consulta(api, 2)).toBe("");
  });

  it("sin coincidencias muestra «No encontramos juguetes con ese nombre»", async () => {
    simularApi({ estado: 200, cuerpo: TODOS }, { estado: 200, cuerpo: [] });
    const usuario = userEvent.setup();
    render(<Catalogo />);
    await screen.findByText("2 juguetes");

    await usuario.type(screen.getByLabelText("Buscar juguetes por nombre"), "robot{Enter}");

    expect(await screen.findByText("No encontramos juguetes con ese nombre")).toBeInTheDocument();
  });
});

describe("Catalogo: filtros (HU-17)", () => {
  it("combina búsqueda, categoría, edad y precio; «Limpiar filtros» vuelve a todo", async () => {
    const api = simularApi({ estado: 200, cuerpo: TODOS }, { estado: 200, cuerpo: [] }, { estado: 200, cuerpo: TODOS });
    const usuario = userEvent.setup();
    render(<Catalogo />);
    await screen.findByText("2 juguetes");

    await usuario.type(screen.getByLabelText("Buscar juguetes por nombre"), "osito");
    await usuario.selectOptions(screen.getByLabelText("Categoría"), "Peluches");
    await usuario.selectOptions(screen.getByLabelText("Edad"), "13+");
    await usuario.type(screen.getByLabelText("Precio mínimo (S/)"), "20,50");
    await usuario.type(screen.getByLabelText("Precio máximo (S/)"), "60");
    await usuario.click(screen.getByRole("button", { name: "Aplicar filtros" }));

    expect(await screen.findByText("No encontramos juguetes con esos filtros")).toBeInTheDocument();
    expect(Object.fromEntries(new URLSearchParams(consulta(api, 1)))).toEqual({
      nombre: "osito",
      categoriaId: "2",
      edad: "13+",
      precioMin: "20.5",
      precioMax: "60",
    });

    await usuario.click(screen.getByRole("button", { name: "Limpiar filtros" }));

    expect(await screen.findByText("2 juguetes")).toBeInTheDocument();
    expect(consulta(api, 2)).toBe("");
    expect(screen.getByLabelText("Buscar juguetes por nombre")).toHaveValue("");
    expect(screen.getByLabelText("Precio mínimo (S/)")).toHaveValue("");
  });

  it("avisa si el precio mínimo es mayor que el máximo y no busca", async () => {
    const api = simularApi({ estado: 200, cuerpo: TODOS });
    const usuario = userEvent.setup();
    render(<Catalogo />);
    await screen.findByText("2 juguetes");

    await usuario.type(screen.getByLabelText("Precio mínimo (S/)"), "60");
    await usuario.type(screen.getByLabelText("Precio máximo (S/)"), "20{Enter}");

    expect(screen.getByRole("alert")).toHaveTextContent("El precio mínimo no puede ser mayor que el máximo");
    expect(api).toHaveBeenCalledTimes(1);
  });
});
