FROM node:22-alpine AS build

WORKDIR /app
RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/core/package.json packages/core/package.json
COPY services/api/package.json services/api/package.json
COPY web/package.json web/package.json
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm --filter @dealhealth/core build \
  && pnpm --filter @dealhealth/api build \
  && pnpm --filter @dealhealth/web build

FROM node:22-alpine AS runtime

WORKDIR /app
ENV NODE_ENV=production \
  SERVE_WEB=true \
  WEB_ROOT=web/dist

COPY --from=build /app /app

EXPOSE 10000
CMD ["node", "services/api/dist/index.js"]
