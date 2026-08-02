# --- Stage 1: install dependencies (full, including devDependencies) ---
# bcrypt is a native module and needs python3/make/g++ to compile its C++ bindings.
# These build tools only exist in this stage — they never reach the final image.
FROM node:22-alpine AS deps
WORKDIR /app
RUN apk add --no-cache python3 make g++
COPY package.json package-lock.json ./
RUN npm ci

# --- Stage 2: build (compile TypeScript, generate the Prisma client) ---
FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

# --- Stage 3: production dependencies only (no devDependencies, e.g. no TypeScript/ESLint) ---
FROM node:22-alpine AS prod-deps
WORKDIR /app
RUN apk add --no-cache python3 make g++
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# --- Stage 4: final runtime image ---
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Run as a non-root user — a container running as root is a real security gap.
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# --chown sets ownership as each layer is written, instead of a separate `chown -R`
# afterward — the latter silently duplicates every file's content into a new layer
# under Docker's overlay filesystem, nearly doubling the image size.
COPY --from=prod-deps --chown=appuser:appgroup /app/node_modules ./node_modules
# npm ci --omit=dev installs the un-generated @prisma/client package;
# the actual generated client code from the build stage has to be copied in on top.
COPY --from=builder --chown=appuser:appgroup /app/node_modules/@prisma/client ./node_modules/@prisma/client
COPY --from=builder --chown=appuser:appgroup /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=appuser:appgroup /app/dist ./dist
COPY --from=builder --chown=appuser:appgroup /app/prisma ./prisma
COPY --chown=appuser:appgroup package.json ./

RUN mkdir -p uploads && chown appuser:appgroup uploads
USER appuser

EXPOSE 3000
# The compiled entry point lands at dist/src/main.js, not dist/main.js, because
# prisma.config.ts at the project root makes TypeScript preserve the src/ folder
# structure in its output rather than flattening it.
CMD ["node", "dist/src/main.js"]
