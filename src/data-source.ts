import { DataSource } from "typeorm";
import * as dotenv from 'dotenv';
dotenv.config();

const MAX_RETRY_ATTEMPTS = 10;
const RETRY_DELAY = 5000; 

export const AppDataSource = new DataSource({
    type: "mysql",
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT), 
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD, 
    database: process.env.DB_DATABASE, 
    synchronize: true, 
    logging: true, 
    entities: [`${__dirname}/**/*.entity{.ts,.js}`],
    migrations: [`${__dirname}/migrations/*{.ts,.js}`],
    subscribers: [],
});

export async function initializeDataSource() {
    let attempts = 0;
    
    while (attempts < MAX_RETRY_ATTEMPTS) {
        try {
            console.log(`Tentando estabelecer conexão com o banco de dados (tentativa ${attempts + 1}/10)`);
            await AppDataSource.initialize();
            console.log('Conexão com o banco de dados estabelecida com sucesso');
            return AppDataSource;
        } catch (error) {
            attempts++;
            console.error(`Falha na conexão:`, error.message);
            
            if (attempts >= MAX_RETRY_ATTEMPTS) {
                throw new Error(`Não foi possível conectar ao banco de dados após ${MAX_RETRY_ATTEMPTS} tentativas`);
            }
            
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        }
    }
}