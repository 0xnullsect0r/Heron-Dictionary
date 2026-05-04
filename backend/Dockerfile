# Single-stage build: compile TypeScript then prune devDependencies
# Avoids multi-stage COPY of node_modules which triggers containerd snapshot bugs
FROM node:20-slim

WORKDIR /app

RUN apt-get update -qq && \
    apt-get install -y --no-install-recommends python3 make g++ curl && \
    rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build && npm prune --production

RUN mkdir -p /data

EXPOSE 3001

HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=5 \
  CMD curl -sf http://localhost:3001/_health || exit 1

CMD ["node", "dist/index.js"]
