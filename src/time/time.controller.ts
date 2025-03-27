import { Controller, Post, Body, Param, HttpStatus } from '@nestjs/common';
import { TimeService } from './time.service';
import { CriarTimeDto } from './dto/criar.time.dto';

@Controller('times')
export class TimeController {
  constructor(private readonly timeService: TimeService) {}

  @Post('campeonato/:id')
  async adicionarTime(
    @Param('id') campeonatoId: string,
    @Body() dto: CriarTimeDto
  ) {
    const time = await this.timeService.adicionarTime(parseInt(campeonatoId), dto);
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Time adicionado com sucesso',
      data: time
    };
  }
}