import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import session = require('express-session');
import cors = require('cors');

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Configuration CORS
  app.use(
    cors({
      origin: ['http://localhost:5173', 'http://localhost:5174'], // Frontend Vite dev server(s)
      credentials: true,
    }),
  );

  // Configuration des sessions
  app.use(
    session({
      secret: process.env.SESSION_SECRET || 'hospital-secret-key',
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 24 * 60 * 60 * 1000, // 24 heures
        httpOnly: true,
        secure: false, // true en production avec HTTPS
      },
    }),
  );

  // Validation globale
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Préfixe global pour l'API
  app.setGlobalPrefix('api');

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`🚀 Server running on http://localhost:${port}/api`);
}
bootstrap();
