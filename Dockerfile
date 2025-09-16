# ============================
# 1. Dependencies Stage
# ============================
FROM node:18-alpine AS deps

# Install system dependencies for Prisma
RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

# Copy package files for better layer caching
COPY package*.json ./

# Clear npm cache and install with production optimizations
RUN npm cache clean --force && \
    npm ci --omit=dev --prefer-offline --no-audit --progress=false

# ============================
# 2. Build Dependencies Stage
# ============================
FROM node:18-alpine AS builder-deps

WORKDIR /app
COPY package*.json ./
RUN npm ci --prefer-offline --no-audit --progress=false

# ============================
# 3. Build Stage
# ============================
FROM node:18-alpine AS builder

WORKDIR /app

# Copy dependencies
COPY --from=builder-deps /app/node_modules ./node_modules

# Copy source files (order matters for layer caching)
COPY prisma ./prisma
COPY src ./src
COPY public ./public
COPY next.config.js tsconfig.json tailwind.config.js postcss.config.js ./
COPY package*.json ./

# Generate Prisma client and build
RUN npx prisma generate && \
    npm run build && \
    npm prune --production

# ============================
# 4. Production Runtime
# ============================
FROM node:18-alpine AS runner

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init curl

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001 -G nodejs

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copy only production files
COPY --from=builder --chown=nextjs:nodejs /app/package*.json ./
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

# Create runtime directories
RUN mkdir -p uploads logs && \
    chown -R nextjs:nodejs uploads logs && \
    chmod 755 uploads logs

USER nextjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["npm", "start"]

# ============================
# 5. Development Runtime
# ============================
FROM node:18-alpine AS dev

# Install development tools
RUN apk add --no-cache openssl libc6-compat bash git curl

WORKDIR /app

# Create cache directory for better Windows performance
RUN mkdir -p /.npm && chown -R node:node /.npm

# Copy package files
COPY package*.json ./

# Install with cache optimization
RUN npm install --prefer-offline --no-audit

# Create user directories
RUN mkdir -p uploads logs && \
    chown -R node:node uploads logs

USER node

EXPOSE 3000

# Use nodemon for better file watching on Windows
CMD ["npx", "nodemon", "--legacy-watch", "--watch", "src", "--watch", "prisma", "--ext", "ts,tsx,js,jsx,prisma", "--exec", "npm run dev"]
