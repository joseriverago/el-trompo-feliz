import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { DataSource } from 'typeorm';

export interface InformacionApi {
  nombre: string;
  estado: 'ok';
}

export interface EstadoSalud {
  estado: 'ok';
  baseDeDatos: 'conectada';
}

@Injectable()
export class AppService {
  constructor(private readonly dataSource: DataSource) {}

  obtenerInformacion(): InformacionApi {
    return { nombre: 'API de El Trompo Feliz', estado: 'ok' };
  }

  /** Comprueba que la API llega a PostgreSQL. Responde 503 si no hay conexión. */
  async verificarSalud(): Promise<EstadoSalud> {
    try {
      await this.dataSource.query('SELECT 1');
      return { estado: 'ok', baseDeDatos: 'conectada' };
    } catch {
      throw new ServiceUnavailableException({
        estado: 'error',
        baseDeDatos: 'sin conexión',
      });
    }
  }
}
