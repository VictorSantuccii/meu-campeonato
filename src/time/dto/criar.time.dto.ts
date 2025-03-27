import { IsString, IsNotEmpty, Length, IsNumber } from 'class-validator';

export class CriarTimeDto {
  @IsString()
  @IsNotEmpty()
  @Length(3, 30)
  nome: string;

  @IsNumber()
  @IsNotEmpty()
  campeonatoId: number;
}