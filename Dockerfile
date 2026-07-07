FROM node:20-slim AS build
WORKDIR /app
# Root-mounted by default (own domain/IP). Override with --build-arg for a reverse-proxy subpath deploy.
ARG BASE_PATH=
ARG ADMIN_PATH=admin
ENV BASE_PATH=${BASE_PATH}
ENV ADMIN_PATH=${ADMIN_PATH}
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ && rm -rf /var/lib/apt/lists/*
COPY package*.json ./
COPY scripts ./scripts
RUN npm ci
COPY . .
RUN npm run build && npm run build:hosted

FROM node:20-slim
WORKDIR /app
ENV NODE_ENV=production
ARG BASE_PATH=
ARG ADMIN_PATH=admin
ENV BASE_PATH=${BASE_PATH}
ENV ADMIN_PATH=${ADMIN_PATH}
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ && rm -rf /var/lib/apt/lists/*
COPY package*.json ./
COPY scripts ./scripts
RUN npm ci --omit=dev
COPY server ./server
COPY migrations ./migrations
COPY --from=build /app/dist ./dist
COPY --from=build /app/dist-hosted ./dist-hosted
ENV PORT=5307
ENV DATA_DIR=/data
ENV APP_MODE=single
VOLUME /data
EXPOSE 5307
CMD ["node", "server/index.js"]
