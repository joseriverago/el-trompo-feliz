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

  afterEach(async () => {
    await app.close();
  });
});
