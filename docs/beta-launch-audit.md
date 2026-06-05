# LearnDojoWorld Beta Launch Readiness Re-Audit

Audit branch: `audit/beta-launch-readiness`  
Audit date: 2026-06-05  
Role lens: Founder QA, CTO, Principal Engineer, Security Lead, SRE Lead

This is a re-audit after remediation of the previously identified launch blockers. Production code
was not modified as part of this audit document.

## 1. New Launch Score

**76 / 100**

LearnDojoWorld has moved from internal-alpha readiness toward a controlled beta. The largest
security and monetization blockers are now remediated and covered by the critical E2E suite.

The product is still not public-launch ready. Remaining risks are mostly scale and production
operations: unbounded admin queries, in-memory rate limiting, localStorage token storage, incomplete
browser E2E coverage, manual payout operations, and missing production alerting/runbooks.

## 2. Previous Launch Score

**58 / 100**

Source: historical `docs/launch-audit.md` from commit `082eff0`.

Previous recommendations were:

- Beta: **NO-GO**
- Public launch: **NO-GO**

## 3. Delta Improvements

Score delta: **+18 points**

Major improvements:

- Public course detail no longer exposes full lesson content.
- Lesson content access is enforced for enrolled learners, owning creators, and admins.
- AI lesson/course context now checks course-content authorization before loading protected content.
- Founder analytics now requires `ADMIN` or `SUPER_ADMIN`.
- JWT auth guard revalidates live user status and current role from the database.
- Payment webhooks now use a persistent `WebhookEvent` ledger with provider/event-id uniqueness.
- Webhook processing is transactional for payment status, enrollment, subscription activation, and creator earning mutation.
- Referral reward grant now fulfills actual temporary Pro access and blocks duplicate grant.
- Critical API E2E suite now covers auth, content gates, payment webhook replay, AI limits, referrals, admin RBAC, JWT role downgrade, and creator approval flow.
- CI includes a dedicated E2E job with a Postgres service.

## 4. Remaining Critical Issues

No remaining critical issues were found for a controlled beta.

Critical launch blockers from the previous audit are considered remediated based on code review and
passing E2E coverage.

## 5. Remaining High Issues

### H1. Admin list queries remain unbounded

- **Severity:** High
- **Affected files/modules:** `apps/api/src/modules/admin/admin.service.ts`
- **Risk:** Admin pages can degrade or fail with real data volume. Large responses may expose too much operational/PII data in one request.
- **Evidence:** `getPendingCourses`, `getPayoutRequests`, `getReferrals`, and course audit log reads still use `findMany` without pagination bounds.
- **Recommended fix:** Add cursor or page-based pagination, bounded default limits, filters, and response metadata for all admin list endpoints.

### H2. Rate limiting is single-instance only

- **Severity:** High
- **Affected files/modules:** `apps/api/src/app.module.ts`, `docs/security-hardening.md`
- **Risk:** Horizontal scaling makes brute-force and AI-abuse limits per-instance rather than global.
- **Evidence:** Nest throttler uses default in-memory storage. Security docs explicitly note Redis-backed throttling is future work.
- **Recommended fix:** Add Redis-backed throttler storage before multi-instance or public traffic.

### H3. Frontend token storage remains XSS-sensitive

- **Severity:** High
- **Affected files/modules:** `apps/web/src/services/auth.api.ts`, `apps/web/src/services/api-client.ts`
- **Risk:** Access and refresh tokens in localStorage can be stolen by XSS.
- **Evidence:** Existing frontend auth stores token material client-side. CSP still needs Next-compatible inline allowances.
- **Recommended fix:** Move refresh tokens to secure, HTTP-only, same-site cookies and keep access tokens short-lived in memory.

### H4. Browser E2E coverage is still missing

- **Severity:** High
- **Affected files/modules:** `tests/e2e/critical-flows.e2e.ts`, `docs/testing.md`
- **Risk:** API regressions are covered, but real route guards, rendering, browser storage, and user workflows can still regress.
- **Evidence:** The new suite is API-level only; docs explicitly note Playwright/browser coverage as a limitation.
- **Recommended fix:** Add Playwright smoke tests for auth, dashboard, course detail, lesson access, billing, creator, admin, and public SEO pages.

## 6. Remaining Medium Issues

### M1. Public catalog and some creator lists need pagination hardening

- **Severity:** Medium
- **Affected files/modules:** `apps/api/src/modules/courses/courses.service.ts`, creator/admin list endpoints
- **Risk:** Explore/catalog and list pages may overfetch as course volume grows.
- **Recommended fix:** Add pagination, ordering guarantees, and response metadata.

### M2. AI usage limits are adequate for beta but race-prone

- **Severity:** Medium
- **Affected files/modules:** `apps/api/src/modules/billing/billing.service.ts`, `apps/api/src/modules/ai/ai.service.ts`
- **Risk:** Concurrent requests can pass limit checks before usage is recorded. Limits are message-count based, not cost/token-reservation based.
- **Recommended fix:** Add atomic reservations or per-user locking plus daily/monthly token and spend caps.

### M3. Creator payout flow remains manual/bookkeeping-oriented

