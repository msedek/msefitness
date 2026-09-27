# syntax=docker/dockerfile:1
# better-sqlite3 se compila (no hay prebuild para todas las versiones de Node 24).
FROM node:24-slim AS toolchain
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ && rm -rf /var/lib/apt/lists/*
WORKDIR /app

FROM toolchain AS build
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM toolchain AS deps
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

FROM node:24-slim
ENV NODE_ENV=production PORT=3990 DB_FILE=/app/data/msefitness.db
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY shared ./shared
COPY server ./server
COPY --from=build /app/web/dist ./web/dist
RUN mkdir -p /app/data && chown node:node /app/data
USER node
EXPOSE 3990
HEALTHCHECK --interval=60s --timeout=5s CMD node -e "fetch('http://localhost:3990/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "server/index.ts"]
