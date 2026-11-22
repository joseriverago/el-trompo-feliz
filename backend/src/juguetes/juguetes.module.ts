import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Juguete } from './entities/juguete.entity.js';
import { JuguetesController } from './juguetes.controller.js';
import { JuguetesService } from './juguetes.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Juguete])],
  controllers: [JuguetesController],
  providers: [JuguetesService],
})
export class JuguetesModule {}
