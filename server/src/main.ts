import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { corsOrigins } from './config/cors';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bodyParser: false,
  });

  // Without this, the class-validator decorators on every DTO are inert. `whitelist`
  // strips unknown properties; `transform` coerces payloads into the DTO classes so
  // @IsInt/@Min(...) checks run against the right types.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  // Allowed origins (localhost + production FRONTEND_URL) are env-driven via
  // corsOrigins(), so the deployed Vercel frontend is configured, not hardcoded.
  app.enableCors({
    origin: corsOrigins(),
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'Origin'],
  });

  app.setGlobalPrefix('api');
  await app.listen(process.env.PORT ?? 5500);
}
void bootstrap();
