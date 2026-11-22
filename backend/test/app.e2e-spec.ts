import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from './../src/app.module.js';
import { cargarEntorno } from './../src/config/cargar-entorno.js';

// Esta prueba se conecta a la base de datos real: necesita DATABASE_URL en backend/.env.
cargarEntorno();

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('GET /', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect({ nombre: 'API de El Trompo Feliz', estado: 'ok' });
  });

  it('GET /salud', () => {
    return request(app.getHttpServer())
      .get('/salud')
      .expect(200)
      .expect({ estado: 'ok', baseDeDatos: 'conectada' });
  });

  it('GET /juguetes devuelve el catálogo con la categoría de cada juguete', async () => {
    const respuesta = await request(app.getHttpServer())
      .get('/juguetes')
      .expect(200);

    const juguetes = respuesta.body as Array<Record<string, unknown>>;
    expect(juguetes.length).toBeGreaterThan(0);
    for (const juguete of juguetes) {
      expect(juguete).toEqual({
        id: expect.any(Number),
        nombre: expect.any(String),
        precio: expect.any(Number),
        imagenUrl: expect.any(String),
        edadMinima: expect.any(Number),
        edadMaxima: expect.any(Number),
        stock: expect.any(Number),
        agotado: juguete.stock === 0,
        categoria: { id: expect.any(Number), nombre: expect.any(String) },
      });
    }

    const nombres = juguetes.map((juguete) => juguete.nombre as string);
    const ordenEspanol = new Intl.Collator('es', { sensitivity: 'base' });
    expect(nombres).toEqual([...nombres].sort(ordenEspanol.compare));
  });

  afterEach(async () => {
    await app.close();
  });
});
