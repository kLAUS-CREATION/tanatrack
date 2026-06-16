import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

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

  app.enableCors({
    origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:5500'],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'Origin'],
  });

  app.setGlobalPrefix('api');
  await app.listen(process.env.PORT ?? 5500);
}
void bootstrap();
