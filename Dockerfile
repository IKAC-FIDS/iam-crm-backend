FROM node:20-alpine AS builder
RUN apk add --no-cache openssl
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma
RUN npm install
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine
RUN apk add --no-cache openssl
WORKDIR /app
ENV NODE_ENV=production

# ✅ همه dependencies رو نصب می‌کنیم
COPY package*.json ./
RUN npm install

# ✅ کل prisma رو کپی می‌کنیم
COPY prisma ./prisma
RUN npx prisma generate

COPY --from=builder /app/dist ./dist

RUN ls -laR dist

EXPOSE 3000
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/src/main.js"]
