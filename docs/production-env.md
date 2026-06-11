# Production Environment Variables

Never commit real production secrets. Store secrets only in the deployment platform, GitHub
Environments, or the payment/provider dashboards.

## Core

| Variable              | Required                       | Used By                                   | Example                                                 |
| --------------------- | ------------------------------ | ----------------------------------------- | ------------------------------------------------------- |
| `NODE_ENV`            | yes                            | API/web runtime behavior                  | `production`                                            |
| `DATABASE_URL`        | yes                            | Prisma/API                                | `postgresql://USER:PASSWORD@HOST:5432/DB?schema=public` |
| `REDIS_URL`           | yes for current API validation | API config, future distributed operations | `redis://default:PASSWORD@HOST:6379`                    |
| `WEB_ORIGIN`          | yes                            | API CORS and checkout redirect URLs       | `https://learndojoworld.com`                            |
| `NEXT_PUBLIC_WEB_URL` | recommended                    | SEO site URL and canonical metadata       | `https://learndojoworld.com`                            |
| `NEXT_PUBLIC_API_URL` | yes for web                    | Web API client and CSP                    | `https://api.learndojoworld.com/api/v1`                 |

`WEB_ORIGIN` supports comma-separated origins for production and staging. Do not use `*`.

## Auth

| Variable             | Required | Used By               | Notes                          |
| -------------------- | -------- | --------------------- | ------------------------------ |
| `JWT_SECRET`         | yes      | Access token signing  | Use a long random secret.      |
| `JWT_REFRESH_SECRET` | yes      | Refresh token signing | Must differ from `JWT_SECRET`. |

Rotate JWT secrets only with a planned forced-login window.

## AI

| Variable               | Required                      | Used By            | Example            |
| ---------------------- | ----------------------------- | ------------------ | ------------------ |
| `AI_PRIMARY_PROVIDER`  | yes                           | AI provider router | `gemini`           |
| `AI_FALLBACK_PROVIDER` | optional                      | AI provider router | `openai`           |
| `OPENAI_API_KEY`       | required if OpenAI is enabled | OpenAI provider    | secret             |
| `OPENAI_MODEL`         | optional                      | OpenAI provider    | `gpt-4o-mini`      |
| `GEMINI_API_KEY`       | required if Gemini is enabled | Gemini provider    | secret             |
| `GEMINI_MODEL`         | optional                      | Gemini provider    | `gemini-1.5-flash` |

At least the primary AI provider must have a valid production key before enabling AI chat in beta.

## Payments

| Variable                      | Required                           | Used By                  |
| ----------------------------- | ---------------------------------- | ------------------------ |
| `STRIPE_SECRET_KEY`           | required for Stripe checkout       | API payments             |
| `STRIPE_WEBHOOK_SECRET`       | required for Stripe webhooks       | API webhook verification |
| `RAZORPAY_KEY_ID`             | required for Razorpay checkout     | API payments             |
| `RAZORPAY_KEY_SECRET`         | required for Razorpay checkout     | API payments             |
| `RAZORPAY_WEBHOOK_SECRET`     | required for Razorpay webhooks     | API webhook verification |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | required if Razorpay UI is enabled | Web checkout             |

Payment provider keys must be live-mode keys only in production. Test keys belong in staging/local.

## Observability

| Variable                                | Required    | Used By                   | Example      |
| --------------------------------------- | ----------- | ------------------------- | ------------ |
| `SENTRY_DSN`                            | recommended | API and web server Sentry | secret DSN   |
| `SENTRY_ENVIRONMENT`                    | recommended | API and web server Sentry | `production` |
| `SENTRY_TRACES_SAMPLE_RATE`             | optional    | API and web server Sentry | `0.05`       |
| `NEXT_PUBLIC_SENTRY_DSN`                | recommended | Web Sentry                | public DSN   |
| `NEXT_PUBLIC_SENTRY_ENVIRONMENT`        | recommended | Web Sentry                | `production` |
| `NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE` | optional    | Web Sentry                | `0.05`       |
| `LOG_LEVEL`                             | recommended | API structured logs       | `info`       |

DSNs are not authentication secrets in the same way as API keys, but still avoid committing them.

## Security and Rate Limits

Current rate limits are code-configured:

- Global API: 120 requests/minute/client.
- Login/register: 5 requests/minute/client.
- AI chat: 30 requests/minute/client plus billing plan limits.
- Payment webhooks are excluded from throttling but still require signatures.

Before horizontal API scaling, add distributed throttler storage such as Redis-backed storage. A
single-instance in-memory limiter is not sufficient for multi-instance abuse protection.

## Secret Handling Rules

- Never commit `.env` files with real values.
- Never paste secrets into issue comments, support tickets, Sentry, analytics, or logs.
- Use separate secrets for local, staging, and production.
- Rotate secrets after accidental exposure.
- Store webhook secrets separately from API keys.
- Keep `NEXT_PUBLIC_*` values limited to values safe for browser exposure.
