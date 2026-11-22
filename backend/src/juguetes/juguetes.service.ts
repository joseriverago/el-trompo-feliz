import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { type EntityManager, In, MoreThanOrEqual, Repository } from 'typeorm';
import { ID_MAXIMO } from '../database/limites.js';
import { Juguete } from './entities/juguete.entity.js';
import {
  aJugueteCatalogo,
  aJugueteDetalle,
  type JugueteCatalogo,
  type JugueteDetalle,
} from './juguete-catalogo.js';

/**
 * Orden alfabético en español: «Ábaco» va junto a «Ajedrez». PostgreSQL en Neon
 * ordena por código de carácter y dejaría las vocales con tilde después de la «Z».
 */
const ORDEN_ALFABETICO = new Intl.Collator('es', { sensitivity: 'base' });

const JUGUETE_NO_ENCONTRADO = 'Juguete no encontrado';
export const STOCK_INSUFICIENTE =
  'Algunos juguetes ya no tienen stock suficiente';

/** Unidades de un juguete que se descuentan al aprobarse el pago (HU-09). */
export interface LineaStock {
  jugueteId: number;
  nombre: string;
  cantidad: number;
}

/** Un juguete que ya no tiene las unidades pedidas, con el stock que le queda. */
export interface FaltaStock {
  jugueteId: number;
  nombre: string;
  stock: number;
  mensaje: string;
}

/** Mensaje cuando se piden más unidades de las que hay, por ejemplo «Solo quedan 3 unidades». */
export function mensajeSinStock(stock: number): string {
  if (stock <= 0) return 'Este juguete está agotado';
  return stock === 1 ? 'Solo queda 1 unidad' : `Solo quedan ${stock} unidades`;
}

@Injectable()
export class JuguetesService {
  constructor(
    @InjectRepository(Juguete)
    private readonly juguetes: Repository<Juguete>,
  ) {}

  /** Juguetes activos con su categoría, ordenados por nombre. Los desactivados no se muestran. */
  async listarCatalogo(): Promise<JugueteCatalogo[]> {
    const juguetes = await this.juguetes.find({
      where: { activo: true },
      relations: { categoria: true },
    });
    return juguetes
      .sort((a, b) => ORDEN_ALFABETICO.compare(a.nombre, b.nombre))
      .map(aJugueteCatalogo);
  }

  /** Detalle de un juguete activo. Responde 404 si no existe o fue desactivado. */
  async obtenerDetalle(id: number): Promise<JugueteDetalle> {
    const juguete =
      id >= 1 && id <= ID_MAXIMO
        ? await this.juguetes.findOne({
            where: { id, activo: true },
            relations: { categoria: true },
          })
        : null;
    if (!juguete) {
      throw new NotFoundException(JUGUETE_NO_ENCONTRADO);
    }
    return aJugueteDetalle(juguete);
  }

  /**
   * IInventario: confirma que el juguete sigue a la venta y que hay al menos `cantidad`
   * unidades. Responde 404 si no existe o fue desactivado, y 409 «Solo quedan N unidades»
   * si no alcanza el stock. El carrito y la compra lo usan antes de guardar.
   */
  async verificarStock(jugueteId: number, cantidad: number): Promise<Juguete> {
    const juguete = await this.juguetes.findOneBy({
      id: jugueteId,
      activo: true,
    });
    if (!juguete) {
      throw new NotFoundException(JUGUETE_NO_ENCONTRADO);
    }
    if (juguete.stock < cantidad) {
      throw new ConflictException({
        statusCode: 409,
        message: mensajeSinStock(juguete.stock),
        stock: juguete.stock,
      });
    }
    return juguete;
  }

  /**
   * IInventario: descuenta las unidades de cada línea dentro de la transacción del pago (HU-09).
   * Cada línea es un UPDATE con la condición «stock >= cantidad»: si otro cliente compró las
   * últimas unidades, la fila no cambia y nunca se vende de más. Si alguna línea no alcanza,
   * responde 409 con los juguetes que faltan; quien llama deshace la transacción y no se
   * descuenta nada. Las líneas van ordenadas por id para que dos pagos simultáneos bloqueen
   * los juguetes en el mismo orden y no se queden esperando el uno al otro.
   */
  async descontarStock(
    gestor: EntityManager,
    lineas: LineaStock[],
  ): Promise<void> {
    const ordenadas = [...lineas].sort((a, b) => a.jugueteId - b.jugueteId);
    const sinStock: LineaStock[] = [];
    for (const linea of ordenadas) {
      const { affected } = await gestor.decrement(
        Juguete,
        {
          id: linea.jugueteId,
          activo: true,
          stock: MoreThanOrEqual(linea.cantidad),
        },
        'stock',
        linea.cantidad,
      );
      if (affected !== 1) sinStock.push(linea);
    }
    if (sinStock.length > 0) {
      throw new ConflictException({
        statusCode: 409,
        message: STOCK_INSUFICIENTE,
        juguetes: await this.describirFaltas(gestor, sinStock),
      });
    }
  }

  /** Stock actual de los juguetes que no alcanzaron; uno desactivado cuenta como agotado. */
  private async describirFaltas(
    gestor: EntityManager,
    lineas: LineaStock[],
  ): Promise<FaltaStock[]> {
    const juguetes = await gestor.findBy(Juguete, {
      id: In(lineas.map((linea) => linea.jugueteId)),
    });
    return lineas.map(({ jugueteId, nombre }) => {
      const juguete = juguetes.find((actual) => actual.id === jugueteId);
      const stock = juguete?.activo ? juguete.stock : 0;
      return { jugueteId, nombre, stock, mensaje: mensajeSinStock(stock) };
    });
  }
}
