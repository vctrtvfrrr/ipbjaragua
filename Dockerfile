# ------------ Base Stage ------------ #
FROM node:26-slim AS base
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN npm install -g corepack@latest && corepack enable
WORKDIR /app

# ------------- Dev Stage ------------ #
FROM base AS dev
COPY package.json pnpm-*.yaml ./
RUN pnpm install --frozen-lockfile --ignore-scripts
RUN pnpm exec playwright install --with-deps chromium
COPY . .
EXPOSE 3000
CMD ["pnpm", "dev"]

# ------------ Build Stage ------------ #
FROM base AS build
COPY package.json pnpm-*.yaml ./
RUN pnpm install --frozen-lockfile --ignore-scripts
COPY . .
RUN pnpm build

# --------- Production Stage ---------- #
FROM node:26-slim AS production
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public
COPY --from=build --chown=node:node /app/db/migrations ./db/migrations
USER node
EXPOSE 3000
CMD ["node", "server.js"]
