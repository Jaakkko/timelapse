FROM node:16.8-buster as deps
RUN apt-get -y update
RUN apt-get -y upgrade
RUN apt-get install -y ffmpeg

FROM node:16.8-buster AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --no-optional
COPY src src
COPY tsconfig.compile.json ./
RUN npm run build
RUN npm prune --production

FROM deps
ENV NODE_ENV=production
WORKDIR /app
COPY --from=builder /app/node_modules node_modules
COPY --from=builder /app/dist src
CMD ["node", "./src/main.js"]
