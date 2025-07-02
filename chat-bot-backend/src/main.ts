import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // validation
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  //cookies
  app.use(cookieParser(process.env.COOKIE_SECRET));

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
