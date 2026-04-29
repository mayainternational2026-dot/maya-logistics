FROM node:20-alpine

RUN npm install -g pnpm@10

WORKDIR /app

COPY . .

RUN pnpm install --no-frozen-lockfile --prod

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["sh", "./start.sh"]
