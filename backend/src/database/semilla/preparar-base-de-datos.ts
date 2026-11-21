/**
 * Crea o actualiza el esquema en PostgreSQL (Neon) y carga los datos semilla.
 * Uso: `npm run db:preparar` desde backend/.
 *
 * Se puede ejecutar varias veces: solo agrega lo que falta y nunca borra ni
 * sobrescribe datos (por ejemplo, no reinicia el stock de un juguete existente).
 */
import { hash } from 'bcryptjs';
import { DataSource, type EntityManager } from 'typeorm';
import { Categoria } from '../../categorias/entities/categoria.entity.js';
import { cargarEntorno } from '../../config/cargar-entorno.js';
import { Juguete } from '../../juguetes/entities/juguete.entity.js';
import { Usuario } from '../../usuarios/entities/usuario.entity.js';
import { Rol } from '../../usuarios/enums/rol.enum.js';
import { opcionesBaseDeDatos } from '../opciones-base-de-datos.js';
import { CATEGORIAS_SEMILLA, JUGUETES_SEMILLA } from './datos-semilla.js';

const COSTO_BCRYPT = 10;

interface UsuarioSemilla {
  nombre: string;
  correo: string;
  contrasena: string;
  rol: Rol;
}

function leerVariable(nombre: string): string {
  const valor = process.env[nombre]?.trim();
  if (!valor) {
    throw new Error(`Falta la variable de entorno ${nombre} en backend/.env.`);
  }
  return valor;
}

function leerUsuariosSemilla(): UsuarioSemilla[] {
  const usuarios: UsuarioSemilla[] = [
    {
      nombre: 'Administrador de la tienda',
      correo: leerVariable('SEED_ADMIN_CORREO'),
      contrasena: leerVariable('SEED_ADMIN_CONTRASENA'),
      rol: Rol.ADMINISTRADOR,
    },
    {
      nombre: 'Cliente de prueba',
      correo: leerVariable('SEED_CLIENTE_CORREO'),
      contrasena: leerVariable('SEED_CLIENTE_CONTRASENA'),
      rol: Rol.CLIENTE,
    },
  ];

  for (const usuario of usuarios) {
    if (usuario.contrasena.length < 8) {
      throw new Error(
        `La contraseña de ${usuario.correo} debe tener al menos 8 caracteres.`,
      );
    }
  }
  return usuarios;
}

async function cargarCategorias(
  manager: EntityManager,
): Promise<Map<string, Categoria>> {
  const repositorio = manager.getRepository(Categoria);
  const categorias = new Map<string, Categoria>();
  let nuevas = 0;

  for (const { nombre } of CATEGORIAS_SEMILLA) {
    let categoria = await repositorio.findOneBy({ nombre });
    if (!categoria) {
      categoria = await repositorio.save(repositorio.create({ nombre }));
      nuevas++;
    }
    categorias.set(nombre, categoria);
  }

  console.log(`Categorías: ${nuevas} nuevas, ${categorias.size} en total.`);
  return categorias;
}

async function cargarJuguetes(
  manager: EntityManager,
  categorias: Map<string, Categoria>,
): Promise<void> {
  const repositorio = manager.getRepository(Juguete);
  let nuevos = 0;

  for (const { categoria: nombreCategoria, ...datos } of JUGUETES_SEMILLA) {
    const categoria = categorias.get(nombreCategoria);
    if (!categoria) {
      throw new Error(
        `El juguete «${datos.nombre}» usa la categoría inexistente «${nombreCategoria}».`,
      );
    }
    if (await repositorio.existsBy({ nombre: datos.nombre })) {
      continue;
    }
    await repositorio.save(
      repositorio.create({ ...datos, categoriaId: categoria.id }),
    );
    nuevos++;
  }

  console.log(`Juguetes: ${nuevos} nuevos.`);
}

async function cargarUsuarios(
  manager: EntityManager,
  usuarios: UsuarioSemilla[],
): Promise<void> {
  const repositorio = manager.getRepository(Usuario);

  for (const { contrasena, ...datos } of usuarios) {
    if (await repositorio.existsBy({ correo: datos.correo })) {
      console.log(`Usuario ${datos.correo} (${datos.rol}): ya existía.`);
      continue;
    }
    const contrasenaHash = await hash(contrasena, COSTO_BCRYPT);
    await repositorio.save(repositorio.create({ ...datos, contrasenaHash }));
    console.log(`Usuario ${datos.correo} (${datos.rol}): creado.`);
  }
}

async function prepararBaseDeDatos(): Promise<void> {
  cargarEntorno();
  const usuarios = leerUsuariosSemilla();
  const dataSource = new DataSource(opcionesBaseDeDatos());

  await dataSource.initialize();
  try {
    console.log('Sincronizando el esquema de la base de datos...');
    await dataSource.synchronize();

    await dataSource.transaction(async (manager) => {
      const categorias = await cargarCategorias(manager);
      await cargarJuguetes(manager, categorias);
      await cargarUsuarios(manager, usuarios);
    });

    console.log('Base de datos lista.');
  } finally {
    await dataSource.destroy();
  }
}

try {
  await prepararBaseDeDatos();
} catch (error) {
  console.error(
    'No se pudo preparar la base de datos:',
    error instanceof Error ? error.message : error,
  );
  process.exitCode = 1;
}
