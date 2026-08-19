# ------------ Base Stage ------------ #
FROM node:26-slim AS base
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN npm install -g corepack@latest && corepack enable
WORKDIR /app

# ------------- Dev Stage ------------ #
FROM base AS dev
COPY package.json pnpm-*.yaml ./
RUN pnpm install --frozen-lockfile --ignore-scripts
RUN pnpm exec playwright install --with-deps chromium-headless-shell
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
# Ata PDFs are rendered by Chromium, so the browser is part of the runtime and not of the
# toolchain. The path is outside /app because the standalone bundle owns that directory.
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public
COPY --from=build --chown=node:node /app/db/migrations ./db/migrations
# The standalone bundle carries the Playwright library but not its CLI, so the browser is
# downloaded with a throwaway copy pinned to the very version the bundle will drive.
RUN PLAYWRIGHT_VERSION=$(node -p "require('/app/node_modules/playwright/package.json').version") \
  && npm install --no-save --prefix /tmp/playwright playwright@$PLAYWRIGHT_VERSION \
  && node /tmp/playwright/node_modules/playwright/cli.js install --with-deps chromium-headless-shell \
  && chmod -R a+rX /ms-playwright \
  && rm -rf /tmp/playwright /root/.npm /var/lib/apt/lists/*
USER node
EXPOSE 3000
CMD ["node", "server.js"]
