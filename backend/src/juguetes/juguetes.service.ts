import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Between,
  type EntityManager,
  type FindOptionsWhere,
  In,
  LessThanOrEqual,
  MoreThanOrEqual,
  Repository,
} from 'typeorm';
import { normalizarTexto } from '../comun/texto.js';
import { REVISA_FORMULARIO } from '../config/pipe-validacion.js';
import { esViolacionLlaveForanea } from '../database/errores.js';
import { ID_MAXIMO } from '../database/limites.js';
import type { FiltrosCatalogoDto } from './dto/filtros-catalogo.dto.js';
import type {
  GuardarJugueteDto,
  RegistrarJugueteDto,
} from './dto/guardar-juguete.dto.js';
import { Juguete } from './entities/juguete.entity.js';
import {
  aJugueteCatalogo,
  aJugueteDetalle,
  type JugueteCatalogo,
  type JugueteDetalle,
} from './juguete-catalogo.js';
import { RANGOS_EDAD } from './rangos-edad.js';

/**
 * Orden alfabético en español: «Ábaco» va junto a «Ajedrez». PostgreSQL en Neon
 * ordena por código de carácter y dejaría las vocales con tilde después de la «Z».
 */
const ORDEN_ALFABETICO = new Intl.Collator('es', { sensitivity: 'base' });

export const JUGUETE_NO_ENCONTRADO = 'Juguete no encontrado';
export const EDADES_INVERTIDAS =
  'La edad mínima no puede ser mayor que la máxima';
export const PRECIOS_INVERTIDOS =
  'El precio mínimo no puede ser mayor que el máximo';
export const CATEGORIA_INEXISTENTE = 'Elige una categoría de la lista';
export const STOCK_INSUFICIENTE =
  'Algunos juguetes ya no tienen stock suficiente';

/**
 * Condiciones de la consulta del catálogo (HU-17). La edad coincide cuando el rango elegido se
 * cruza con la edad recomendada: «de 3 a 8 años» aparece en 3–5 y en 6–8.
 */
function condicionesDelCatalogo({
  categoriaId,
  edad,
  precioMin,
  precioMax,
}: FiltrosCatalogoDto): FindOptionsWhere<Juguete> {
  const condiciones: FindOptionsWhere<Juguete> = { activo: true };
  if (categoriaId !== undefined) condiciones.categoriaId = categoriaId;
  if (edad) {
    const [desde, hasta] = RANGOS_EDAD[edad];
    condiciones.edadMinima = LessThanOrEqual(hasta);
    condiciones.edadMaxima = MoreThanOrEqual(desde);
  }
  if (precioMin !== undefined && precioMax !== undefined) {
    condiciones.precio = Between(precioMin, precioMax);
  } else if (precioMin !== undefined) {
    condiciones.precio = MoreThanOrEqual(precioMin);
  } else if (precioMax !== undefined) {
    condiciones.precio = LessThanOrEqual(precioMax);
  }
  return condiciones;
}

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

/** 400 con el mensaje junto al campo, igual que los errores del pipe de validación. */
function errorDeCampo(campo: string, mensaje: string): BadRequestException {
  return new BadRequestException({
    statusCode: 400,
    message: REVISA_FORMULARIO,
    errores: { [campo]: mensaje },
  });
}

/** Un id que no cabe en la columna integer no puede existir: se responde 404 sin consultar. */
function idValido(id: number): boolean {
  return Number.isInteger(id) && id >= 1 && id <= ID_MAXIMO;
}

