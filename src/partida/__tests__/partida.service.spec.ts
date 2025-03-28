import { Test, TestingModule } from '@nestjs/testing';
import { PartidaService } from '../partida.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Partida } from '../Entities/partida.entity';
import { Time } from '../../time/Entities/time.entity';
import { Campeonato } from '../../campeonato/Entities/campeonato.entity';
import { Repository } from 'typeorm';
import { FasePartida } from '../Entities/partida.entity';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('PartidaService', () => {
  let service: PartidaService;
  let partidaRepository: Repository<Partida>;
  let timeRepository: Repository<Time>;
  let campeonatoRepository: Repository<Campeonato>;

 
  const mockTime = (overrides?: Partial<Time>): Time => ({
    id: overrides?.id || 1,
    nome: 'Time Teste',
    pontos: 0,
    data_criacao: new Date(),
    campeonato: mockCampeonato(),
    partidas_casa: [],
    partidas_visitante: [],
    ...overrides
  });

  const mockCampeonato = (overrides?: Partial<Campeonato>): Campeonato => ({
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

  const mockPartida = (overrides?: Partial<Partida>): Partida => ({
    id: 1,
    fase: FasePartida.QUARTAS_FINAL,
    jogada: false,
    gols_casa: 0,
    gols_visitante: 0,
    time_casa: mockTime(),
    time_visitante: mockTime({ id: 2 }),
    campeonato: mockCampeonato(),
    ...overrides
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PartidaService,
        {
          provide: getRepositoryToken(Partida),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn().mockImplementation((p) => Promise.resolve(p)),
            create: jest.fn().mockImplementation((d) => d),
          },
        },
        {
          provide: getRepositoryToken(Time),
          useValue: {
            save: jest.fn().mockImplementation((t) => 
              Array.isArray(t) ? Promise.resolve(t) : Promise.resolve(t)
            ),
          },
        },
        {
          provide: getRepositoryToken(Campeonato),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn().mockImplementation((c) => Promise.resolve(c)),
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
      const partida = mockPartida({ jogada: true });
      jest.spyOn(partidaRepository, 'findOne').mockResolvedValue(partida);
      await expect(service.simularPartida(1)).rejects.toThrow(BadRequestException);
    });

    it('should simulate match and update scores', async () => {
      const partida = mockPartida();
      jest.spyOn(partidaRepository, 'findOne').mockResolvedValue(partida);

      const result = await service.simularPartida(1);
      
      expect(result.jogada).toBe(true);
      expect(typeof result.gols_casa).toBe('number');
      expect(typeof result.gols_visitante).toBe('number');
      expect(timeRepository.save).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ id: 1 }),
          expect.objectContaining({ id: 2 })
        ])
      );
    });

    it('should define campeao when fase is FINAL', async () => {
      const partida = mockPartida({
        fase: FasePartida.FINAL,
        gols_casa: 2,
        gols_visitante: 1
      });
      jest.spyOn(partidaRepository, 'findOne').mockResolvedValue(partida);

      await service.simularPartida(1);
      
      expect(campeonatoRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          campeaoId: 1,
          viceId: 2
        })
      );
    });

    it('should define terceiro when fase is TERCEIRO_LUGAR', async () => {
      const partida = mockPartida({
        fase: FasePartida.TERCEIRO_LUGAR,
        gols_casa: 1,
        gols_visitante: 0
      });
      jest.spyOn(partidaRepository, 'findOne').mockResolvedValue(partida);

      await service.simularPartida(1);
      
      expect(campeonatoRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          terceiroId: 1
        })
      );
    });
  });

  describe('criarProximaFase', () => {
    it('should throw NotFoundException when campeonato not found', async () => {
      jest.spyOn(campeonatoRepository, 'findOne').mockResolvedValue(null);
      await expect(service.criarProximaFase(1)).rejects.toThrow(NotFoundException);
    });

    it('should create semi-final matches after quartas', async () => {
      const times = [mockTime({ id: 1 }), mockTime({ id: 2 }), mockTime({ id: 3 }), mockTime({ id: 4 })];
      const partidasQuartas = times.map((time, i) => 
        mockPartida({
          id: i + 1,
          fase: FasePartida.QUARTAS_FINAL,
          jogada: true,
          time_casa: time,
          time_visitante: times[(i + 1) % times.length],
          gols_casa: 2,
          gols_visitante: 1
        })
      );
      
      const campeonato = mockCampeonato({ partidas: partidasQuartas });
      jest.spyOn(campeonatoRepository, 'findOne').mockResolvedValue(campeonato);

      const result = await service.criarProximaFase(1);
      
      expect(result.length).toBe(2);
      expect(result[0].fase).toBe(FasePartida.SEMI_FINAL);
      expect(partidaRepository.save).toHaveBeenCalled();
    });

    it('should create final and third place matches after semi', async () => {
      const times = [mockTime({ id: 1 }), mockTime({ id: 2 })];
      const partidasSemi = times.map((time, i) => 
        mockPartida({
          id: i + 1,
          fase: FasePartida.SEMI_FINAL,
          jogada: true,
          time_casa: time,
          time_visitante: times[(i + 1) % times.length],
          gols_casa: 2,
          gols_visitante: 1
        })
      );
      
      const campeonato = mockCampeonato({ partidas: partidasSemi });
      jest.spyOn(campeonatoRepository, 'findOne').mockResolvedValue(campeonato);

      const result = await service.criarProximaFase(1);
      
      expect(result.length).toBe(2);
      expect(result[0].fase).toBe(FasePartida.FINAL);
      expect(result[1].fase).toBe(FasePartida.TERCEIRO_LUGAR);
    });

    it('should throw error if not all current phase matches are completed', async () => {
      const partidasQuartas = [mockPartida({ jogada: false })];
      const campeonato = mockCampeonato({ partidas: partidasQuartas });
      jest.spyOn(campeonatoRepository, 'findOne').mockResolvedValue(campeonato);

      await expect(service.criarProximaFase(1)).rejects.toThrow(BadRequestException);
    });
  });

  describe('determinarVencedorEmEmpate', () => {
    it('should return team with more points', () => {
      const timeCasa = mockTime({ pontos: 10 });
      const timeVisitante = mockTime({ pontos: 5 });
      const partida = mockPartida({
        time_casa: timeCasa,
        time_visitante: timeVisitante,
        gols_casa: 1,
        gols_visitante: 1
      });

      const result = (service as any).determinarVencedorEmEmpate(partida);
      expect(result.id).toBe(timeCasa.id);
    });

    it('should return older team when points are equal', () => {
      const timeCasa = mockTime({ 
        pontos: 5, 
        data_criacao: new Date('2020-01-01') 
      });
      const timeVisitante = mockTime({ 
        pontos: 5, 
        data_criacao: new Date('2021-01-01') 
      });
      const partida = mockPartida({
        time_casa: timeCasa,
        time_visitante: timeVisitante,
        gols_casa: 1,
        gols_visitante: 1
      });

      const result = (service as any).determinarVencedorEmEmpate(partida);
      expect(result.id).toBe(timeCasa.id);
    });
  });
});