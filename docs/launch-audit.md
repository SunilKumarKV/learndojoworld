# LearnDojoWorld Global Launch Readiness Audit

Audit branch: `audit/global-launch-readiness`  
Audit date: 2026-06-05  
Role lens: Founder QA, CTO, Principal Engineer, Security Lead, SRE Lead

This audit is based on the actual repository state. No production code was modified.

## 1. Executive Summary

LearnDojoWorld has a broad and impressive product surface: auth, learner workflows, course engine,
AI tutor, creator studio, course builder, admin moderation, payments, subscriptions, creator
revenue, SEO, referral growth, observability, and security hardening. The codebase is coherent for
an early startup and the required local quality gates pass.

However, the product is not ready for public launch, and it is not ready for a monetized beta until
the critical issues below are fixed. The biggest risks are paid course content exposure through the
public course API, founder analytics exposed to any authenticated user, referral rewards being marked
`GRANTED` without actually granting the reward, and production controls that are single-instance or
manual-only.

The repo is much closer to a controlled internal alpha than a public global launch.

## 2. Launch Readiness Score

Overall launch readiness score: **58 / 100**

This score reflects a strong product foundation but important gaps in access control, operational
maturity, payment/webhook robustness, admin scalability, tests, and production launch discipline.

## 3. Category Scores

| Category        | Score | Notes                                                                                                        |
| --------------- | ----: | ------------------------------------------------------------------------------------------------------------ |
| Security        |    58 | Good Helmet/CORS/rate-limit foundation, but paid content and analytics exposure are launch blockers.         |
| Reliability     |    60 | Build passes and readiness exists; webhook/idempotency and no tests hold it back.                            |
| Scalability     |    45 | Many admin/public queries are unbounded; throttling is in-memory.                                            |
| Performance     |    55 | Acceptable for small beta; public course detail and admin queries can overfetch heavily.                     |
| Observability   |    72 | Sentry/logging/health/readiness are well-founded, but alerting/runbooks are not complete.                    |
| Monetization    |    52 | Checkout/webhook foundation exists; paid content protection and fulfillment gaps block launch.               |
| Growth          |    62 | SEO/referral foundations exist; referral fulfillment is intentionally deferred.                              |
| Maintainability |    68 | Clear modules and strict TypeScript; lack of tests and some duplicate API-client patterns reduce confidence. |

## 4. Specific Answers

1. **Is referral reward fulfillment actually broken or only intentionally deferred?**  
   It is intentionally deferred in code, but product-wise it is broken if exposed to users. Admin
   `grantReward` marks rewards `GRANTED` while explicitly not activating the subscription.

2. **Is webhook idempotency implemented strongly enough?**  
   Partially. Payment status checks, enrollment upsert, and creator earning upsert help, but there is
   no provider event ledger, no Stripe timestamp tolerance, no replay protection by event id, and
   concurrent duplicate webhooks can still produce fragile behavior.

3. **Are AI usage limits sufficient for beta?**  
   Sufficient for a small controlled beta, not enough for public launch. Limits are message-count
   based, aggregate after provider success, and are vulnerable to concurrent overrun.

4. **Are admin queries paginated or unbounded?**  
   Several admin queries are unbounded, including pending courses, payout requests, referral events,
   referral rewards, and audit logs per course.

5. **Are creator payout flows safe enough for beta?**  
   Safe only if treated as internal/manual bookkeeping. There is no external payout execution, no KYC,
   no tax/invoice workflow, no payout paid-state transition, and payout profile validation is minimal.

6. **Are Sentry/logging/health/readiness correctly implemented?**  
   Mostly yes. Sentry initializes only when DSN exists, logs are structured/redacted, and readiness
   checks DB connectivity. Production alerting and incident runbooks are still missing.

7. **Are rate limits production-safe or only single-instance safe?**  
   Only single-instance safe. The throttler uses in-memory storage, so limits reset per instance and
   are not global behind multiple API replicas.

8. **Are there any public-launch blockers?**  
   Yes. See critical findings: paid content leakage, analytics access, referral reward fulfillment,
   and missing production-grade monetization/idempotency controls.

9. **Is the product beta-ready?**  
   **NO-GO** for monetized/user-facing beta until critical blockers are fixed. A very small internal
   alpha is acceptable.

10. **Is the product public-launch-ready?**  
    **NO-GO**.

## 5. CRITICAL Findings

### C1. Public course detail API exposes full lesson content

