import { Test, TestingModule } from '@nestjs/testing';
import { PartidaService } from '../partida.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Partida } from '../Entities/partida.entity';
import { Time } from '../../time/Entities/time.entity';
import { Campeonato } from '../../campeonato/Entities/campeonato.entity';
import { Repository } from 'typeorm';
import { FasePartida } from '../Entities/partida.entity';
import { NotFoundException, BadRequestException } from '@nestjs/common';

// Helper functions to create mock entities
const createMockTime = (overrides?: Partial<Time>): Time => ({
  id: 1,
  nome: 'Time Teste',
  pontos: 0,
  data_criacao: new Date(),
  campeonato: createMockCampeonato(),
  partidas_casa: [],
  partidas_visitante: [],
  ...overrides
});

const createMockCampeonato = (overrides?: Partial<Campeonato>): Campeonato => ({
  id: 1,
  nome: 'Campeonato Teste',
  data_criacao: new Date(),
  times: [],
  partidas: [],
  campeaoId: 0,
  viceId: 0,
  terceiroId: 0,
  ...overrides
});

const createMockPartida = (overrides?: Partial<Partida>): Partida => ({
  id: 1,
  fase: FasePartida.QUARTAS_FINAL,
  jogada: false,
  gols_casa: 0,
  gols_visitante: 0,
  time_casa: createMockTime(),
  time_visitante: createMockTime({ id: 2 }),
  campeonato: createMockCampeonato(),
  ...overrides
});

describe('PartidaService', () => {
  let service: PartidaService;
  let partidaRepository: Repository<Partida>;
  let timeRepository: Repository<Time>;
  let campeonatoRepository: Repository<Campeonato>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PartidaService,
        {
          provide: getRepositoryToken(Partida),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn().mockImplementation((partida) => Promise.resolve(partida)),
            create: jest.fn().mockImplementation((data) => data),
          },
        },
        {
          provide: getRepositoryToken(Time),
          useValue: {
            save: jest.fn().mockImplementation((time) => Promise.resolve(time)),
          },
        },
        {
          provide: getRepositoryToken(Campeonato),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn().mockImplementation((campeonato) => Promise.resolve(campeonato)),
          },
        },
      ],
    }).compile();

    service = module.get<PartidaService>(PartidaService);
    partidaRepository = module.get<Repository<Partida>>(getRepositoryToken(Partida));
    timeRepository = module.get<Repository<Time>>(getRepositoryToken(Time));
    campeonatoRepository = module.get<Repository<Campeonato>>(getRepositoryToken(Campeonato));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('simularPartida', () => {
    it('should throw NotFoundException when partida is not found', async () => {
      jest.spyOn(partidaRepository, 'findOne').mockResolvedValue(null);

      await expect(service.simularPartida(1)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when partida was already played', async () => {
      const partida = createMockPartida({ jogada: true });
      jest.spyOn(partidaRepository, 'findOne').mockResolvedValue(partida);

      await expect(service.simularPartida(1)).rejects.toThrow(BadRequestException);
    });

    it('should simulate a match and update scores', async () => {
      const partida = createMockPartida();
      
      jest.spyOn(partidaRepository, 'findOne').mockResolvedValue(partida);

      const result = await service.simularPartida(1);
      
      expect(result.jogada).toBe(true);
      expect(typeof result.gols_casa).toBe('number');
      expect(typeof result.gols_visitante).toBe('number');
      expect(timeRepository.save).toHaveBeenCalledTimes(2);
    });

    it('should define campeao when fase is FINAL', async () => {
      const partida = createMockPartida({
        fase: FasePartida.FINAL,
        gols_casa: 2,
        gols_visitante: 1
      });
      
      jest.spyOn(partidaRepository, 'findOne').mockResolvedValue(partida);

      await service.simularPartida(1);
      
      expect(campeonatoRepository.save).toHaveBeenCalled();
      expect(campeonatoRepository.save).toHaveBeenCalledWith(expect.objectContaining({
        campeaoId: 1,
        viceId: 2,
      }));
    });
  });

  describe('criarProximaFase', () => {
    it('should throw NotFoundException when campeonato is not found', async () => {
      jest.spyOn(campeonatoRepository, 'findOne').mockResolvedValue(null);

      await expect(service.criarProximaFase(1)).rejects.toThrow(NotFoundException);
    });

    it('should create semi-final matches after quartas', async () => {
      const times = [createMockTime({ id: 1 }), createMockTime({ id: 2 }), 
                   createMockTime({ id: 3 }), createMockTime({ id: 4 })];
      
      const partidasQuartas = times.map((time, i) => 
        createMockPartida({
          id: i + 1,
          fase: FasePartida.QUARTAS_FINAL,
          jogada: true,
          time_casa: time,
          time_visitante: times[(i + 1) % times.length],
          gols_casa: 2,
          gols_visitante: 1,
        })
      );
      
      const campeonato = createMockCampeonato({
        partidas: partidasQuartas
      });
      
      jest.spyOn(campeonatoRepository, 'findOne').mockResolvedValue(campeonato);

      await service.criarProximaFase(1);
      
      expect(partidaRepository.create).toHaveBeenCalledTimes(2);
      expect(partidaRepository.save).toHaveBeenCalled();
    });

    it('should create final and terceiro lugar matches after semi', async () => {
      const times = [createMockTime({ id: 1 }), createMockTime({ id: 2 })];
      
      const partidasSemi = times.map((time, i) => 
        createMockPartida({
          id: i + 1,
          fase: FasePartida.SEMI_FINAL,
          jogada: true,
          time_casa: time,
          time_visitante: times[(i + 1) % times.length],
          gols_casa: 2,
          gols_visitante: 1,
        })
      );
      
      const campeonato = createMockCampeonato({
        partidas: partidasSemi
      });
      
      jest.spyOn(campeonatoRepository, 'findOne').mockResolvedValue(campeonato);

      await service.criarProximaFase(1);
      
      expect(partidaRepository.create).toHaveBeenCalledTimes(2);
      expect(partidaRepository.save).toHaveBeenCalled();
    });
  });

  describe('determinarVencedorEmEmpate', () => {
    it('should return time with more pontos', () => {
      const timeCasa = createMockTime({ pontos: 10 });
      const timeVisitante = createMockTime({ id: 2, pontos: 5 });
      const partida = createMockPartida({
        time_casa: timeCasa,
        time_visitante: timeVisitante,
        gols_casa: 1,
        gols_visitante: 1
      });
      
      const result = (service as any).determinarVencedorEmEmpate(partida);
      expect(result.id).toBe(1);
    });

    it('should return older time when pontos are equal', () => {
      const timeCasa = createMockTime({ 
        pontos: 5, 
        data_criacao: new Date('2020-01-01') 
      });
      const timeVisitante = createMockTime({ 
        id: 2, 
        pontos: 5, 
        data_criacao: new Date('2021-01-01') 
      });
      const partida = createMockPartida({
        time_casa: timeCasa,
        time_visitante: timeVisitante,
        gols_casa: 1,
        gols_visitante: 1
      });
      
      const result = (service as any).determinarVencedorEmEmpate(partida);
      expect(result.id).toBe(1);
    });
  });
});