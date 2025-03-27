import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CampeonatoController } from './campeonato.controller';
import { CampeonatoService } from './campeonato.service';
import { Campeonato } from './Entities/campeonato.entity';
import { TimeModule } from '../time/time.module';
import { PartidaModule } from '../partida/partida.module';
import { Partida } from '../partida/Entities/partida.entity';
import { Time } from '../time/Entities/time.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Campeonato, Partida, Time]), // Adicione todas as entidades aqui
    forwardRef(() => TimeModule),
    forwardRef(() => PartidaModule)
  ],
  controllers: [CampeonatoController],
  providers: [CampeonatoService],
  exports: [CampeonatoService]
})
export class CampeonatoModule {}