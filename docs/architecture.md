# Ujobs architecture

Ujobs is organized as a pnpm workspace:

- `artifacts/ujobs` — Arabic-first React frontend and admin surfaces.
- `artifacts/api-server` — Express API, request validation, payment gateway adapter, and seed bootstrap.
- `lib/db` — PostgreSQL schema and Drizzle models.
- `lib/api-spec` — OpenAPI source of truth.
- `lib/api-client-react` and `lib/api-zod` — generated client hooks and validation schemas.
- `docs` — operating, security, and deployment documentation.

## Domain boundaries

The marketplace domain is separated into catalog, requests/offers, bookings, wallet ledger,
payments, complaints, and administration. The internal wallet is a ledger, not a bank account:
the platform commission is currently a fixed 10 MAD per eligible accepted request.
the only payment currently enabled is a development Sandbox provider. Real payments must be
implemented behind `PaymentGateway` and connected to a licensed PSP before production use.

## Data protection

Document files must be stored in object storage in production; PostgreSQL stores only their
metadata and object path. Secrets are environment variables and must never be shipped to the
browser. Admin actions should write to `audit_logs` as the admin dashboard expands.