# Security Hardening Foundation

LearnDojoWorld is a real startup product. Security controls must protect users, creators,
payments, AI usage, admin actions, and launch readiness without faking success or bypassing checks.

## Rate Limiting Policy

- Global API default: 120 requests per minute per client.
- `POST /api/v1/auth/login`: 5 requests per minute.
- `POST /api/v1/auth/register`: 5 requests per minute.
- `POST /api/v1/ai/chat`: 30 requests per minute. Billing AI limits still run server-side and remain the source of truth.
- Payment webhook endpoints are excluded from application throttling so valid Stripe/Razorpay retries are not blocked. Signature verification remains mandatory before any mutation.
- If abuse increases, add distributed throttler storage such as Redis before multi-instance production rollout.

## CORS Policy

- API CORS uses an explicit `WEB_ORIGIN` allowlist.
- `WEB_ORIGIN` supports comma-separated origins for staging/production.
- Wildcard origins are filtered out and must not be used in production.
- Local development safely allows `http://localhost:3000` and `http://127.0.0.1:3000`.
- Invalid origins are logged only in non-production and without request bodies, tokens, cookies, or secrets.

## Security Headers

API responses use Helmet with:

- `X-Content-Type-Options`
- frame denial / `frame-ancestors 'none'`
- `Referrer-Policy`
- `Permissions-Policy`
- baseline CSP
- disabled `X-Powered-By`

Next.js responses include matching production-safe headers from `next.config.ts`.

## Auth Protections

- JWT guard remains required for protected learner, creator, admin, billing, payment, and AI routes.
- Login returns a generic invalid-credentials error for wrong credentials, inactive users, and suspended users.
- Register/login DTOs are length-limited.
- There is no API forgot-password endpoint yet. When added, it must return a generic response and never reveal whether an email exists.
- Tokens must never be logged, exposed in URLs, or sent to Sentry as context.

## Admin Route Protection

- `/api/v1/admin/*` is protected by `JwtAuthGuard`, `RolesGuard`, and `ADMIN` / `SUPER_ADMIN` roles.
- Protected sensitive admin actions include course moderation, payout request decisions, and referral reward decisions.
- Sensitive admin actions write `auditLog` records with actor, action, entity, entity id, and safe metadata.

## Webhook Security

- Stripe webhooks require `stripe-signature`.
- Razorpay webhooks require `x-razorpay-signature`.
- Signatures are verified using the raw request body before any payment, enrollment, subscription, or earning mutation.
- Signed webhook events are recorded in the persistent `WebhookEvent` ledger with provider, event id, event type, status, optional payment link, and a SHA-256 hash of the raw body.
- The ledger has a unique provider/event-id constraint. Replayed events already marked `PROCESSED` or `IGNORED` return safe success without duplicate payment, enrollment, subscription, or creator earning mutations.
- Webhook processing updates payment status, paid enrollment, subscription activation, creator earning attribution, and the ledger status in one Prisma transaction.
- Failed webhook processing marks the ledger event `FAILED` with a truncated safe error message so provider retries can be investigated and retried safely.
- The ledger must not store webhook signatures, raw request bodies, card details, full payment objects, API keys, or other provider secrets.
- Unsigned or invalid webhooks are rejected.
- Frontend checkout success/cancel URLs never unlock courses or activate subscriptions.
- Local development may fall back to `JWT_SECRET` for webhook smoke testing only when provider webhook secrets are not configured. Production requires provider webhook secrets.

## Validation Policy

- Global validation uses whitelist, transformation, and non-whitelisted-field rejection.
- DTOs must include length, enum, UUID, URL, email, and numeric constraints wherever the field shape is known.
- Broad `any`, `ts-ignore`, and `eslint-disable` are not allowed without explicit approval.

## Secrets Policy

Never log or commit:

- passwords
- authorization headers
- cookies
- JWTs or refresh tokens
- API keys
- webhook signatures
- Sentry DSNs
- payment provider secrets
- database URLs with production credentials

## Security Smoke Checklist

- Login with valid credentials succeeds.
- Invalid login returns a safe generic error.
- Suspended/inactive users cannot login.
- Learner, creator, and admin dashboards remain protected and usable.
- AI chat works under billing limits.
- AI billing limits still return `402`.
- Paid checkout creates pending payment only.
- Signed Stripe webhook can mark payment success.
- Unsigned Stripe/Razorpay webhook is rejected.
- Referral flow still works.
- Public SEO pages still load.
- `/api/v1/health` works.
- `/api/v1/health/readiness` checks database readiness.
- Repeated login attempts trigger rate limiting.
- API and web responses include security headers.

## Next Security Work

- Add Redis-backed distributed rate limiting before horizontally scaling the API.
- Add CSRF protection if browser cookie auth is introduced.
- Add password reset backend with generic responses and email-rate limiting.
- Add central audit log viewer for security operations.
- Add upload scanning and MIME validation when upload routes are introduced.
- Add dependency and container image scanning in deployment CI.
