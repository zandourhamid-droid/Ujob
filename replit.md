# Ujobs

Ujobs منصة خدمات مغربية تربط المستفيدين بمقدمي الخدمات الموثقين حسب القطاع والمدينة والحي.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string
- `SESSION_SECRET` — secret reserved for session/auth integrations

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- Frontend and admin: `artifacts/ujobs`
- Backend: `artifacts/api-server`
- Database schema: `lib/db/src/schema/marketplace.ts`
- API contract: `lib/api-spec/openapi.yaml`
- Generated hooks: `lib/api-client-react`
- Operating docs: `docs/`

## Architecture decisions

- OpenAPI is the source of truth; regenerate clients after contract changes.
- The provider wallet is an internal ledger only; payment intents use Sandbox until a licensed PSP is connected.
- Seed data is inserted only into an empty development database.

## Product

The product supports service discovery, request creation, provider offers, bookings,
wallet top-ups, commission deductions, complaints, and operational/admin summaries.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

_Populate as you build — sharp edges, "always run X before Y" rules._

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
