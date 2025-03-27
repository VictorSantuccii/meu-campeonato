import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AppDataSource } from './data-source';
import { CampeonatoModule } from './campeonato/campeonato.module';
import { PartidaModule } from './partida/partida.module';
import { TimeModule } from './time/time.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({...AppDataSource.options, autoLoadEntities: true}), 
    CampeonatoModule,
    PartidaModule,
    TimeModule
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}