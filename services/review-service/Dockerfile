# ==============================================================================
# Multi-stage Dockerfile: Review Service (Node.js 20 + Express + MongoDB/NoSQL)
# ==============================================================================
FROM node:20-alpine AS builder

WORKDIR /build

COPY package*.json ./
RUN npm ci --only=production

# --- Etapa 2: Runner final seguro (Non-root user node) ---
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production \
    PORT=3000

COPY --from=builder /build/node_modules ./node_modules
COPY package*.json ./
COPY src/ ./src

USER node

EXPOSE 3000

HEALTHCHECK --interval=10s --timeout=3s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health/live || exit 1

CMD ["node", "src/server.js"]
