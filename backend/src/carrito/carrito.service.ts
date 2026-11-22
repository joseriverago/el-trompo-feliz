import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { FindOneOptions, Repository } from 'typeorm';
import { esViolacionUnica } from '../database/errores.js';
import { JuguetesService } from '../juguetes/juguetes.service.js';
import { Carrito } from './entities/carrito.entity.js';
import { ItemCarrito } from './entities/item-carrito.entity.js';

/** El carrito con sus líneas en el orden en que se agregaron, y el juguete de cada una. */
const CON_ITEMS: Omit<FindOneOptions<Carrito>, 'where'> = {
  relations: { items: { juguete: true } },
  order: { items: { id: 'ASC' } },
};

@Injectable()
export class CarritoService {
  constructor(
    @InjectRepository(Carrito)
    private readonly carritos: Repository<Carrito>,
    @InjectRepository(ItemCarrito)
    private readonly items: Repository<ItemCarrito>,
    private readonly juguetesService: JuguetesService,
  ) {}

  /** Carrito del cliente con sus juguetes. Si todavía no tiene uno, lo crea vacío. */
  async obtenerCarrito(usuarioId: number): Promise<Carrito> {
    return (await this.buscar(usuarioId)) ?? this.crear(usuarioId);
  }

  /**
   * Agrega una unidad del juguete (HU-05). Si ya está en el carrito, aumenta su cantidad
   * en 1 sin duplicar la línea. Antes verifica el stock con IInventario: si no alcanza,
   * responde 409 «Solo quedan N unidades» y el carrito no cambia.
   * La compra vuelve a verificar el stock, porque otro cliente puede comprar mientras tanto.
   */
  async agregarJuguete(usuarioId: number, jugueteId: number): Promise<Carrito> {
    try {
      return await this.sumarUnidad(usuarioId, jugueteId);
    } catch (error) {
      // Dos clics casi a la vez pueden intentar crear la misma línea: el segundo
      // choca con la restricción UNIQUE, vuelve a leer el carrito y suma a la línea.
      if (esViolacionUnica(error))
        return this.sumarUnidad(usuarioId, jugueteId);
      throw error;
    }
  }

  private async sumarUnidad(
    usuarioId: number,
    jugueteId: number,
  ): Promise<Carrito> {
    const carrito = await this.obtenerCarrito(usuarioId);
    const item = carrito.buscarItem(jugueteId);
    const cantidad = (item?.cantidad ?? 0) + 1;

    await this.juguetesService.verificarStock(jugueteId, cantidad);

    if (item) {
      await this.items.update({ id: item.id }, { cantidad });
    } else {
      await this.items.insert({ carritoId: carrito.id, jugueteId, cantidad });
    }
    return this.obtenerCarrito(usuarioId);
  }

  private buscar(usuarioId: number): Promise<Carrito | null> {
    return this.carritos.findOne({ where: { usuarioId }, ...CON_ITEMS });
  }

  private async crear(usuarioId: number): Promise<Carrito> {
    try {
      await this.carritos.insert({ usuarioId });
    } catch (error) {
      // Otra petición del mismo cliente lo creó un instante antes: se usa ese.
      if (!esViolacionUnica(error)) throw error;
    }
    return this.carritos.findOneOrFail({ where: { usuarioId }, ...CON_ITEMS });
  }
}
