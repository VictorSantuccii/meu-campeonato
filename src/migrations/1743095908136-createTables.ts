import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateTables1743095908136 implements MigrationInterface {
    name = 'CreateTables1743095908136'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE \`campeonato\` (
                \`id\` int NOT NULL AUTO_INCREMENT,
                \`nome\` varchar(255) NOT NULL,
                \`data_criacao\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
                \`campeaoId\` int NULL,
                \`viceId\` int NULL,
                \`terceiroId\` int NULL,
                PRIMARY KEY (\`id\`)
            ) ENGINE=InnoDB
        `);

        await queryRunner.query(`
            CREATE TABLE \`time\` (
                \`id\` int NOT NULL AUTO_INCREMENT,
                \`nome\` varchar(255) NOT NULL,
                \`pontos\` int NOT NULL DEFAULT '0',
                \`data_criacao\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
                \`campeonatoId\` int NULL,
                PRIMARY KEY (\`id\`),
                CONSTRAINT \`FK_campeonato_time\` FOREIGN KEY (\`campeonatoId\`) 
                REFERENCES \`campeonato\`(\`id\`) ON DELETE CASCADE
            ) ENGINE=InnoDB
        `);

        await queryRunner.query(`
            CREATE TABLE \`partida\` (
                \`id\` int NOT NULL AUTO_INCREMENT,
                \`gols_casa\` int NULL,
                \`gols_visitante\` int NULL,
                \`fase\` enum('QUARTAS_FINAL','SEMI_FINAL','TERCEIRO_LUGAR','FINAL') NOT NULL,
                \`jogada\` tinyint NOT NULL DEFAULT 0,
                \`time_casa_id\` int NULL,
                \`time_visitante_id\` int NULL,
                \`campeonatoId\` int NULL,
                PRIMARY KEY (\`id\`),
                CONSTRAINT \`FK_time_casa\` FOREIGN KEY (\`time_casa_id\`) 
                REFERENCES \`time\`(\`id\`) ON DELETE CASCADE,
                CONSTRAINT \`FK_time_visitante\` FOREIGN KEY (\`time_visitante_id\`) 
                REFERENCES \`time\`(\`id\`) ON DELETE CASCADE,
                CONSTRAINT \`FK_campeonato_partida\` FOREIGN KEY (\`campeonatoId\`) 
                REFERENCES \`campeonato\`(\`id\`) ON DELETE CASCADE
            ) ENGINE=InnoDB
        `);

        await queryRunner.query(`
            ALTER TABLE \`campeonato\`
            ADD CONSTRAINT \`FK_campeonato_campeao\`
            FOREIGN KEY (\`campeaoId\`) REFERENCES \`time\`(\`id\`)
            ON DELETE SET NULL
        `);

        await queryRunner.query(`
            ALTER TABLE \`campeonato\`
            ADD CONSTRAINT \`FK_campeonato_vice\`
            FOREIGN KEY (\`viceId\`) REFERENCES \`time\`(\`id\`)
            ON DELETE SET NULL
        `);

        await queryRunner.query(`
            ALTER TABLE \`campeonato\`
            ADD CONSTRAINT \`FK_campeonato_terceiro\`
            FOREIGN KEY (\`terceiroId\`) REFERENCES \`time\`(\`id\`)
            ON DELETE SET NULL
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`campeonato\` DROP FOREIGN KEY \`FK_campeonato_terceiro\``);
        await queryRunner.query(`ALTER TABLE \`campeonato\` DROP FOREIGN KEY \`FK_campeonato_vice\``);
        await queryRunner.query(`ALTER TABLE \`campeonato\` DROP FOREIGN KEY \`FK_campeonato_campeao\``);
        await queryRunner.query(`DROP TABLE \`partida\``);
        await queryRunner.query(`DROP TABLE \`time\``);
        await queryRunner.query(`DROP TABLE \`campeonato\``);
    }
}