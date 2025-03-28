import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Partida } from './Entities/partida.entity';
import { Time } from '../time/Entities/time.entity';
import { Campeonato } from '../campeonato/Entities/campeonato.entity';
import { FasePartida } from './Entities/partida.entity';

@Injectable()
export class PartidaService {
  constructor(
    @InjectRepository(Partida)
    private readonly partidaRepository: Repository<Partida>,
    @InjectRepository(Time)
    private readonly timeRepository: Repository<Time>,
    @InjectRepository(Campeonato)
    private readonly campeonatoRepository: Repository<Campeonato>,
  ) {}

  async simularPartida(partidaId: number): Promise<Partida> {
    const partida = await this.partidaRepository.findOne({
      where: { id: partidaId },
      relations: ['time_casa', 'time_visitante', 'campeonato']
    });

    if (!partida) {
      throw new NotFoundException(`Partida com ID ${partidaId} não encontrada`);
    }

    if (partida.jogada) {
      throw new BadRequestException('Esta partida já foi jogada');
    }

    
    partida.gols_casa = Math.floor(Math.random() * 6);
    partida.gols_visitante = Math.floor(Math.random() * 6);
    partida.jogada = true;

    await this.atualizarPontuacao(partida);
    
   
    if (partida.fase === FasePartida.FINAL) {
      await this.definirCampeao(partida);
    } else if (partida.fase === FasePartida.TERCEIRO_LUGAR) {
      await this.definirTerceiroColocado(partida);
    }

    return this.partidaRepository.save(partida);
  }

  private async atualizarPontuacao(partida: Partida): Promise<void> {
   
    partida.time_casa.pontos += partida.gols_casa;
    partida.time_casa.pontos -= partida.gols_visitante;
    partida.time_visitante.pontos += partida.gols_visitante;
    partida.time_visitante.pontos -= partida.gols_casa;
    
   
    await this.timeRepository.save([partida.time_casa, partida.time_visitante]);
  }

  private async definirCampeao(partida: Partida): Promise<void> {
    const campeonato = partida.campeonato;
    
    if (partida.gols_casa === partida.gols_visitante) {
     
      const vencedor = this.determinarVencedorEmEmpate(partida);
      campeonato.campeaoId = vencedor.id;
      campeonato.viceId = vencedor.id === partida.time_casa.id 
        ? partida.time_visitante.id 
        : partida.time_casa.id;
    } else {
      
      campeonato.campeaoId = partida.gols_casa > partida.gols_visitante 
        ? partida.time_casa.id 
        : partida.time_visitante.id;
      campeonato.viceId = partida.gols_casa > partida.gols_visitante 
        ? partida.time_visitante.id 
        : partida.time_casa.id;
    }

    await this.campeonatoRepository.save(campeonato);
  }

  private async definirTerceiroColocado(partida: Partida): Promise<void> {
    const campeonato = partida.campeonato;
    
    if (partida.gols_casa === partida.gols_visitante) {
      const vencedor = this.determinarVencedorEmEmpate(partida);
      campeonato.terceiroId = vencedor.id;
    } else {
      campeonato.terceiroId = partida.gols_casa > partida.gols_visitante 
        ? partida.time_casa.id 
        : partida.time_visitante.id;
    }

    await this.campeonatoRepository.save(campeonato);
  }

  async criarProximaFase(campeonatoId: number): Promise<Partida[]> {
    const campeonato = await this.campeonatoRepository.findOne({
      where: { id: campeonatoId },
      relations: ['partidas', 'partidas.time_casa', 'partidas.time_visitante']
    });

    if (!campeonato) {
      throw new NotFoundException('Campeonato não encontrado');
    }

    const faseAtual = this.determinarFaseAtual(campeonato.partidas);
    const proximaFase = this.obterProximaFase(faseAtual);

    
    const partidasProximaFase = campeonato.partidas.filter(p => p.fase === proximaFase);
    if (partidasProximaFase.length > 0 && proximaFase !== FasePartida.SEMI_FINAL) {
      throw new BadRequestException(`As partidas da ${proximaFase} já foram criadas`);
    }

    
    const partidasFaseAtual = campeonato.partidas.filter(
      p => p.fase === faseAtual && p.jogada
    );

    const quantidadeEsperada = this.verificarQuantidadeEsperada(faseAtual);
    if (partidasFaseAtual.length !== quantidadeEsperada) {
      throw new BadRequestException(
        `Faltam ${quantidadeEsperada - partidasFaseAtual.length} partidas da ${faseAtual} a serem concluídas`
      );
    }

    
    const vencedores = partidasFaseAtual.map(p => 
      p.gols_casa > p.gols_visitante ? p.time_casa : p.time_visitante
    );

    const perdedores = faseAtual === FasePartida.SEMI_FINAL
      ? partidasFaseAtual.map(p => 
          p.gols_casa > p.gols_visitante ? p.time_visitante : p.time_casa
        )
      : [];

    
    const novasPartidas = this.gerarPartidasFaseSeguinte(
      vencedores,
      perdedores,
      faseAtual,
      campeonato
    );
    
    return this.partidaRepository.save(novasPartidas);
  }

