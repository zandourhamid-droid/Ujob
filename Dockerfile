FROM node:24-alpine AS build
RUN corepack enable
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY artifacts ./artifacts
COPY lib ./lib
COPY scripts ./scripts
COPY tsconfig.json tsconfig.base.json replit.md ./
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @workspace/api-spec run codegen
RUN pnpm --filter @workspace/ujobs run build
RUN pnpm --filter @workspace/api-server run build

FROM node:24-alpine
RUN corepack enable
WORKDIR /app
COPY --from=build /app ./
ENV NODE_ENV=production
ENV PORT=5000
CMD ["pnpm", "--filter", "@workspace/api-server", "run", "start"]