- **Severity:** Medium
- **Affected files/modules:** creator revenue and admin payout modules
- **Risk:** Creator earnings exist, but payout execution, KYC, tax, invoice, and paid-state operations are not production payout systems.
- **Recommended fix:** Keep payouts explicitly manual in beta or integrate a payout provider before broad creator monetization.

### M4. Webhook timestamp tolerance is still not explicit

- **Severity:** Medium
- **Affected files/modules:** `apps/api/src/modules/payments/payments.service.ts`
- **Risk:** Event-id ledger largely mitigates replay, but Stripe timestamp tolerance should still be enforced as defense in depth.
- **Recommended fix:** Reject Stripe webhook timestamps outside the provider-recommended tolerance window.

### M5. Production alerting and incident response are incomplete

- **Severity:** Medium
- **Affected files/modules:** `docs/observability.md`, deployment/ops docs
- **Risk:** Sentry, structured logging, and health checks exist, but alert routing, on-call ownership, SLOs, and incident runbooks are not complete.
- **Recommended fix:** Add alert thresholds, owner rotation, dashboards, and incident playbooks.

## 7. Remaining Low Issues

### L1. `docs/launch-audit.md` is not present on this branch

- **Severity:** Low
- **Risk:** Re-audits need historical context; this branch required looking into git history for the previous score.
- **Recommended fix:** Restore or preserve launch audit docs in mainline documentation.

### L2. Referral controller path includes duplicated version segment

- **Severity:** Low
- **Affected files/modules:** `apps/api/src/modules/referrals/referrals.controller.ts`
- **Risk:** Routes are mounted as `/api/v1/v1/referrals/*`, which is awkward and can confuse SDK/client documentation.
- **Recommended fix:** Normalize to `/api/v1/referrals/*` with compatibility redirects or client migration.

### L3. E2E runner starts API through watch mode

- **Severity:** Low
- **Affected files/modules:** `tests/e2e/critical-flows.e2e.ts`, `apps/api/package.json`
- **Risk:** Watch mode is slower and can introduce startup timing noise.
- **Recommended fix:** Add a non-watch API start command for E2E, such as build + `node dist/main.js` or a dedicated test bootstrap.

## 8. Beta Recommendation

**GO for controlled beta**

Conditions:

- Keep beta invite-limited.
- Monitor payment, AI, auth, and admin errors daily.
- Keep creator payouts clearly manual/internal.
- Do not run multi-instance production without distributed rate limiting.
- Do not aggressively market paid creator monetization until payout operations are tightened.

## 9. Public Launch Recommendation

**NO-GO for public/global launch**

Public launch still needs production-scale controls: distributed throttling, paginated admin
operations, browser E2E, token storage hardening, operational alerting/runbooks, payout compliance,
and broader performance testing.

## 10. Top 10 Priorities

1. Add pagination and filters to all admin list endpoints.
2. Move rate limiting to Redis/shared storage.
3. Move refresh tokens to secure HTTP-only cookies.
4. Add Playwright browser E2E smoke tests.
5. Add Stripe timestamp tolerance and Razorpay signed replay E2E coverage.
6. Add AI usage reservation or concurrency-safe limit enforcement.
7. Add production dashboards, SLOs, alerting, and incident runbooks.
8. Tighten payout operations, creator terms, tax/KYC posture, and paid-state lifecycle.
9. Paginate public catalog/explore and creator lists.
10. Normalize referral API route versioning.

## 11. Next 30-Day Roadmap

- Week 1: Admin pagination, referral route normalization plan, Stripe timestamp tolerance.
- Week 2: Redis-backed throttling and deployment smoke tests.
- Week 3: Playwright browser E2E for auth, learner, creator, admin, billing, and public routes.
- Week 4: Observability dashboards, alert rules, incident runbook, and beta launch checklist rehearsal.

## 12. Founder Verdict

LearnDojoWorld is now credible for a controlled beta. The previous launch blockers were real, and the
remediation meaningfully changes the risk profile: paid content is protected, AI context is gated,
founder analytics is admin-only, webhooks are idempotent, referral grants fulfill actual benefits,
JWTs revalidate live user state, and the critical paths are now covered by E2E.

This is not yet public-launch mature. The next phase should focus less on product surface and more on
operational discipline: pagination, distributed abuse controls, browser E2E, token hardening,
production alerting, and payout compliance.

Final recommendation:

- **Beta:** GO
- **Public launch:** NO-GO

## Verification Summary

Reviewed:

- `docs/security-hardening.md`
- `docs/testing.md`
- `docs/observability.md`
- historical `docs/launch-audit.md` from commit `082eff0`
- `apps/api/src/modules/auth/guards/jwt-auth.guard.ts`
- `apps/api/src/modules/analytics/analytics.controller.ts`
- `apps/api/src/modules/learning/learning.service.ts`
- `apps/api/src/modules/ai/ai.service.ts`
- `apps/api/src/modules/payments/payments.service.ts`
- `apps/api/src/modules/admin/admin.service.ts`
- `prisma/schema.prisma`
- `.github/workflows/ci.yml`
- `tests/e2e/critical-flows.e2e.ts`

Commands run:

- `pnpm format:check` - passed
- `pnpm lint` - passed
- `pnpm typecheck` - passed
- `pnpm build` - passed
- `pnpm e2e` - first run failed while build was running in parallel because API did not become healthy on port 4101 before timeout; rerun by itself passed