- **Severity:** Critical
- **Affected files/modules:** `apps/api/src/modules/courses/courses.service.ts`,
  `apps/web/src/services/courses.api.ts`, public course route `/course/[slug]`
- **Risk:** Paid or non-preview lesson content can be delivered to unauthenticated/public users
  through `GET /api/v1/courses/:slug`, bypassing enrollment/payment access controls.
- **Evidence from repo:** `getCourseBySlug` includes `modules.lessons` without a restricted select
  and returns `...course`. The web `CourseDetail` type includes `lessons[].content`.
- **Recommended fix:** Split public course detail from learner lesson access. Public course detail
  should return only curriculum metadata: lesson id/title/type/order/duration/isPreview. Never return
  `content`, `videoUrl`, or protected lesson material unless the caller is enrolled or the lesson is
  explicitly preview.

### C2. Founder analytics endpoint is available to any authenticated user

- **Severity:** Critical
- **Affected files/modules:** `apps/api/src/modules/analytics/analytics.controller.ts`
- **Risk:** Any logged-in learner can access platform-wide founder metrics such as total users,
  enrollments, lessons completed, quiz attempts, and active-user counts.
- **Evidence from repo:** `GET /api/v1/analytics/founder` uses only `JwtAuthGuard`; it does not use
  `RolesGuard` or `@Roles(ADMIN, SUPER_ADMIN)`.
- **Recommended fix:** Protect founder analytics with admin RBAC or move it under `/admin`. Add a
  regression test that learner tokens receive `403`.

### C3. Referral rewards can be marked granted without granting anything

- **Severity:** Critical
- **Affected files/modules:** `apps/api/src/modules/admin/admin.service.ts`,
  `apps/api/src/modules/referrals/referrals.service.ts`
- **Risk:** Users can see rewards as `GRANTED` while no Pro/Premium entitlement is created. This is a
  trust and support risk and breaks growth-loop economics.
- **Evidence from repo:** `grantReward` updates status to `GRANTED` and contains the comment
  `DO NOT activate the subscription yet`, plus audit metadata saying subscription activation is
  pending future implementation.
- **Recommended fix:** Until fulfillment exists, do not expose grant as a success action. Use
  `APPROVED`/`PENDING_FULFILLMENT`, or implement a real entitlement/subscription credit transaction
  with idempotency and audit trail.

### C4. Paid monetization is not production-safe until webhook/event idempotency is hardened

- **Severity:** Critical
- **Affected files/modules:** `apps/api/src/modules/payments/payments.service.ts`,
  `apps/api/src/modules/payments/webhooks.controller.ts`, `prisma/schema.prisma`
- **Risk:** Real payment providers retry and replay events. Current code signs raw body and has some
  idempotent mutations, but it does not persist provider event ids, does not enforce Stripe timestamp
  tolerance, and does not record processed webhook state. That is not strong enough for public money
  movement.
- **Evidence from repo:** Webhook handlers parse event type and mutate payments directly. There is no
  `WebhookEvent`/`PaymentEvent` table and no provider event id uniqueness.
- **Recommended fix:** Add a webhook event ledger keyed by provider and provider event id, verify
  Stripe timestamp tolerance, process state transitions in a transaction, and safely ignore already
  processed events.

## 6. HIGH Findings

### H1. JWT guard trusts token claims and does not re-check user active/suspended state

- **Severity:** High
- **Affected files/modules:** `apps/api/src/modules/auth/guards/jwt-auth.guard.ts`
- **Risk:** A suspended or deactivated user can continue using a still-valid access token until it
  expires. If a role changes, old role claims are also trusted until expiry.
- **Evidence from repo:** `JwtAuthGuard` verifies JWT and sets `request.user` from token payload only;
  it does not query `User` for `isActive`, `isSuspended`, or current role.
- **Recommended fix:** Add a user status lookup or short-lived token revocation strategy for sensitive
  routes. At minimum, check current user status in `JwtAuthGuard`.

### H2. AI tutor can fetch lesson/course context by arbitrary ids without enrollment checks

- **Severity:** High
- **Affected files/modules:** `apps/api/src/modules/ai/ai.service.ts`
- **Risk:** An authenticated user can provide `lessonId` or `courseId` for content they do not own or
  have not enrolled in. The AI context builder fetches lesson content and may reveal it through the AI
  answer.
- **Evidence from repo:** `buildContextMessages` uses `prisma.lesson.findUnique` and includes
  `lesson.content` in a system prompt without calling the learning access check.
