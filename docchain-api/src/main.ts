import { LogLevel, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser = require('cookie-parser');
import { AppModule } from './app.module';

const LOG_LEVEL_ORDER: LogLevel[] = [
  'verbose',
  'debug',
  'log',
  'warn',
  'error',
  'fatal',
];

function resolveLogLevels(): LogLevel[] {
  const raw = (process.env.LOG_LEVEL ?? 'log').toLowerCase() as LogLevel;
  const idx = LOG_LEVEL_ORDER.indexOf(raw);
  return idx >= 0 ? LOG_LEVEL_ORDER.slice(idx) : ['log', 'warn', 'error', 'fatal'];
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: resolveLogLevels(),
  });
  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('DocChain API')
    .setDescription(
      'API de registro documental com blockchain (SHA-256 + AES-256-GCM + Sepolia).',
    )
    .setVersion('1.0')
    .addCookieAuth('access_token', {
      type: 'apiKey',
      in: 'cookie',
      name: 'access_token',
    })
    .addTag('auth')
    .addTag('documents')
    .addTag('verification')
    .addTag('health')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
