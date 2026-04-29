FROM node:20-alpine

RUN npm install -g pnpm@10

WORKDIR /app

COPY . .

RUN pnpm install --no-frozen-lockfile

RUN NODE_ENV=production pnpm -C artifacts/maya-logistics run build && \
    echo "Frontend build done" && \
    ls artifacts/maya-logistics/dist/

RUN pnpm -C artifacts/api-server run build && \
    echo "API build done" && \
    ls artifacts/api-server/dist/

RUN chmod +x ./start.sh

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["sh", "./start.sh"]
