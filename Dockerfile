# syntax=docker/dockerfile:1

FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Placeholders only so modules that validate their env at import time
# (lib/prisma.ts, lib/email/resend.ts, lib/shop/stripe.ts) load during
# `next build` — nothing at build time talks to a real DB or API. Scoped to
# this RUN, so they never reach the runner image; real values are supplied
# at container start. Same dummies as the CI workflow's verify job.
RUN DATABASE_URL="postgresql://user:password@localhost:5432/dummy" \
    SITE_URL="https://diamantes3designs.com" \
    RESEND_API_KEY="re_dummy" \
    RESEND_FROM_EMAIL="dummy@example.com" \
    CLOUDINARY_CLOUD_NAME="dummy" \
    CLOUDINARY_API_KEY="dummy" \
    CLOUDINARY_API_SECRET="dummy" \
    STRIPE_SECRET_KEY="sk_test_dummy" \
    npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# pg_dump for the automated backup job (lib/backup/run.ts shells out to the
# real binary rather than reimplementing dump logic).
RUN apk add --no-cache postgresql-client

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["node", "server.js"]
