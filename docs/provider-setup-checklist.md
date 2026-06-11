# Provider Setup Checklist

Use this checklist while configuring the controlled beta production environment. Do not paste real
secrets into repository files, tickets, screenshots, or chat.

## Vercel Project Setup

- [ ] Create Vercel project from the GitHub repository.
- [ ] Configure PNPM install command: `pnpm install --frozen-lockfile`.
- [ ] Configure web build command: `pnpm --filter @learndojoworld/web build`.
- [ ] Set Node.js to stable Node 20.
- [ ] Add env vars from `docs/env/vercel-web.env.example`.
- [ ] Confirm `NEXT_PUBLIC_WEB_URL` matches the production web origin.
- [ ] Configure production web domain.
- [ ] Confirm build uses `NEXT_PUBLIC_API_URL`.
- [ ] Verify deployed security headers.

## Render Service Setup

- [ ] Create Render Web Service from the GitHub repository.
- [ ] Configure build command:
      `pnpm install --frozen-lockfile && pnpm exec prisma generate && pnpm --filter @learndojoworld/api build`.
- [ ] Configure start command: `pnpm --filter @learndojoworld/api start`.
- [ ] Add env vars from `docs/env/render-api.env.example`.
- [ ] Configure health check path: `/api/v1/health`.
- [ ] Verify readiness: `/api/v1/health/readiness`.
- [ ] Confirm logs are structured and do not expose secrets.

## Neon DB Setup

- [ ] Create Neon production project.
- [ ] Create `learndojoworld` database.
- [ ] Copy SSL-enabled connection string.
- [ ] Store connection string in Render as `DATABASE_URL`.
- [ ] Enable automated backups.
- [ ] Run `pnpm exec prisma migrate deploy`.
- [ ] Run `pnpm exec prisma migrate status`.

## Upstash Redis Setup

- [ ] Create Upstash Redis production database.
- [ ] Copy Redis connection URL.
- [ ] Store Redis URL in Render as `REDIS_URL`.
- [ ] Confirm API boots with Redis URL configured.
- [ ] Plan Redis-backed throttling before horizontal API scaling.

## Sentry Setup

- [ ] Create Sentry API project.
- [ ] Create Sentry web project.
- [ ] Configure Render API Sentry env vars.
- [ ] Configure Vercel web Sentry env vars.
- [ ] Verify a controlled test event from API if configured.
- [ ] Verify a controlled test event from web if configured.
- [ ] Confirm events do not include secrets, tokens, or payment payloads.

## Stripe Webhook Setup

- [ ] Configure production webhook endpoint:
      `https://api.your-domain.com/api/v1/webhooks/payments/stripe`.
- [ ] Subscribe to checkout/payment events required by the current payment flow.
- [ ] Store signing secret in Render as `STRIPE_WEBHOOK_SECRET`.
- [ ] Confirm unsigned webhook is rejected.
- [ ] Confirm signed webhook is idempotent on replay.

## Razorpay Webhook Setup

- [ ] Configure production webhook endpoint:
      `https://api.your-domain.com/api/v1/webhooks/payments/razorpay`.
- [ ] Store signing secret in Render as `RAZORPAY_WEBHOOK_SECRET`.
- [ ] Confirm unsigned webhook is rejected.
- [ ] Confirm signed webhook processing is idempotent.

## DNS Setup

- [ ] Point apex or `www` web domain to Vercel.
- [ ] Point `api` subdomain to Render.
- [ ] Enable HTTPS for both web and API.
- [ ] Set `WEB_ORIGIN` to the production web origin.
- [ ] Set `NEXT_PUBLIC_API_URL` to the production API `/api/v1`.
- [ ] Confirm webhook provider URLs use the production API domain.

## Post-Deploy Verification

- [ ] `GET /api/v1/health` returns healthy.
- [ ] `GET /api/v1/health/readiness` returns ready.
- [ ] Homepage loads.
- [ ] Signup/login works.
- [ ] Beta waitlist works.
- [ ] AI under limit returns real provider response.
- [ ] Paid checkout creates pending payment only.
- [ ] Signed webhook unlocks access.
- [ ] Admin dashboard loads.
- [ ] Sentry receives events if configured.
- [ ] Logs and Sentry do not contain secrets.
