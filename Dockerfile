FROM node:20

WORKDIR /app

RUN npm install -g pnpm@10

COPY . .

RUN pnpm install --no-frozen-lockfile

ENV NODE_ENV=production

RUN pnpm --filter @workspace/maya-logistics run build

RUN pnpm --filter @workspace/api-server run build

ENV PORT=3000

EXPOSE 3000

CMD ["node", "--enable-source-maps", "./artifacts/api-server/dist/index.mjs"]
