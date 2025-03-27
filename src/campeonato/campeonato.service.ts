import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Campeonato } from './Entities/campeonato.entity';
import { CriarCampeonatoDto } from './dto/criar.campeonato.dto';
import { Partida } from '../partida/Entities/partida.entity';
import { FasePartida } from '../partida/Entities/partida.entity';
import { Time } from '../time/Entities/time.entity';

@Injectable()
export class CampeonatoService {
  constructor(
    @InjectRepository(Campeonato)
    private readonly campeonatoRepository: Repository<Campeonato>,
    @InjectRepository(Partida)
    private readonly partidaRepository: Repository<Partida>,
    @InjectRepository(Time)
    private readonly timeRepository: Repository<Time>,
  ) {}

  async criarCampeonato(dto: CriarCampeonatoDto): Promise<Campeonato> {
    const campeonato = this.campeonatoRepository.create(dto);
    return this.campeonatoRepository.save(campeonato);
  }

  async buscarPorId(id: number): Promise<Campeonato> {
    const campeonato = await this.campeonatoRepository.findOne({ 
      where: { id },
      relations: ['times', 'partidas']
    });
    
    if (!campeonato) {
      throw new NotFoundException('Campeonato não encontrado');
    }
    
    return campeonato;
  }

  async iniciarCampeonato(campeonatoId: number): Promise<Partida[]> {
    const campeonato = await this.campeonatoRepository.findOne({
      where: { id: campeonatoId },
      relations: ['times', 'partidas']
    });

    if (!campeonato) {
      throw new NotFoundException('Campeonato não encontrado');
    }

    
    if (campeonato.partidas && campeonato.partidas.length > 0) {
      throw new BadRequestException('O campeonato já foi iniciado anteriormente');
    }

    if (campeonato.times.length !== 8) {
      throw new BadRequestException('O campeonato deve ter exatamente 8 times');
    }

    const timesEmbaralhados = [...campeonato.times].sort(() => Math.random() - 0.5);
    const quartasFinais: Partida[] = [];

    for (let i = 0; i < 4; i++) {
      const partida = this.partidaRepository.create({
        time_casa: timesEmbaralhados[i * 2],
        time_visitante: timesEmbaralhados[i * 2 + 1],
        fase: FasePartida.QUARTAS_FINAL,
        campeonato
      });
      quartasFinais.push(partida);
    }

    return this.partidaRepository.save(quartasFinais);
  }
}