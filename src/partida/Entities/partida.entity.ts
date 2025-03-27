import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Time } from '../../time/Entities/time.entity';
import { Campeonato } from '../../campeonato/Entities/campeonato.entity';

export enum FasePartida {
  QUARTAS_FINAL = 'QUARTAS_FINAL',
  SEMI_FINAL = 'SEMI_FINAL',
  TERCEIRO_LUGAR = 'TERCEIRO_LUGAR',
  FINAL = 'FINAL'
}

@Entity()
export class Partida {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Time)
  @JoinColumn({ name: 'time_casa_id' }) 
  time_casa: Time;

  @ManyToOne(() => Time)
  @JoinColumn({ name: 'time_visitante_id' }) 
  time_visitante: Time;

  @Column({ nullable: true })
  gols_casa: number;

  @Column({ nullable: true })
  gols_visitante: number;

  @Column({ type: 'enum', enum: FasePartida })
  fase: FasePartida;

  @Column({ default: false })
  jogada: boolean;

  @ManyToOne(() => Campeonato, campeonato => campeonato.partidas)
  campeonato: Campeonato;
}