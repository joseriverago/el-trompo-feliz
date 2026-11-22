import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
}
