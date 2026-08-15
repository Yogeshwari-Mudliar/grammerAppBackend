import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { AppModule } from './app.module';

async function bootstrap() {

  const app = await NestFactory.create(AppModule);

  const config = app.get(ConfigService);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

const corsOrigins = config
  .get<string>(
    'CORS_ORIGIN',
    'http://localhost:8100,http://localhost:4200',
  )
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);

app.enableCors({
  origin: (origin, callback) => {

    // Allow requests without Origin header
    // such as Postman / server-to-server requests
    if (!origin) {
      return callback(null, true);
    }

    if (corsOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(
      new Error(`CORS blocked for origin: ${origin}`),
      false,
    );
  },

  credentials: true,
});

  await app.listen(config.get<number>('PORT', 3000));

  console.log(
    `🚀 Server running on http://localhost:${config.get<number>('PORT', 3000)}`,
  );
}

void bootstrap();