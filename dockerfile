FROM node:20-alpine AS development

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

CMD ["npm", "run", "start:dev"]

FROM node:20-alpine AS production

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install --production

COPY . .

RUN npm run build

ENV NODE_ENV=production
ENV PORT=${PORT}

EXPOSE ${PORT}

CMD ["node", "dist/main.js"]