- **Recommended fix:** Reuse lesson/course enrollment checks before using lesson/course context in AI.
  Allow only public preview lesson context for non-enrolled users.

### H3. Admin list queries are unbounded

- **Severity:** High
- **Affected files/modules:** `apps/api/src/modules/admin/admin.service.ts`
- **Risk:** Admin pages can become slow or fail under real data volume, and large exports can expose
  too much PII in a single response.
- **Evidence from repo:** `getPendingCourses`, `getPayoutRequests`, `getReferrals`, and course
  `auditLogs` use `findMany` with no `take`/pagination.
- **Recommended fix:** Add cursor or page-based pagination, filters, and bounded default limits for
  all admin lists.

### H4. Rate limiting is in-memory and not production-global

- **Severity:** High
- **Affected files/modules:** `apps/api/src/app.module.ts`, `docs/security-hardening.md`
- **Risk:** Limits are per process. Horizontal scaling allows attackers to multiply allowed login,
  register, and AI-chat attempts by instance count.
- **Evidence from repo:** `ThrottlerModule.forRoot` uses default storage only.
- **Recommended fix:** Use Redis or another shared throttler storage before multi-instance beta.

### H5. No automated tests are present

- **Severity:** High
- **Affected files/modules:** Whole repo, CI workflows
- **Risk:** Launch-critical paths rely on manual smoke testing. Payments, auth, RBAC, AI limits,
  creator ownership, and referral rewards can regress silently.
- **Evidence from repo:** No `*.spec.ts`, `*.test.ts`, or e2e test files were found. CI runs format,
  lint, typecheck, and build only.
- **Recommended fix:** Add API integration tests and a minimal Playwright smoke suite for auth,
  enrollment, payment webhook, AI limit, admin RBAC, creator ownership, and public SEO pages.

### H6. Frontend stores access and refresh tokens in localStorage

- **Severity:** High
- **Affected files/modules:** `apps/web/src/services/auth.api.ts`,
  `apps/web/src/services/api-client.ts`
- **Risk:** Any XSS can steal long-lived refresh tokens from localStorage. The current CSP still uses
  `unsafe-inline`/`unsafe-eval` for Next compatibility, increasing the importance of token storage.
- **Evidence from repo:** `setStoredTokens` writes `ldw_auth_tokens` to `window.localStorage`.
- **Recommended fix:** Move refresh tokens to secure, HTTP-only, same-site cookies and keep access
  tokens short-lived.

### H7. Memory/quiz endpoints do not enforce course enrollment or flashcard ownership consistently

- **Severity:** High
- **Affected files/modules:** `apps/api/src/modules/memory/memory.controller.ts`,
  `apps/api/src/modules/memory/memory.service.ts`
- **Risk:** Authenticated users can fetch quizzes globally and review arbitrary flashcards by id.
- **Evidence from repo:** `getQuiz`, `submitAttempt`, and `reviewFlashcard` do not check enrollment
  or ownership before returning/creating user-specific records.
- **Recommended fix:** Require enrollment for course-linked quizzes and require ownership/public scope
  for flashcard review.

## 7. MEDIUM Findings

### M1. Public course catalog is unpaginated

- **Severity:** Medium
- **Affected files/modules:** `apps/api/src/modules/courses/courses.service.ts`
- **Risk:** Explore/catalog can overfetch as published course volume grows.
- **Evidence from repo:** `getCourses` uses `findMany` with search filters but no pagination.
- **Recommended fix:** Add pagination and sane defaults to public catalog APIs.

### M2. AI usage limits are message-based and race-prone

- **Severity:** Medium
- **Affected files/modules:** `apps/api/src/modules/billing/billing.service.ts`,
  `apps/api/src/modules/ai/ai.service.ts`
- **Risk:** Concurrent requests can pass `assertAIUsageAvailable` before usage is consumed, exceeding
  daily/monthly limits. Token/cost caps are not enforced.
- **Evidence from repo:** Usage is aggregated before provider call and consumed after successful
  response.
- **Recommended fix:** Add atomic reservation/ledger update or per-user lock, plus token and cost
  ceilings per plan.

### M3. Stripe signature verification lacks timestamp tolerance

- **Severity:** Medium
- **Affected files/modules:** `apps/api/src/modules/payments/payments.service.ts`
- **Risk:** Captured signed payloads may be replayed if the provider event was not otherwise tracked.
- **Evidence from repo:** Signature parses `t` and `v1` but does not compare timestamp age.
- **Recommended fix:** Reject Stripe webhook timestamps outside a small tolerance window.

