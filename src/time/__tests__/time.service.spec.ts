import { Test, TestingModule } from '@nestjs/testing';
import { TimeService } from '../time.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Time } from '../Entities/time.entity';
import { Repository } from 'typeorm';
import { CriarTimeDto } from '../dto/criar.time.dto';
import { CampeonatoService } from '../../campeonato/campeonato.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { Campeonato } from '../../campeonato/Entities/campeonato.entity';

describe('TimeService', () => {
  let service: TimeService;
  let timeRepository: Repository<Time>;
  let campeonatoService: CampeonatoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TimeService,
        {
          provide: getRepositoryToken(Time),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: CampeonatoService,
          useValue: {
            buscarPorId: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<TimeService>(TimeService);
    timeRepository = module.get<Repository<Time>>(getRepositoryToken(Time));
    campeonatoService = module.get<CampeonatoService>(CampeonatoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('adicionarTime', () => {
    it('should throw NotFoundException when campeonato is not found', async () => {
      jest.spyOn(campeonatoService, 'buscarPorId').mockRejectedValue(new NotFoundException());

      await expect(service.adicionarTime(1, {} as CriarTimeDto)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when campeonato already has 8 times', async () => {
      const campeonato = { id: 1, times: new Array(8).fill({}) };
      jest.spyOn(campeonatoService, 'buscarPorId').mockResolvedValue(campeonato as any);

      await expect(service.adicionarTime(1, {} as CriarTimeDto)).rejects.toThrow(BadRequestException);
    });

    it('should create and save a new time when conditions are met', async () => {
      const campeonato = { id: 1, times: [] };
      const dto: CriarTimeDto = { nome: 'Time Teste', campeonatoId: 1};
      const expectedTime = { id: 1, ...dto, campeonato };

      jest.spyOn(campeonatoService, 'buscarPorId').mockResolvedValue(campeonato as any);
      jest.spyOn(timeRepository, 'create').mockReturnValue(expectedTime as any);
      jest.spyOn(timeRepository, 'save').mockResolvedValue(expectedTime as any);

      const result = await service.adicionarTime(1, dto);
      
      expect(result).toEqual(expectedTime);
      expect(timeRepository.create).toHaveBeenCalledWith({
        ...dto,
        campeonato,
      });
      expect(timeRepository.save).toHaveBeenCalledWith(expectedTime);
    });
  });
});