/** Los datos que se guardan al editar: todos menos el stock, que se cambia en el inventario (HU-13). */
function datosEditables(datos: GuardarJugueteDto) {
  return {
    nombre: datos.nombre,
    descripcion: datos.descripcion,
    precio: datos.precio,
    imagenUrl: datos.imagenUrl,
    categoriaId: datos.categoriaId,
    edadMinima: datos.edadMinima,
    edadMaxima: datos.edadMaxima,
  };
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

  /**
   * Juguetes activos con su categoría, ordenados por nombre. Los desactivados no se muestran.
   * Con `nombre`, solo los que lo contienen, sin importar mayúsculas ni tildes (HU-16). Los
   * filtros de categoría, edad y precio (HU-17) se cumplen todos a la vez.
   */
  async listarCatalogo(
    filtros: FiltrosCatalogoDto = {},
  ): Promise<JugueteCatalogo[]> {
    const { precioMin, precioMax } = filtros;
    if (
      precioMin !== undefined &&
      precioMax !== undefined &&
      precioMin > precioMax
    ) {
      throw errorDeCampo('precioMin', PRECIOS_INVERTIDOS);
    }
    const juguetes = await this.juguetes.find({
      where: condicionesDelCatalogo(filtros),
      relations: { categoria: true },
    });
    const buscado = normalizarTexto(filtros.nombre ?? '');
    return juguetes
      .filter((juguete) => normalizarTexto(juguete.nombre).includes(buscado))
      .sort((a, b) => ORDEN_ALFABETICO.compare(a.nombre, b.nombre))
      .map(aJugueteCatalogo);
  }

  /** Detalle de un juguete activo. Responde 404 si no existe o fue desactivado. */
  async obtenerDetalle(id: number): Promise<JugueteDetalle> {
    return aJugueteDetalle(await this.buscarActivo(id));
  }

  /**
   * IAdminCatalogo: registra un juguete nuevo, activo y con su stock inicial (HU-12, criterio 2).
   * Responde 400 si la edad mínima supera la máxima o si la categoría ya no existe.
   */
  async registrar(datos: RegistrarJugueteDto): Promise<Juguete> {
    this.validarEdades(datos);
    const nuevo = this.juguetes.create({
      ...datosEditables(datos),
      stock: datos.stock,
      activo: true,
    });
    const { id } = await this.guardarConCategoria(() =>
      this.juguetes.save(nuevo),
    );
    return this.buscarActivo(id);
  }

  /**
   * IAdminCatalogo: cambia los datos de un juguete activo, sin tocar su stock (HU-12, criterio 3).
   * Es un UPDATE con la condición «activo»: si otro administrador lo eliminó, responde 404.
   */
  async editar(id: number, datos: GuardarJugueteDto): Promise<Juguete> {
    this.validarEdades(datos);
    if (!idValido(id)) throw new NotFoundException(JUGUETE_NO_ENCONTRADO);
    const { affected } = await this.guardarConCategoria(() =>
      this.juguetes.update({ id, activo: true }, datosEditables(datos)),
    );
    if (affected !== 1) throw new NotFoundException(JUGUETE_NO_ENCONTRADO);
    return this.buscarActivo(id);
  }

  /**
   * IAdminCatalogo: fija el stock de un juguete activo con la cantidad que contó el
   * administrador (HU-13). Con 0, el catálogo lo muestra «Agotado». 404 si no existe o fue eliminado.
   */
  async actualizarStock(id: number, stock: number): Promise<Juguete> {
    if (!idValido(id)) throw new NotFoundException(JUGUETE_NO_ENCONTRADO);
    const { affected } = await this.juguetes.update(
      { id, activo: true },
      { stock },
    );
    if (affected !== 1) throw new NotFoundException(JUGUETE_NO_ENCONTRADO);
    return this.buscarActivo(id);
  }

  /**
   * IAdminCatalogo: «eliminar» un juguete lo desactiva (activo = falso) y no borra la fila (HU-20):
   * sale del catálogo y del carrito, y los pedidos anteriores conservan sus líneas. 404 si no existe
   * o ya estaba eliminado (por ejemplo, otro administrador lo eliminó antes).
   */
  async desactivar(id: number): Promise<void> {
    if (!idValido(id)) throw new NotFoundException(JUGUETE_NO_ENCONTRADO);
    const { affected } = await this.juguetes.update(
      { id, activo: true },
      { activo: false },
    );
    if (affected !== 1) throw new NotFoundException(JUGUETE_NO_ENCONTRADO);
  }

  /** Juguete activo con su categoría; 404 si no existe, fue desactivado o el id está fuera de rango. */
  private async buscarActivo(id: number): Promise<Juguete> {
    const juguete = idValido(id)
      ? await this.juguetes.findOne({
          where: { id, activo: true },
          relations: { categoria: true },
        })
      : null;
    if (!juguete) {
      throw new NotFoundException(JUGUETE_NO_ENCONTRADO);
    }
    return juguete;
  }

  private validarEdades(datos: GuardarJugueteDto): void {
    if (datos.edadMinima > datos.edadMaxima) {
      throw errorDeCampo('edadMinima', EDADES_INVERTIDAS);
    }
  }

  /** Si la categoría elegida ya no existe (falla la llave foránea), responde 400 junto al campo. */
  private async guardarConCategoria<T>(guardar: () => Promise<T>): Promise<T> {
    try {
      return await guardar();
    } catch (error) {
      if (esViolacionLlaveForanea(error)) {
        throw errorDeCampo('categoriaId', CATEGORIA_INEXISTENTE);
      }
      throw error;
    }
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