### M4. Creator payout flow is bookkeeping-only

- **Severity:** Medium
- **Affected files/modules:** `apps/api/src/modules/creators/creator-revenue.service.ts`,
  `apps/api/src/modules/admin/admin.service.ts`
- **Risk:** Creators may believe payout approval means money is moving. There is no payout provider,
  KYC, tax, invoice, or paid-state transition.
- **Evidence from repo:** Admin can approve/reject payout requests, but no service marks payouts
  `PAID` or executes a transfer.
- **Recommended fix:** Keep payout UI labeled as manual review only, or implement full payout
  provider integration and compliance flow before public creator monetization.

### M5. DTO validation is incomplete on several raw-body/query endpoints

- **Severity:** Medium
- **Affected files/modules:** Analytics event body, progress watch DTO, memory flashcard body,
  query `limit` handlers.
- **Risk:** Invalid input can cause runtime errors, resource overuse, or inconsistent data.
- **Evidence from repo:** `WatchLessonDto` is an undecorated class; memory controller accepts typed
  object literals; activity/review limits are parsed with `Number(...)`.
- **Recommended fix:** Add DTO classes with validators and max bounds for all request bodies/queries.

### M6. CI does not validate migrations against Postgres

- **Severity:** Medium
- **Affected files/modules:** `.github/workflows/ci.yml`, Prisma migrations
- **Risk:** Build can pass while migration application fails on a fresh database.
- **Evidence from repo:** CI runs `prisma generate` but not `prisma migrate deploy`/status against a
  Postgres service.
- **Recommended fix:** Add Postgres service and run migration validation in CI.

### M7. Observability lacks alerting/runbook wiring

- **Severity:** Medium
- **Affected files/modules:** `docs/observability.md`, API health/readiness modules
- **Risk:** Health endpoints exist, but production operations still need uptime checks, alert routes,
  dashboards, and incident ownership.
- **Evidence from repo:** Docs explain env and manual Sentry testing but no alerting thresholds or
  SLOs.
- **Recommended fix:** Add uptime monitor, alert policy, runbooks, and SLO/error-budget docs.

### M8. CSP is baseline, not fully hardened

- **Severity:** Medium
- **Affected files/modules:** `apps/web/next.config.ts`, `apps/api/src/main.ts`
- **Risk:** `unsafe-inline` and `unsafe-eval` remain enabled on the web for framework compatibility.
- **Evidence from repo:** Next config CSP includes both directives.
- **Recommended fix:** Move toward nonce/hash-based scripts and tighten CSP as the app stabilizes.

## 8. LOW Findings

### L1. Referral code collision handling is weak but acceptable at small scale

- **Severity:** Low
- **Affected files/modules:** `apps/api/src/modules/referrals/referrals.service.ts`
- **Risk:** The fallback appends `X` once after a collision; repeated collision handling is not robust.
- **Evidence from repo:** `getMe` catches create failure and retries with `generateUniqueCode() + "X"`.
- **Recommended fix:** Use a loop with bounded retries and unique-code checking.

### L2. Public creator/course SEO exists but depends on API availability at render time

- **Severity:** Low
- **Affected files/modules:** `apps/web/src/lib/seo/server-data.ts`, sitemap route
- **Risk:** API downtime or deploy ordering can degrade metadata/sitemap completeness.
- **Evidence from repo:** server data fetch returns `null` on API errors.
- **Recommended fix:** Add resilient caching/revalidation and deployment sequencing.

### L3. Multiple API client implementations exist

- **Severity:** Low
- **Affected files/modules:** `apps/web/src/services/api-client.ts`, `auth.api.ts`,
  `onboarding.api.ts`
- **Risk:** Auth/error handling can drift across clients.
- **Evidence from repo:** Auth/onboarding define their own request helpers in addition to centralized
  `api-client.ts`.
- **Recommended fix:** Consolidate around one API client with auth refresh hooks.

## 9. Launch Blockers

- Public course detail leaks full lesson content.
- Founder analytics endpoint is not admin-protected.
- Referral reward `GRANTED` does not fulfill the reward.
- Payment webhook idempotency/replay protection is not production-grade.
- No automated tests for launch-critical flows.
- Rate limiting is not shared across instances.

## 10. Non-Blockers

