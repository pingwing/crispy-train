FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

RUN npm run build

EXPOSE 4000

CMD ["sh", "-lc", "npm run migration:up && npm run seed && npm run start"]


