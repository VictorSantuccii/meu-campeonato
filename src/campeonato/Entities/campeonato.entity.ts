import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Time } from '../../time/Entities/time.entity';
import { Partida } from '../../partida/Entities/partida.entity';

@Entity()
export class Campeonato {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nome: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  data_criacao: Date;

  @OneToMany(() => Time, time => time.campeonato)
  times: Time[];

  @OneToMany(() => Partida, partida => partida.campeonato)
  partidas: Partida[];

  @Column({ nullable: true })
  campeaoId: number;

  @Column({ nullable: true })
  viceId: number;

  @Column({ nullable: true })
  terceiroId: number;
}