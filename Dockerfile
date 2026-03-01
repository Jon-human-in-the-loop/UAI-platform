# ============================================================
# UAI Platform — Dockerfile Multi-Stage para Producción
# ============================================================

# --- Etapa 1: Instalación de dependencias ---
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copiar manifiestos de paquetes para aprovechar el caché de capas
COPY package.json package-lock.json* pnpm-lock.yaml* ./

# Instalar dependencias de producción con npm ci para reproducibilidad exacta
RUN npm ci --ignore-scripts

# --- Etapa 2: Build de la aplicación ---
FROM node:20-alpine AS builder
WORKDIR /app

# Copiar dependencias instaladas desde la etapa anterior
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Variables de entorno necesarias solo en tiempo de build
# (No incluir secretos aquí; se inyectan en Railway como variables de entorno)
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Construir la aplicación Next.js en modo standalone
RUN npm run build

# --- Etapa 3: Imagen de producción (mínima) ---
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Crear usuario no-root por seguridad
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copiar solo los artefactos necesarios para ejecutar la app
COPY --from=builder /app/public ./public

# Aprovechar el output standalone de Next.js para una imagen mínima
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

# Railway inyecta la variable PORT automáticamente
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Comando de inicio usando el servidor standalone de Next.js
CMD ["node", "server.js"]
