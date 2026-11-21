import { Controller, Get } from '@nestjs/common';
import {
  AppService,
  type EstadoSalud,
  type InformacionApi,
} from './app.service.js';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  obtenerInformacion(): InformacionApi {
    return this.appService.obtenerInformacion();
  }

  @Get('salud')
  verificarSalud(): Promise<EstadoSalud> {
    return this.appService.verificarSalud();
  }
}
