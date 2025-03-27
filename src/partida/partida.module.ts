import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PartidaController } from './partida.controller';
import { PartidaService } from './partida.service';
import { Partida } from './Entities/partida.entity';
import { CampeonatoModule } from '../campeonato/campeonato.module';
import { TimeModule } from '../time/time.module';
import { Time } from '../time/Entities/time.entity';
import { Campeonato } from '../campeonato/Entities/campeonato.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Partida, Time, Campeonato]), // Adicione todas as entidades necessárias
    forwardRef(() => CampeonatoModule),
    forwardRef(() => TimeModule)
  ],
  controllers: [PartidaController],
  providers: [PartidaService],
  exports: [PartidaService]
})
export class PartidaModule {}