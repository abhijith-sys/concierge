FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM deps AS build
COPY tsconfig.json ./
COPY src ./src
COPY prisma ./prisma
RUN npm run prisma:generate && npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
COPY prisma ./prisma
# Seed imports RBAC helpers from src via tsx
COPY src ./src
RUN npm ci --include=dev && npm run prisma:generate
COPY --from=build /app/dist ./dist
COPY docker-entrypoint.sh ./
RUN mkdir -p /app/uploads && chmod +x /app/docker-entrypoint.sh
EXPOSE 3001
CMD ["/app/docker-entrypoint.sh"]
