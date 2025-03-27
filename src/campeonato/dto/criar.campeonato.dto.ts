import { IsString, IsNotEmpty, Length } from 'class-validator';

export class CriarCampeonatoDto {
  @IsString()
  @IsNotEmpty()
  @Length(3, 50)
  nome: string;
}