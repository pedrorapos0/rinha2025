FROM node:22-alpine3.21 AS builder

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

FROM node:22-alpine3.21 AS prod

COPY --from=builder /app/dist ./dist

COPY package*.json ./

RUN npm install --omit=dev

EXPOSE 8080

CMD ["npx", "pm2-runtime", "start", "dist/server.js", "--", "pm2-runtime", "start", "dist/processor.js"]

