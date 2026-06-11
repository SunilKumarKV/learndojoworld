# Testing

LearnDojoWorld now has a critical-path API E2E regression suite for beta readiness.

## Local Setup

Start the local database and apply migrations:

```bash
docker compose up -d postgres
pnpm exec prisma migrate dev
pnpm exec prisma generate
```

Run the suite:

```bash
pnpm e2e
```

By default, the test runner starts the NestJS API on port `4101` with `NODE_ENV=test`.
To run against an already-started API:

```bash
E2E_SKIP_API_START=true E2E_API_BASE_URL=http://127.0.0.1:4000/api/v1 pnpm e2e
```

## Required Environment

The suite uses safe local defaults for:

- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `STRIPE_WEBHOOK_SECRET`
- `AI_PRIMARY_PROVIDER=test`

No real Stripe, Razorpay, OpenAI, or Gemini calls are made. The API accepts the deterministic AI
test provider only when `NODE_ENV=test`; production cannot use it.

## Covered Flows

- Auth: register, login, logout, protected dashboard access.
- Course access: public course metadata hides lesson content, non-enrolled lesson access is blocked,
  enrolled lesson access works.
- Payments and webhooks: paid checkout creates a pending payment, signed Stripe webhook unlocks
  enrollment and creator earning, replayed webhook is idempotent, unsigned webhook is rejected.
- AI: chat works under the usage limit with the test provider, 402 is returned when the daily limit
  is reached, paid lesson context is blocked for non-enrolled users.
- Referrals: referral apply works, self-referral is blocked, duplicate referral is blocked, reward
  records are created pending, admin grant fulfills temporary Pro access.
- Beta operations and first-100 growth: public waitlist capture, duplicate waitlist blocking,
  admin waitlist invite/reject actions, cohort creation, invited user acceptance, feedback
  submission, support submission, first-100 dashboard metrics, admin beta dashboard authorization,
  feedback review, and support status management.
- Admin/RBAC: learners cannot access founder analytics, admins can, and role downgrade removes admin
  access for an old token.
- Creator: creator draft creation, module/lesson creation, submit for review, admin approval, public
  course visibility.

## CI

CI runs `pnpm e2e` in a dedicated job against a Postgres service after `prisma migrate deploy`.

## Limitations

- This is an API critical-path suite, not a browser UI suite.
- Razorpay signed webhook replay is not covered yet; unsigned rejection is covered through the shared
  webhook security path.
- Browser-level route protection and visual regressions should be added with Playwright once the web
  app has stable test selectors and seeded UI fixtures.