  private determinarFaseAtual(partidas: Partida[]): FasePartida {
    
    const partidasQuartas = partidas.filter(p => p.fase === FasePartida.QUARTAS_FINAL);
    if (partidasQuartas.length === 4) {
      const quartasConcluidas = partidasQuartas.filter(p => p.jogada).length;
      if (quartasConcluidas < 4) {
        return FasePartida.QUARTAS_FINAL;
      }
    }

    
    const partidasSemi = partidas.filter(p => p.fase === FasePartida.SEMI_FINAL);
    if (partidasSemi.length === 2) {
      const semiConcluidas = partidasSemi.filter(p => p.jogada).length;
      if (semiConcluidas < 2) {
        return FasePartida.SEMI_FINAL;
      }
    }

    
    const partidaTerceiro = partidas.find(p => p.fase === FasePartida.TERCEIRO_LUGAR);
    if (partidaTerceiro && !partidaTerceiro.jogada) {
      return FasePartida.TERCEIRO_LUGAR;
    }

  
    const partidaFinal = partidas.find(p => p.fase === FasePartida.FINAL);
    if (partidaFinal && !partidaFinal.jogada) {
      return FasePartida.FINAL;
    }

 
    if (partidasQuartas.length === 4 && partidasQuartas.every(p => p.jogada)) {
      return partidasSemi.length === 0 ? FasePartida.QUARTAS_FINAL : FasePartida.SEMI_FINAL;
    }

    if (partidasSemi.length === 2 && partidasSemi.every(p => p.jogada)) {
      return FasePartida.SEMI_FINAL;
    }

    return FasePartida.QUARTAS_FINAL;
  }

  private obterProximaFase(faseAtual: FasePartida): FasePartida {
    switch (faseAtual) {
      case FasePartida.QUARTAS_FINAL: 
        return FasePartida.SEMI_FINAL;
      case FasePartida.SEMI_FINAL: 
        return FasePartida.FINAL;
      default: 
        throw new BadRequestException('Transição de fase inválida');
    }
  }

  private verificarQuantidadeEsperada(fase: FasePartida): number {
    switch (fase) {
      case FasePartida.QUARTAS_FINAL: return 4;
      case FasePartida.SEMI_FINAL: return 2;
      case FasePartida.TERCEIRO_LUGAR: return 1;
      case FasePartida.FINAL: return 1;
      default: return 0;
    }
  }

  private gerarPartidasFaseSeguinte(
    vencedores: Time[],
    perdedores: Time[],
    faseAtual: FasePartida,
    campeonato: Campeonato
  ): Partida[] {
    const novasPartidas: Partida[] = [];
    const proximaFase = this.obterProximaFase(faseAtual);

    if (proximaFase === FasePartida.SEMI_FINAL && vencedores.length === 4) {
      
      for (let i = 0; i < 2; i++) {
        novasPartidas.push(this.partidaRepository.create({
          time_casa: vencedores[i * 2],
          time_visitante: vencedores[i * 2 + 1],
          fase: proximaFase,
          campeonato
        }));
      }
    } 
    else if (faseAtual === FasePartida.SEMI_FINAL && vencedores.length === 2 && perdedores.length === 2) {
     
      novasPartidas.push(this.partidaRepository.create({
        time_casa: vencedores[0],
        time_visitante: vencedores[1],
        fase: FasePartida.FINAL,
        campeonato
      }));

      novasPartidas.push(this.partidaRepository.create({
        time_casa: perdedores[0],
        time_visitante: perdedores[1],
        fase: FasePartida.TERCEIRO_LUGAR,
        campeonato
      }));
    }

    return novasPartidas;
  }

  private determinarVencedorEmEmpate(partida: Partida): Time {
    
    if (partida.time_casa.pontos !== partida.time_visitante.pontos) {
      return partida.time_casa.pontos > partida.time_visitante.pontos 
        ? partida.time_casa 
        : partida.time_visitante;
    }
    
    return partida.time_casa.data_criacao < partida.time_visitante.data_criacao
      ? partida.time_casa
      : partida.time_visitante;
  }
}