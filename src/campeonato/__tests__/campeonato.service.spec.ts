import { Test, TestingModule } from '@nestjs/testing';
import { CampeonatoService } from '../campeonato.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Campeonato } from '../Entities/campeonato.entity';
import { Partida } from '../../partida/Entities/partida.entity';
import { Time } from '../../time/Entities/time.entity';
import { Repository } from 'typeorm';
import { CriarCampeonatoDto } from '../dto/criar.campeonato.dto';
import { FasePartida } from '../../partida/Entities/partida.entity';
import { NotFoundException, BadRequestException } from '@nestjs/common';

// Mock data with all required properties
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

describe('CampeonatoService', () => {
  let service: CampeonatoService;
  let campeonatoRepository: Repository<Campeonato>;
  let partidaRepository: Repository<Partida>;
  let timeRepository: Repository<Time>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CampeonatoService,
        {
          provide: getRepositoryToken(Campeonato),
          useValue: {
            create: jest.fn(),
            save: jest.fn().mockImplementation((campeonato) => Promise.resolve(campeonato)),
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Partida),
          useValue: {
            create: jest.fn().mockImplementation((data) => data),
            save: jest.fn().mockImplementation((partida) => Promise.resolve(partida)),
          },
        },
        {
          provide: getRepositoryToken(Time),
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<CampeonatoService>(CampeonatoService);
    campeonatoRepository = module.get<Repository<Campeonato>>(getRepositoryToken(Campeonato));
    partidaRepository = module.get<Repository<Partida>>(getRepositoryToken(Partida));
    timeRepository = module.get<Repository<Time>>(getRepositoryToken(Time));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('criarCampeonato', () => {
    it('should create a new campeonato', async () => {
      const dto: CriarCampeonatoDto = { nome: 'Campeonato Teste' };
      const expectedCampeonato = createMockCampeonato(dto);

      jest.spyOn(campeonatoRepository, 'create').mockReturnValue(expectedCampeonato);
      jest.spyOn(campeonatoRepository, 'save').mockResolvedValue(expectedCampeonato);

      const result = await service.criarCampeonato(dto);
      expect(result).toEqual(expectedCampeonato);
      expect(campeonatoRepository.create).toHaveBeenCalledWith(dto);
      expect(campeonatoRepository.save).toHaveBeenCalledWith(expectedCampeonato);
    });
  });

  describe('buscarPorId', () => {
    it('should return a campeonato when found', async () => {
      const campeonato = createMockCampeonato();
      jest.spyOn(campeonatoRepository, 'findOne').mockResolvedValue(campeonato);

      const result = await service.buscarPorId(1);
      expect(result).toEqual(campeonato);
      expect(campeonatoRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['times', 'partidas'],
      });
    });

    it('should throw NotFoundException when campeonato is not found', async () => {
      jest.spyOn(campeonatoRepository, 'findOne').mockResolvedValue(null);

      await expect(service.buscarPorId(1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('iniciarCampeonato', () => {
    it('should throw NotFoundException when campeonato is not found', async () => {
      jest.spyOn(campeonatoRepository, 'findOne').mockResolvedValue(null);

      await expect(service.iniciarCampeonato(1)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when campeonato already has partidas', async () => {
      const campeonato = createMockCampeonato({
        partidas: [{} as Partida]
      });
      jest.spyOn(campeonatoRepository, 'findOne').mockResolvedValue(campeonato);

      await expect(service.iniciarCampeonato(1)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when campeonato does not have exactly 8 times', async () => {
      const campeonato = createMockCampeonato({
        times: new Array(7).fill({} as Time)
      });
      jest.spyOn(campeonatoRepository, 'findOne').mockResolvedValue(campeonato);

      await expect(service.iniciarCampeonato(1)).rejects.toThrow(BadRequestException);
    });

    it('should create quartas de final matches when conditions are met', async () => {
      const times = new Array(8).fill({ id: 1, nome: 'Time' } as Time);
      const campeonato = createMockCampeonato({
        times,
        partidas: []
      });
      
      jest.spyOn(campeonatoRepository, 'findOne').mockResolvedValue(campeonato);
      
      await service.iniciarCampeonato(1);
      
      expect(partidaRepository.create).toHaveBeenCalledTimes(4);
      expect(partidaRepository.save).toHaveBeenCalled();
    });
  });
});