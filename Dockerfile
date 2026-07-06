FROM node:20-slim AS build
WORKDIR /app
ENV BASE_PATH=/benji
ENV ADMIN_PATH=edit
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ && rm -rf /var/lib/apt/lists/*
COPY package*.json ./
COPY scripts ./scripts
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-slim
WORKDIR /app
ENV NODE_ENV=production
ENV BASE_PATH=/benji
ENV ADMIN_PATH=edit
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ && rm -rf /var/lib/apt/lists/*
COPY package*.json ./
COPY scripts ./scripts
RUN npm ci --omit=dev
COPY server ./server
COPY --from=build /app/dist ./dist
ENV PORT=5307
ENV DATA_DIR=/data
VOLUME /data
EXPOSE 5307
CMD ["node", "server/index.js"]
