# Build stage — includes devDependencies (tsc, tsx, etc.)
FROM node:20-slim AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Runtime stage — only production deps, smaller image
FROM node:20-slim

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=build /app/dist ./dist
COPY --from=build /app/data ./data

EXPOSE 3001

CMD ["node", "dist/index.js"]
