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


  // =====================================================
  // CORS
  // =====================================================

const allowedOrigins = [
  // Ionic development
  'http://localhost:8100',

  // Capacitor Android
  'http://localhost',
    // Capacitor Android
  'https://localhost',

  // Capacitor / native compatibility
  'capacitor://localhost',

  // Production web app
  'https://grammer-app-frontend.vercel.app',
];

  app.enableCors({
    origin: (origin, callback) => {

      /*
       * Allow requests without origin
       * such as Postman / server requests.
       */
      if (!origin) {
        return callback(null, true);
      }


      /*
       * Allow local Ionic app and
       * deployed Vercel frontend.
       */
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }


      return callback(
        new Error(`Not allowed by CORS: ${origin}`),
        false,
      );
    },

    credentials: true,
  });


  // =====================================================
  // SERVER
  // =====================================================

  const port =
    config.get<number>('PORT', 3000);

  await app.listen(
    port,
    '0.0.0.0',
  );

  console.log(
    `🚀 Server running on port ${port}`,
  );
}

void bootstrap();