FROM node:20-slim

RUN npm install -g pnpm@9

WORKDIR /app

COPY . .

RUN pnpm install

RUN pnpm run typecheck:libs

RUN pnpm --filter @workspace/maya-logistics run build

RUN pnpm --filter @workspace/api-server run build

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["node", "--enable-source-maps", "artifacts/api-server/dist/index.mjs"]