- Sentry/logging/health/readiness foundation is acceptable for beta once alerts are configured.
- Creator-owned course builder checks are generally sound.
- Admin routes are broadly protected by `ADMIN`/`SUPER_ADMIN` roles.
- Payment signature verification exists and raw body is preserved.
- AI usage limits are acceptable for a small closed beta after access-control issues are fixed.
- SEO/public pages and sitemap/robots are present.

## 11. Beta Launch Recommendation

**NO-GO** for monetized or public beta.

Recommended gate: fix all CRITICAL findings and add tests around them. After that, a limited,
invite-only beta can proceed with manual payout operations and explicit referral limitations.

## 12. Public Launch Recommendation

**NO-GO**.

Public launch requires critical fixes plus high-priority security, scalability, testing, and
production operations work.

## 13. Top 10 Priorities

1. Remove protected lesson content from public course detail responses.
2. Protect founder analytics with admin RBAC.
3. Fix referral reward fulfillment or stop marking unfulfilled rewards as `GRANTED`.
4. Add webhook event ledger/idempotency and Stripe timestamp tolerance.
5. Add integration/e2e tests for auth, RBAC, payments, AI limits, creator ownership, and referrals.
6. Move rate limiting to Redis/shared storage.
7. Re-check user active/suspended/current role in protected auth flows.
8. Enforce AI lesson/course context access by enrollment/preview rules.
9. Paginate admin and public list endpoints.
10. Replace localStorage refresh token storage with HTTP-only cookie session design.

## 14. Recommended 30-Day Roadmap

- Week 1: Fix public content leak, analytics RBAC, referral grant semantics, and JWT active-user
  checks.
- Week 1: Add regression tests for the above blockers.
- Week 2: Add webhook event ledger, timestamp tolerance, and duplicate-event tests.
- Week 2: Add admin/public pagination and bounded query parameters.
- Week 3: Add Redis-backed throttling and document deployment topology.
- Week 3: Add CI Postgres migration validation.
- Week 4: Add Playwright smoke suite and production runbooks for Sentry/health/readiness.
- Week 4: Re-audit paid course access, AI context access, and payout wording before beta.

## 15. Recommended 90-Day Roadmap

- Implement production-grade sessions with HTTP-only refresh cookies.
- Add payout provider integration or keep payouts clearly manual with compliance controls.
- Add audit log viewer and security event review workflow.
- Add cost controls for AI: token ceilings, provider budget alerts, and per-plan concurrency limits.
- Add analytics privacy review and least-privilege dashboards.
- Add load tests for catalog, course detail, AI chat, checkout, and admin lists.
- Add backup/restore drills, database migration rollback playbooks, and incident response docs.
- Add dependency/container scanning and deployment approval gates.
- Add structured product analytics with privacy-safe aggregation.
- Re-run full launch audit after beta telemetry.

## 16. Files / Modules Reviewed

- `docs/AI_RULES.md`
- `docs/security-hardening.md`
- `docs/observability.md`
- `package.json`, `apps/api/package.json`, `apps/web/package.json`
- `.github/workflows/ci.yml`
- `.github/workflows/codeql.yml`
- `.github/workflows/audit.yml`
- `.github/workflows/secret-scan.yml`
- `.github/workflows/dependency-review.yml`
- `prisma/schema.prisma`
- `prisma/migrations/*/migration.sql`
- API modules: auth, admin, analytics, billing, payments, creators, referrals, AI, courses,
  learning, memory, health, observability
- Web modules: route guards, API clients, course detail, creator profile, sitemap, robots, error
  boundary, Next security headers

## 17. Commands Run With Results

- `pnpm format:check` — passed.
- `pnpm lint` — passed.
- `pnpm typecheck` — passed.
- `pnpm build` — passed.

Additional inspection commands used:

- `git status --short`
- `git branch --show-current`
- `sed`/`nl` reads of key API, web, Prisma, docs, and workflow files
- `rg` searches for TODO/deferred logic, tests, token storage, and risk markers
- `find` over migrations, workflows, controllers, DTOs, and test files

No automated tests were found in the repository.

## 18. Final Founder Verdict

LearnDojoWorld has enough product breadth and architectural foundation to justify continued
investment and a focused launch-readiness sprint. It is not currently safe to present as
global-launch-ready.

Founder verdict: **NO-GO for beta, NO-GO for public launch** until the critical blockers are fixed.
After the critical fixes and regression tests land, the product can be reconsidered for a small,
invite-only beta with manual operations and clear creator/payment/referral limitations.
