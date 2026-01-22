# Use Bun image as base
FROM oven/bun:1.2-slim AS base

# Set working directory
WORKDIR /app

# Copy package.json and bun.lockb (if exists) for dependency installation
COPY package.json ./
COPY bun.lockb* ./

# Install dependencies (all dependencies including dev dependencies for build)
RUN bun install --frozen-lockfile

# Build stage
FROM base AS build

# Copy tsconfig.json first so Bun can resolve path aliases
COPY tsconfig.json ./

# Copy Prisma schema
COPY prisma ./prisma

# Copy source code (needed for Prisma generate to work properly)
COPY src ./src

# Generate Prisma client and Zod schemas (generates to ./src/zod)
RUN bun run db:generate

# Build the application
RUN bun run build

# Production stage
FROM oven/bun:1.2-slim AS production

# Install OpenSSL (required by Prisma)
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Create non-root user for security
RUN addgroup --system --gid 1001 bunjs
RUN adduser --system --uid 1001 bunjs

# Copy package files for dependency installation
COPY --from=build --chown=bunjs:bunjs /app/package.json ./
COPY --from=build --chown=bunjs:bunjs /app/bun.lockb* ./

# Copy Prisma schema
COPY --from=build --chown=bunjs:bunjs /app/prisma ./prisma

# Install production dependencies (includes @prisma/client and prisma CLI)
RUN bun install --frozen-lockfile --production

# Regenerate Prisma client with correct binary targets for production environment
# (We use bunx prisma generate directly instead of bun run db:generate to avoid needing prisma-zod-generator)
RUN bunx prisma generate

# Copy the built application
COPY --from=build --chown=bunjs:bunjs /app/dist ./dist

# Switch to non-root user
USER bunjs

# Expose port (adjust if your app uses a different port)
EXPOSE 3000

# Set environment to production
ENV NODE_ENV=production

# Run the bundled application
CMD ["bun", "dist/index.js"]
