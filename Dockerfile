FROM node:20

RUN corepack enable && corepack prepare pnpm@10 --activate

WORKDIR /app

COPY . .

RUN pnpm install --no-frozen-lockfile

RUN NODE_ENV=production pnpm -C artifacts/maya-logistics run build

RUN pnpm -C artifacts/api-server run build

RUN test -f artifacts/api-server/dist/index.mjs && echo "Build OK!" || (echo "Build FAILED" && exit 1)

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["node", "--enable-source-maps", "./artifacts/api-server/dist/index.mjs"]
