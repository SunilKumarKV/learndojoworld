# Production Deployment Runbook

## Architecture Overview

LearnDojoWorld production is a monorepo deployment with:

- Next.js web app in `apps/web`
- NestJS API in `apps/api`
- PostgreSQL managed database
- Optional Redis service for cache/distributed operations
- Prisma migrations from `prisma/migrations`
- Stripe and Razorpay webhook endpoints on the API
- Sentry for web and API observability
- GitHub Actions CI, CodeQL, dependency review, secret scan, and E2E gates

## Pre-Deployment Gate

Before deploying:

```bash
pnpm install --frozen-lockfile
pnpm exec prisma generate
pnpm format:check
pnpm lint
pnpm typecheck
pnpm build
pnpm e2e
```

CI must pass on the exact commit being deployed. Do not deploy with failing CodeQL, secret scan,
dependency review, build, or E2E checks.

## Web Deployment: Vercel

1. Create a Vercel project pointing at this repository.
2. Set the root directory to `apps/web` if deploying the web app as a standalone Vercel project.
3. Use PNPM with Node 20.20.2 or stable Node 20.
4. Set build command:

   ```bash
   pnpm --filter @learndojoworld/web build
   ```

5. Set install command:

   ```bash
   pnpm install --frozen-lockfile
   ```

6. Configure web env vars:
   - `NEXT_PUBLIC_API_URL=https://api.your-domain.com/api/v1`
   - `NEXT_PUBLIC_RAZORPAY_KEY_ID`
   - `NEXT_PUBLIC_SENTRY_DSN`
   - `NEXT_PUBLIC_SENTRY_ENVIRONMENT=production`
   - `NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE=0.05`

7. Verify response headers from `apps/web/next.config.ts` are present after deployment.
8. Run the production smoke checklist.

## API Deployment

Use a Node-capable host that supports long-running services, environment variables, log drains, and
health checks.

Recommended build steps:

```bash
pnpm install --frozen-lockfile
pnpm exec prisma generate
pnpm --filter @learndojoworld/api build
```

Recommended start command:

```bash
pnpm --filter @learndojoworld/api start
```

Set API health checks:

- Liveness: `GET /api/v1/health`
- Readiness: `GET /api/v1/health/readiness`

Readiness must pass before routing traffic to a new API instance.

## Database Deployment

Use a managed PostgreSQL service for production. Do not use the local Docker database in production.

Required database steps:

1. Back up production database before migrations.
2. Confirm the deploy commit contains the intended migration files.
3. Run:

   ```bash
   pnpm exec prisma migrate deploy
   pnpm exec prisma generate
   ```

4. Confirm:

   ```bash
   pnpm exec prisma migrate status
   ```

5. Start or restart the API.
6. Verify readiness.

Do not run `prisma migrate dev` against production.

## Migration Workflow

- Development: `pnpm exec prisma migrate dev --name <name>`
- CI/E2E: `pnpm exec prisma migrate deploy`
- Production: `pnpm exec prisma migrate deploy`

Migration rules:

- Every schema change must include a migration.
- Review destructive migrations manually.
- Avoid nullable-to-required changes without a backfill.
- Avoid enum removals or column drops during beta unless rollback is planned.
- Never edit an already-applied production migration.

## Webhook Setup

Production API endpoints:

- Stripe: `POST https://api.your-domain.com/api/v1/webhooks/payments/stripe`
- Razorpay: `POST https://api.your-domain.com/api/v1/webhooks/payments/razorpay`

Configure provider secrets:

- `STRIPE_WEBHOOK_SECRET`
- `RAZORPAY_WEBHOOK_SECRET`

Webhook requirements:

- Signature verification must pass before mutation.
- Replayed events must be idempotent through the `WebhookEvent` ledger.
- Frontend success URLs must never unlock course access or activate subscriptions.
- Monitor webhook failures after every deploy.

## DNS and Domains

Recommended DNS:

- `learn-dojo-world.com` or primary apex domain for web.
- `www` CNAME to web host.
- `api` CNAME/A record to API host.

Checklist:

- HTTPS enabled for web and API.
- `WEB_ORIGIN` includes production web origin.
- `NEXT_PUBLIC_API_URL` points to production API `/api/v1`.
- Stripe/Razorpay webhook dashboards use production API URL.
- Sentry environment is `production`.
- DNS TTL lowered before first launch window if migration risk exists.

## CI Requirements

Required GitHub checks:

- CI quality job: install, Prisma generate, format, lint, typecheck, build.
- Critical E2E job with Postgres service and `prisma migrate deploy`.
- CodeQL JavaScript/TypeScript and Actions scanning.
- Dependency review on pull requests.
- Secret scanning with Gitleaks.
- PNPM audit.

Do not bypass or disable these checks for production branches.

## Post-Deployment Verification

After deploy:

1. Verify `/api/v1/health`.
2. Verify `/api/v1/health/readiness`.
3. Run `docs/production-smoke-test.md`.
4. Watch logs and Sentry for 30 minutes.
5. Confirm Stripe and Razorpay webhook dashboards show successful delivery.
6. Confirm no unexpected AI provider failures or payment unlock failures.
