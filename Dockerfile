FROM node:20-bookworm-slim AS builder

WORKDIR /app

ARG NPM_CONFIG_REGISTRY=https://package-mirror.liara.ir/repository/npm/
ENV NPM_CONFIG_REGISTRY=${NPM_CONFIG_REGISTRY}
ENV NPM_CONFIG_REPLACE_REGISTRY_HOST=always

RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./

RUN npm config get registry
RUN npm config get replace-registry-host
RUN npm ci --no-audit --no-fund \
    || NPM_CONFIG_REGISTRY=https://registry.npmjs.org/ \
       NPM_CONFIG_REPLACE_REGISTRY_HOST=never \
       npm ci --no-audit --no-fund

COPY prisma ./prisma
RUN npx prisma generate

COPY . .
RUN npm run build
RUN npm prune --omit=dev --no-audit --no-fund


FROM node:20-bookworm-slim AS runtime

WORKDIR /app

ENV NODE_ENV=production

RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/tools/rls ./tools/rls
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000

CMD ["sh", "-c", "DATABASE_URL=\"$MIGRATION_DATABASE_URL\" npx prisma migrate deploy && node dist/src/main.js"]
