import { ServiceUnavailableException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';

describe('AppController', () => {
  let appController: AppController;
  const dataSource = { query: vi.fn() };

  beforeEach(async () => {
    dataSource.query.mockReset();
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService, { provide: DataSource, useValue: dataSource }],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  it('GET / devuelve el nombre de la API', () => {
    expect(appController.obtenerInformacion()).toEqual({
      nombre: 'API de El Trompo Feliz',
      estado: 'ok',
    });
  });

  it('GET /salud informa que la base de datos está conectada', async () => {
    dataSource.query.mockResolvedValue([{ '?column?': 1 }]);

    await expect(appController.verificarSalud()).resolves.toEqual({
      estado: 'ok',
      baseDeDatos: 'conectada',
    });
    expect(dataSource.query).toHaveBeenCalledWith('SELECT 1');
  });

  it('GET /salud responde 503 si no hay conexión con la base de datos', async () => {
    dataSource.query.mockRejectedValue(new Error('connection refused'));

    await expect(appController.verificarSalud()).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });
});
