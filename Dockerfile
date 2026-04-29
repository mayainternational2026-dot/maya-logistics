FROM node:20-slim

WORKDIR /app

COPY . .

RUN npm install nodemailer@8

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["node", "--enable-source-maps", "./artifacts/api-server/dist/index.mjs"]
