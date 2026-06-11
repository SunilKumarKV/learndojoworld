# Environment Matrix

Use this matrix when configuring Vercel, Render, Neon, Upstash, Sentry, and payment providers.
Never commit production values.

| Variable                                | App  | Local Required | Production Required    | Example Placeholder                                  | Secret | Where Used                                               |
| --------------------------------------- | ---- | -------------- | ---------------------- | ---------------------------------------------------- | ------ | -------------------------------------------------------- |
| `NODE_ENV`                              | both | yes            | yes                    | `production`                                         | no     | Runtime behavior, logging, security posture              |
| `APP_NAME`                              | api  | no             | no                     | `LearnDojoWorld`                                     | no     | App metadata                                             |
| `API_PORT`                              | api  | yes            | host-dependent         | `4000`                                               | no     | NestJS listen port                                       |
| `WEB_ORIGIN`                            | api  | yes            | yes                    | `https://learndojoworld.com`                         | no     | CORS allowlist, checkout redirects                       |
| `NEXT_PUBLIC_API_URL`                   | web  | yes            | yes                    | `https://api.learndojoworld.com/api/v1`              | no     | Web API client, Next CSP                                 |
| `DATABASE_URL`                          | api  | yes            | yes                    | `postgresql://USER:PASSWORD@HOST/DB?sslmode=require` | yes    | Prisma/Postgres                                          |
| `REDIS_URL`                             | api  | yes            | yes                    | `redis://default:PASSWORD@HOST:6379`                 | yes    | Current env validation, future distributed rate limiting |
| `JWT_SECRET`                            | api  | yes            | yes                    | `long-random-access-token-secret`                    | yes    | Access token signing                                     |
| `JWT_REFRESH_SECRET`                    | api  | yes            | yes                    | `long-random-refresh-token-secret`                   | yes    | Refresh token signing                                    |
| `AI_PRIMARY_PROVIDER`                   | api  | yes            | yes                    | `gemini`                                             | no     | AI provider router                                       |
| `AI_FALLBACK_PROVIDER`                  | api  | no             | recommended            | `openai`                                             | no     | AI provider router                                       |
| `OPENAI_API_KEY`                        | api  | if OpenAI used | if OpenAI used         | `sk-...`                                             | yes    | OpenAI provider                                          |
| `OPENAI_MODEL`                          | api  | no             | if OpenAI used         | `gpt-4o-mini`                                        | no     | OpenAI provider                                          |
| `GEMINI_API_KEY`                        | api  | if Gemini used | if Gemini used         | `AIza...`                                            | yes    | Gemini provider                                          |
| `GEMINI_MODEL`                          | api  | no             | if Gemini used         | `gemini-1.5-flash`                                   | no     | Gemini provider                                          |
| `STRIPE_SECRET_KEY`                     | api  | no             | if Stripe enabled      | `sk_live_...`                                        | yes    | Stripe checkout                                          |
| `STRIPE_WEBHOOK_SECRET`                 | api  | no             | if Stripe enabled      | `whsec_...`                                          | yes    | Stripe webhook verification                              |
| `RAZORPAY_KEY_ID`                       | api  | no             | if Razorpay enabled    | `rzp_live_...`                                       | yes    | Razorpay checkout                                        |
| `RAZORPAY_KEY_SECRET`                   | api  | no             | if Razorpay enabled    | `razorpay-secret`                                    | yes    | Razorpay checkout                                        |
| `RAZORPAY_WEBHOOK_SECRET`               | api  | no             | if Razorpay enabled    | `razorpay-webhook-secret`                            | yes    | Razorpay webhook verification                            |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID`           | web  | no             | if Razorpay UI enabled | `rzp_live_...`                                       | no     | Browser checkout                                         |
| `SENTRY_DSN`                            | api  | no             | recommended            | `https://...@sentry.io/...`                          | yes    | API Sentry                                               |
| `SENTRY_ENVIRONMENT`                    | api  | no             | recommended            | `production`                                         | no     | API Sentry environment                                   |
| `SENTRY_TRACES_SAMPLE_RATE`             | api  | no             | no                     | `0.05`                                               | no     | API Sentry tracing                                       |
| `NEXT_PUBLIC_SENTRY_DSN`                | web  | no             | recommended            | `https://...@sentry.io/...`                          | no     | Web Sentry                                               |
| `NEXT_PUBLIC_SENTRY_ENVIRONMENT`        | web  | no             | recommended            | `production`                                         | no     | Web Sentry environment                                   |
| `NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE` | web  | no             | no                     | `0.05`                                               | no     | Web Sentry tracing                                       |
| `LOG_LEVEL`                             | api  | no             | recommended            | `info`                                               | no     | API structured logging                                   |

## Provider Placement

- Vercel web: only `NEXT_PUBLIC_*` values.
- Render API: all API secrets and private runtime values.
- Neon: `DATABASE_URL` source.
- Upstash: `REDIS_URL` source.
- Sentry: DSNs and environment values.
- Stripe/Razorpay dashboards: webhook endpoint URLs and webhook signing secrets.

## Secret Rules

- Do not place private API keys in Vercel public variables.
- Do not expose `DATABASE_URL`, `JWT_SECRET`, payment secrets, or provider API keys to the browser.
- Rotate any secret that appears in logs, screenshots, tickets, or chat.
- Use separate local, staging, and production values.
