FROM node:20

WORKDIR /app

COPY . .

RUN npm install nodemailer@6

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["node", "--enable-source-maps", "artifacts/api-server/dist/index.mjs"]
