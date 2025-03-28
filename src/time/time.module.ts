import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TimeController } from './time.controller';
import { TimeService } from './time.service';
import { Time } from './Entities/time.entity';
import { CampeonatoModule } from '../campeonato/campeonato.module';
import { Campeonato } from '../campeonato/Entities/campeonato.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Time, Campeonato]), 
    forwardRef(() => CampeonatoModule)
  ],
  controllers: [TimeController],
  providers: [TimeService],
  exports: [TimeService]
})
export class TimeModule {}