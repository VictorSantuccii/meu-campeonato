# 🏆 Meu Campeonato - API de Simulação de Campeonatos de Futebol

## 📌 Descrição
Bem-vindo à API *Meu Campeonato*! Este projeto foi desenvolvido para atender ao pedido do nosso cliente José Gustavo, um apaixonado por futebol e tecnologia. A aplicação permite simular campeonatos de futebol de bairro, seguindo um sistema eliminatório que inicia nas quartas de final.

## 🚀 Tecnologias Utilizadas
- **NestJS** - Framework para Node.js
- **TypeORM** - ORM para interagir com o banco de dados
- **Docker** - Contêinerização da aplicação
- **Dotenv** - Gerenciamento de variáveis de ambiente
- **Jest** - Testes automatizados

## 📂 Estrutura do Projeto

```
.
├── src
│   ├── campeonato
│   │   ├── dto
│   │   ├── __tests__
│   │   ├── Entities
│   │   ├── campeonato.module.ts
│   │   ├── campeonato.service.ts
│   │   ├── campeonato.controller.ts
│   ├── partida
│   │   ├── dto
│   │   ├── __tests__
│   │   ├── Entities
│   │   ├── partida.module.ts
│   │   ├── partida.service.ts
│   │   ├── partida.controller.ts
│   ├── time
│   │   ├── dto
│   │   ├── __tests__
│   │   ├── Entities
│   │   ├── time.module.ts
│   │   ├── time.service.ts
│   │   ├── time.controller.ts
│   ├── app.module.ts
│   ├── main.ts
│   ├── data-source.ts
├── test
├── .env
├── .env.example
├── docker-compose.yml
├── Dockerfile
├── package.json
└── tsconfig.json
```

## ⚽️ Regras do Campeonato
- **O campeonato começa nas quartas de final**, com **8 times**;
- **Perdeu, está fora**! Os times eliminados deixam o campeonato;
- **Quartas de final** → 4 jogos sorteados (cada time joga uma vez);
- **Semifinais** → 2 jogos sorteados (cada time joga uma vez);
- **Disputa de 3º lugar** → Entre os perdedores das semifinais;
- **Final** → Vencedores das semifinais disputam o 🏆;
- **Critérios de desempate**:
  1. Maior pontuação acumulada (gols a favor +1 ponto, gols sofridos -1 ponto);
  2. Em caso de novo empate, vence o time inscrito primeiro.

## 🛠 Configuração do Ambiente

### 1️⃣ Clonar o repositório
```sh
git clone https://github.com/VictorSantuccii/desafio-backend-irroba.git
cd meu-campeonato
```

### 2️⃣ Configurar variáveis de ambiente
Renomeie o arquivo `.env.example` para `.env` e configure as variáveis necessárias.

### 3️⃣ Subir a aplicação com Docker
```sh
docker-compose up --build
```

### 4️⃣ Rodar a aplicação sem Docker
Instale as dependências:
```sh
npm install
```

Inicie a aplicação:
```sh
npm run start:dev
```

### 5️⃣ Executar Testes
```sh
npm test
```

## 📌 Endpoints Principais

### 🏆 Campeonato
- **Criar um campeonato**
  ```sh
  POST http://localhost:3000/api/campeonatos
  ```
- **Buscar campeonato por ID**
  ```sh
  GET http://localhost:3000/api/campeonatos/1
  ```
- **Iniciar um campeonato**
  ```sh
  POST http://localhost:3000/api/campeonatos/1/iniciar
  ```

### ⚽️ Times
- **Adicionar times a um campeonato**
  ```sh
  POST http://localhost:3000/api/times/campeonato/1
  ```

### 🏁 Partidas
- **Simular uma partida do campeonato**
  ```sh
  POST http://localhost:3000/api/partidas/1/simular/
  ```
- **Partidas concluídas e avançar de fase**
  ```sh
  POST http://localhost:3000/api/partidas/campeonato/1/proxima-fase
  ```

## 🏆 Considerações Finais
Este projeto é de um desafio em backend, e segue boas práticas de desenvolvimento com NestJS, incluindo organização modular, uso de DTOs, entidades bem definidas e cobertura de testes unitários automatizados.

