# Build stage - installs all deps and compiles TypeScript
FROM node:20-slim AS build

WORKDIR /app

RUN apt-get update -qq && \
    apt-get install -y --no-install-recommends python3 make g++ && \
    rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Runtime stage - copy compiled output and prod node_modules from build
FROM node:20-slim

WORKDIR /app

RUN apt-get update -qq && \
    apt-get install -y --no-install-recommends curl && \
    rm -rf /var/lib/apt/lists/*

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
RUN mkdir -p ./data

EXPOSE 3001

CMD ["node", "dist/index.js"]
