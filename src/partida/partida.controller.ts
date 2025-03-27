import { Controller, Post, Param, HttpStatus } from '@nestjs/common';
import { PartidaService } from './partida.service';

@Controller('partidas')
export class PartidaController {
  constructor(private readonly partidaService: PartidaService) {}

  @Post(':id/simular')
  async simularPartida(@Param('id') id: string) {
    const partida = await this.partidaService.simularPartida(parseInt(id));
    return {
      statusCode: HttpStatus.OK,
      message: 'Partida simulada com sucesso',
      data: partida
    };
  }

  @Post('campeonato/:id/proxima-fase')
  async criarProximaFase(@Param('id') id: string) {
    const partidas = await this.partidaService.criarProximaFase(parseInt(id));
    return {
      statusCode: HttpStatus.OK,
      message: 'Próxima fase criada com sucesso',
      data: partidas
    };
  }
}