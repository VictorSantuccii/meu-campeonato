import { Injectable, NotFoundException, BadRequestException, forwardRef, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Time } from './Entities/time.entity';
import { CriarTimeDto } from './dto/criar.time.dto';
import { CampeonatoService } from '../campeonato/campeonato.service';

@Injectable()
export class TimeService {
  constructor(
    @InjectRepository(Time)
    private readonly timeRepository: Repository<Time>,
    @Inject(forwardRef(() => CampeonatoService))
    private readonly campeonatoService: CampeonatoService
  ) {}

  async adicionarTime(campeonatoId: number, dto: CriarTimeDto): Promise<Time> {
    const campeonato = await this.campeonatoService.buscarPorId(campeonatoId);
    
    if (campeonato.times && campeonato.times.length >= 8) {
      throw new BadRequestException('O campeonato já possui 8 times.');
    }

    const timeExistente = await this.timeRepository.findOne({
      where: {
        nome: dto.nome,
        campeonato: { id: campeonatoId }
      }
    });

    if (timeExistente) {
      throw new BadRequestException('Já existe um time com esse nome no campeonato.');
    }

    const time = this.timeRepository.create({
      ...dto,
      campeonato
    });

    return this.timeRepository.save(time);
  }
}