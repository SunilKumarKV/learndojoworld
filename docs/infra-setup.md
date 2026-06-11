# Production Infrastructure Setup Plan

This plan prepares LearnDojoWorld for controlled beta production infrastructure. It is an operations
plan only: no product feature changes, no payment logic changes, and no secrets committed.

## Recommended Beta Stack

- Web: Vercel
- API: Render
- Database: Neon Postgres
- Redis: Upstash Redis
- Email: Resend placeholder
- Monitoring: Sentry
- Storage: Cloudflare R2 later

## Architecture Diagram

```text
Users
  |
  v
Vercel Web (Next.js)
  |  NEXT_PUBLIC_API_URL
  v
Render API (NestJS)
  |-- Neon Postgres (Prisma)
  |-- Upstash Redis (cache / future distributed throttling)
  |-- Stripe webhooks
  |-- Razorpay webhooks
  |-- Gemini / OpenAI providers
  |-- Sentry API project
  |
  v
Admin / Creator / Learner workflows
```

## Vercel Web Setup

1. Create a Vercel project connected to the GitHub repository.
2. Use the monorepo project root and set the build command:

   ```bash
   pnpm --filter @learndojoworld/web build
   ```

3. Use install command:

   ```bash
   pnpm install --frozen-lockfile
   ```

4. Set Node.js to stable Node 20.
5. Add production env vars:
   - `NEXT_PUBLIC_WEB_URL`
   - `NEXT_PUBLIC_API_URL`
   - `NEXT_PUBLIC_RAZORPAY_KEY_ID`
   - `SENTRY_DSN`
   - `SENTRY_ENVIRONMENT`
   - `SENTRY_TRACES_SAMPLE_RATE`
   - `NEXT_PUBLIC_SENTRY_DSN`
   - `NEXT_PUBLIC_SENTRY_ENVIRONMENT`
   - `NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE`

6. Configure the production domain.
7. Deploy only after GitHub CI is green.
8. Verify security headers, API connectivity, and the production smoke checklist.

## Render API Setup

1. Create a Render Web Service connected to the same repository.
2. Set runtime to Node.
3. Set build command:

   ```bash
   pnpm install --frozen-lockfile && pnpm exec prisma generate && pnpm --filter @learndojoworld/api build
   ```

4. Set start command:

   ```bash
   pnpm --filter @learndojoworld/api start
   ```

5. Add required API env vars from `docs/env-matrix.md`.
6. Configure health check path:

   ```text
   /api/v1/health
   ```

7. Use readiness for deploy validation:

   ```text
   /api/v1/health/readiness
   ```

8. Ensure Render service URL is used in `NEXT_PUBLIC_API_URL`.

## Neon Postgres Setup

1. Create a Neon project for production.
2. Create the production database.
3. Copy the pooled or direct connection string into `DATABASE_URL`.
4. Use SSL-enabled connection strings from Neon.
5. Before first deploy:

   ```bash
   pnpm exec prisma migrate deploy
   pnpm exec prisma generate
   ```

6. Enable automated backups.
7. Confirm migration status after deploy:

   ```bash
   pnpm exec prisma migrate status
   ```

Never run `prisma migrate dev` against production.

## Upstash Redis Setup

1. Create an Upstash Redis database in the closest production region.
2. Copy the Redis URL into `REDIS_URL`.
3. Keep Redis credentials secret.
4. Use Redis later for distributed rate limiting before horizontal API scaling.
5. Confirm the API boots with `REDIS_URL` present because current env validation requires it.

## Sentry Setup

1. Create separate Sentry projects for web and API.
2. Configure API:
   - `SENTRY_DSN`
   - `SENTRY_ENVIRONMENT=production`
   - `SENTRY_TRACES_SAMPLE_RATE=0.05`

3. Configure web:
   - `NEXT_PUBLIC_SENTRY_DSN`
   - `NEXT_PUBLIC_SENTRY_ENVIRONMENT=production`
   - `NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE=0.05`

4. Verify a controlled test event after deployment.
5. Do not commit DSNs or Sentry auth tokens.

## Resend Setup Placeholder

Email is not part of this sprint. When email is enabled:

1. Create a Resend account.
2. Verify the sending domain.
3. Add DNS records required by Resend.
4. Add `RESEND_API_KEY` only after the API has email logic.
5. Add bounce and delivery monitoring.

## Domain and DNS Checklist

- [ ] Choose production web domain.
- [ ] Point apex or `www` to Vercel.
- [ ] Point `api` subdomain to Render.
- [ ] Enable HTTPS for web and API.
- [ ] Set `WEB_ORIGIN=https://your-web-domain`.
- [ ] Set `NEXT_PUBLIC_API_URL=https://api.your-domain/api/v1`.
- [ ] Configure Stripe webhook URL.
- [ ] Configure Razorpay webhook URL.
- [ ] Verify Sentry production environment.
- [ ] Lower DNS TTL before launch window if rollback risk is high.

## Environment Variable Mapping

Use `docs/env-matrix.md` as the source of truth.

High-level mapping:

- Vercel: `NEXT_PUBLIC_*` web variables.
- Render: API secrets, AI keys, payment keys, `DATABASE_URL`, `REDIS_URL`, `WEB_ORIGIN`.
- Neon: database credentials only.
- Upstash: Redis credential only.
- Sentry: web and API DSNs.
- Stripe/Razorpay: provider keys and webhook secrets.

## Deployment Order

1. Create Neon database.
2. Create Upstash Redis.
3. Create Sentry projects.
4. Configure Render API env vars.
5. Run Prisma migrations against Neon.
6. Deploy Render API.
7. Verify API health/readiness.
8. Configure Vercel env vars.
9. Deploy Vercel web.
10. Configure DNS.
11. Configure Stripe/Razorpay webhooks.
12. Run production smoke test.

## Rollback Order

1. Pause risky operations if needed: paid checkout, beta invites, creator approvals.
2. Roll back Vercel web if the issue is frontend-only.
3. Roll back Render API if the issue is backend-only and migrations are compatible.
4. Prefer forward-fix for additive database migration issues.
5. Restore database from backup only for data corruption or destructive migration failure.
6. Re-run health/readiness and the focused smoke path.

## Beta Deployment Checklist

- [ ] GitHub CI, CodeQL, secret scan, audit, and E2E are green.
- [ ] Production env vars configured in Vercel and Render.
- [ ] `DATABASE_URL` points to Neon production database.
- [ ] `REDIS_URL` points to Upstash.
- [ ] `WEB_ORIGIN` matches Vercel production domain.
- [ ] `NEXT_PUBLIC_WEB_URL` matches Vercel production domain.
- [ ] `NEXT_PUBLIC_API_URL` matches Render API domain plus `/api/v1`.
- [ ] Prisma migrations applied with `migrate deploy`.
- [ ] `/api/v1/health` passes.
- [ ] `/api/v1/health/readiness` passes.
- [ ] Stripe/Razorpay webhook signatures verified in production setup.
- [ ] Sentry receives events.
- [ ] Beta waitlist, auth, AI, payments, creator, admin, support, and feedback smoke paths pass.
