import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module.js';
import { Juguete } from './entities/juguete.entity.js';
import { JuguetesController } from './juguetes.controller.js';
import { JuguetesService } from './juguetes.service.js';

/** Subsistema Catálogo: las rutas de administración requieren ISesion y RolesGuard (AuthModule). */
@Module({
  imports: [TypeOrmModule.forFeature([Juguete]), AuthModule],
  controllers: [JuguetesController],
  providers: [JuguetesService],
  // El carrito y la compra usan JuguetesService como IInventario (verificar y descontar stock).
  exports: [JuguetesService],
})
export class JuguetesModule {}
