import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { cargarEntorno } from './config/cargar-entorno.js';
import { origenesPermitidos } from './config/origenes-cors.js';
import { crearPipeValidacion } from './config/pipe-validacion.js';

cargarEntorno();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Solo el frontend (Vercel o local) puede llamar a la API desde el navegador.
  app.enableCors({ origin: origenesPermitidos() });
  // Valida el cuerpo de cada petición con su DTO y descarta los campos que el DTO no declara.
  app.useGlobalPipes(crearPipeValidacion());
  // Render asigna PORT en producción; en local se usa 4000 para no chocar con Next.js (3000).
  await app.listen(process.env.PORT ?? 4000);
}
await bootstrap();
