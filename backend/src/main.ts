import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { environment } from './config/environment';
import { setup } from './setup';

async function bootstrap() {
  const config = environment();
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bodyParser: true });
  app.useBodyParser('json', { limit: '8mb' });
  setup(app);
  try {
    await app.listen(config.port, '127.0.0.1');
  } catch (error) {
    await app.close();
    throw error;
  }
}
bootstrap().catch((error: NodeJS.ErrnoException) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Backend port ${process.env.PORT || 4000} is already in use. Use the running backend, or stop it before starting another. npm run dev already starts both services.`);
  } else {
    console.error('Backend startup failed. Check backend/.env, PostgreSQL and migrations.');
  }
  process.exitCode = 1;
});
