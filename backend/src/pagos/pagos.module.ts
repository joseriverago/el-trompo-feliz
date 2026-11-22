import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module.js';
import { JuguetesModule } from '../juguetes/juguetes.module.js';
import { PedidosModule } from '../pedidos/pedidos.module.js';
import { Pago } from './entities/pago.entity.js';
import { PagosController } from './pagos.controller.js';
import { PagosService } from './pagos.service.js';

/** Subsistema Pagos: requiere ISesion (AuthModule), IPedidos (PedidosModule) e IInventario (JuguetesModule). */
@Module({
  imports: [
    TypeOrmModule.forFeature([Pago]),
    AuthModule,
    PedidosModule,
    JuguetesModule,
  ],
  controllers: [PagosController],
  providers: [PagosService],
})
export class PagosModule {}
