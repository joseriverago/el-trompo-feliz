import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  type EntityManager,
  type FindOneOptions,
  In,
  type Repository,
} from 'typeorm';
import { esViolacionUnica } from '../database/errores.js';
import { JuguetesService } from '../juguetes/juguetes.service.js';
import { Carrito } from './entities/carrito.entity.js';
import { ItemCarrito } from './entities/item-carrito.entity.js';

/** El carrito con sus líneas en el orden en que se agregaron, y el juguete de cada una. */
const CON_ITEMS: Omit<FindOneOptions<Carrito>, 'where'> = {
  relations: { items: { juguete: true } },
  order: { items: { id: 'ASC' } },
};

export const LINEA_NO_ENCONTRADA = 'Este juguete ya no está en tu carrito';
export const CARRITO_CAMBIO =
  'Tu carrito cambió mientras comprabas: revísalo y vuelve a intentarlo';

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

  /**
   * Cambia la cantidad de una línea del carrito (HU-06). La cantidad ya llega validada
   * (entero de 1 o más); aquí IInventario verifica que no supere el stock: si no alcanza,
   * responde 409 «Solo quedan N unidades» y la línea no cambia.
   */
  async cambiarCantidad(
    usuarioId: number,
    itemId: number,
    cantidad: number,
  ): Promise<Carrito> {
    const item = await this.buscarLinea(usuarioId, itemId);
    await this.juguetesService.verificarStock(item.jugueteId, cantidad);
    await this.items.update({ id: item.id }, { cantidad });
    return this.obtenerCarrito(usuarioId);
  }

  /** Quita una línea del carrito (HU-06) y devuelve el carrito sin ella. */
  async quitarItem(usuarioId: number, itemId: number): Promise<Carrito> {
    const item = await this.buscarLinea(usuarioId, itemId);
    await this.items.delete({ id: item.id });
    return this.obtenerCarrito(usuarioId);
  }

  /**
   * ICarrito: vacía el carrito al generar el pedido (HU-08), dentro de la transacción del
   * pedido (`gestor`). Borra exactamente las líneas que se copiaron al pedido: si alguna ya no
   * está (por ejemplo, un doble clic en «Continuar al pago» generó el pedido un instante antes),
   * responde 409 y la transacción se deshace, así el mismo carrito no genera dos pedidos.
   */
  async vaciar(gestor: EntityManager, carrito: Carrito): Promise<void> {
    const ids = carrito.items.map((item) => item.id);
    if (ids.length === 0) return;
    const { affected } = await gestor.delete(ItemCarrito, {
      carritoId: carrito.id,
      id: In(ids),
    });
    if (affected !== ids.length) {
      throw new ConflictException({ statusCode: 409, message: CARRITO_CAMBIO });
    }
  }

  /**
   * La línea se busca dentro del carrito del cliente del token: así nadie puede cambiar
   * ni quitar una línea del carrito de otra persona. Si no está, responde 404.
   */
  private async buscarLinea(
    usuarioId: number,
    itemId: number,
  ): Promise<ItemCarrito> {
    const carrito = await this.obtenerCarrito(usuarioId);
    const item = carrito.items.find((linea) => linea.id === itemId);
    if (!item)
      throw new NotFoundException({
        statusCode: 404,
        message: LINEA_NO_ENCONTRADA,
      });
    return item;
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
