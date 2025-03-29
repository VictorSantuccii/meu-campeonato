import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { initializeDataSource } from './data-source';

async function bootstrap() {

  try {

    await initializeDataSource();
    const app = await NestFactory.create(AppModule);
    app.setGlobalPrefix('api');
    const port = process.env.PORT ?? 3000;
    await app.listen(port);
    console.log(`Aplicação rodando na porta ${port}`);
    
  } catch (error) {
    console.error('Falha ao iniciar a aplicação:', error.message);
    process.exit(1);
  }

}

bootstrap();