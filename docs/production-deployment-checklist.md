# Production Deployment Checklist

Use this checklist for controlled beta production deploys. Do not deploy if CI, CodeQL, secret scan,
or E2E are failing.

## Pre-Deploy Checks

- [ ] Confirm target branch and commit SHA.
- [ ] Confirm no real secrets are committed.
- [ ] Confirm `pnpm install --frozen-lockfile` works in CI.
- [ ] Confirm `pnpm exec prisma generate` works.
- [ ] Confirm `pnpm format:check` passes.
- [ ] Confirm `pnpm lint` passes.
- [ ] Confirm `pnpm typecheck` passes.
- [ ] Confirm `pnpm build` passes.
- [ ] Confirm `pnpm e2e` passes.
- [ ] Review pending Prisma migrations.
- [ ] Confirm Neon backup exists before migration.

## Deploy API

- [ ] Configure Render env vars from `docs/env-matrix.md`.
- [ ] Build API with Prisma generate.
- [ ] Deploy Render API.
- [ ] Confirm API service starts.
- [ ] Confirm logs do not contain secrets.

## Run Prisma Migrate Deploy

- [ ] Point `DATABASE_URL` to Neon production database.
- [ ] Run:

  ```bash
  pnpm exec prisma migrate deploy
  ```

- [ ] Run:

  ```bash
  pnpm exec prisma migrate status
  ```

- [ ] Do not run `prisma migrate dev` in production.

## Verify API Health

- [ ] `GET /api/v1/health` returns healthy.
- [ ] `GET /api/v1/health/readiness` returns ready.
- [ ] Render health check is green.
- [ ] API request logs are structured.

## Deploy Web

- [ ] Configure Vercel env vars from `docs/env-matrix.md`.
- [ ] Confirm `NEXT_PUBLIC_API_URL` points to Render API `/api/v1`.
- [ ] Deploy Vercel web.
- [ ] Confirm homepage loads.
- [ ] Confirm CSP allows production API origin.

## Verify Webhooks

- [ ] Configure Stripe webhook URL:
      `https://api.your-domain.com/api/v1/webhooks/payments/stripe`.
- [ ] Configure Razorpay webhook URL:
      `https://api.your-domain.com/api/v1/webhooks/payments/razorpay`.
- [ ] Set `STRIPE_WEBHOOK_SECRET`.
- [ ] Set `RAZORPAY_WEBHOOK_SECRET`.
- [ ] Send provider test webhook.
- [ ] Confirm unsigned webhook is rejected.
- [ ] Confirm replayed signed webhook is idempotent.

## Verify Auth

- [ ] Signup works.
- [ ] Login works.
- [ ] Logout works.
- [ ] Protected learner dashboard loads.
- [ ] Learner cannot access admin routes.
- [ ] Admin can access admin routes.

## Verify AI

- [ ] Primary provider key is configured.
- [ ] AI chat under plan limit returns real provider response.
- [ ] Usage increments after successful response.
- [ ] Limit reached returns `402`.
- [ ] Paid course context is not exposed to unauthorized users.

## Verify Payments Test Mode

- [ ] Paid checkout creates pending payment.
- [ ] Frontend success callback does not unlock access.
- [ ] Signed webhook unlocks enrollment.
- [ ] Creator earning is created once.
- [ ] Replayed webhook does not duplicate enrollment or earning.

## Verify Beta Waitlist

- [ ] `/beta` loads.
- [ ] Waitlist submission works.
- [ ] Duplicate waitlist email is blocked.
- [ ] Admin sees waitlist entry.
- [ ] Admin invite works.
- [ ] Admin reject works.
- [ ] `/beta/welcome` loads for authenticated user.

## Verify Sentry

- [ ] API Sentry project receives a controlled test event if configured.
- [ ] Web Sentry project receives a controlled test event if configured.
- [ ] Sentry environment is `production`.
- [ ] Events do not include secrets, tokens, or payment payloads.

## Post-Deploy Monitoring

- [ ] Watch Render logs for 30 minutes.
- [ ] Watch Vercel logs for 30 minutes.
- [ ] Watch Sentry for new critical errors.
- [ ] Watch Stripe/Razorpay webhook delivery dashboards.
- [ ] Watch AI provider errors and cost.
- [ ] Watch support and feedback intake.
- [ ] Record deployment SHA, deployment time, and smoke test result.
