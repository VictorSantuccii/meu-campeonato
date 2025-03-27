import { Controller, Get, Post, Body, Param, HttpStatus } from '@nestjs/common';
import { CampeonatoService } from './campeonato.service';
import { CriarCampeonatoDto } from './dto/criar.campeonato.dto';

@Controller('campeonatos')
export class CampeonatoController {
  constructor(private readonly campeonatoService: CampeonatoService) {}

  @Post()
  async criar(@Body() dto: CriarCampeonatoDto) {
    const campeonato = await this.campeonatoService.criarCampeonato(dto);
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Campeonato criado com sucesso',
      data: campeonato
    };
  }

  @Get(':id')
  async buscarPorId(@Param('id') id: string) {
    const campeonato = await this.campeonatoService.buscarPorId(parseInt(id));
    return {
      statusCode: HttpStatus.OK,
      data: campeonato
    };
  }

  @Post(':id/iniciar')
  async iniciarCampeonato(@Param('id') id: string) {
    const partidas = await this.campeonatoService.iniciarCampeonato(parseInt(id));
    return {
      statusCode: HttpStatus.OK,
      message: 'Campeonato iniciado com sucesso',
      data: partidas
    };
  }
}