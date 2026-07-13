# ---------- Build stage ----------
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ---------- Runtime stage ----------
FROM node:20-alpine AS runner

ENV NODE_ENV=production

WORKDIR /app

# Install only production dependencies
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy compiled output from the build stage
COPY --from=builder /app/dist ./dist

# Create a non-root user and prepare writable dirs
RUN addgroup -S nodejs && adduser -S nestjs -G nodejs \
  && mkdir -p uploads logs \
  && chown -R nestjs:nodejs /app

USER nestjs

EXPOSE 9095

CMD ["node", "dist/main.js"]
