# syntax=docker/dockerfile:1

# This is a pnpm workspace app that depends on the @ars/types and
# @ars/addon-builder workspace packages, so the Docker build context must be the
# monorepo root (not this directory). Build and run from the repo root:
#
#   docker build -f apps/source-librarian/Dockerfile -t source-librarian .
#   docker run --rm \
#     -e DISCORD_TOKEN=... \
#     -e CURSEFORGE_API_KEY=... \
#     source-librarian
#
# Secrets are provided at runtime (the .env file is excluded via .dockerignore),
# and are validated against .env.schema by varlock on startup.

FROM node:24-slim

ENV PNPM_HOME="/pnpm"
ENV PATH="/pnpm:$PATH"
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable

WORKDIR /app

# Copy the whole workspace (build context is the repo root).
COPY . .

# Install only the bot and its workspace dependencies. tsx (the TypeScript
# runtime) is a devDependency, so dev dependencies must be installed too.
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile --filter "@ars/source-librarian..."

ENV NODE_ENV=production
WORKDIR /app/apps/source-librarian

# The bot runs through tsx and registers the https loader hook (used by the
# /guide commands to import Pagefind from ars.guide at runtime).
# It is a Discord gateway client with no HTTP server, so there is no HEALTHCHECK.
CMD ["pnpm", "start"]
