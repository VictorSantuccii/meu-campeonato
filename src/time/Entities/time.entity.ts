import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from 'typeorm';
import { Campeonato } from '../../campeonato/Entities/campeonato.entity';
import { Partida } from '../../partida/Entities/partida.entity';

@Entity()
export class Time {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nome: string;

  @Column({ default: 0 })
  pontos: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  data_criacao: Date;

  @ManyToOne(() => Campeonato, campeonato => campeonato.times)
  campeonato: Campeonato;

  @OneToMany(() => Partida, partida => partida.time_casa)
  partidas_casa: Partida[];

  @OneToMany(() => Partida, partida => partida.time_visitante)
  partidas_visitante: Partida[];
}