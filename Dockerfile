FROM 22-alpine3.21 AS builder

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

FROM node:22.18-alpine AS prod

COPY --from=builder /app/dist ./dist

RUN npm install --only=production

EXPOSE 8000

CMD ["npx", "pm2-runtime", "start", "dist/server.js", "--", "pm2-runtime", "start", "dist/processor.js"]

