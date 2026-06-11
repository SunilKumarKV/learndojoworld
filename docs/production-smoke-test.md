# Production Smoke Test Checklist

Run this after every production deployment and after rollback. Use real production URLs, production
health checks, and provider test-mode webhook tools where applicable. Do not fake payment or AI
success in production code.

## Public Web

- [ ] Homepage loads.
- [ ] `/beta` loads.
- [ ] Beta waitlist submit works with a new email.
- [ ] Duplicate waitlist email is blocked cleanly.
- [ ] `/pricing` loads.
- [ ] `/explore` loads.
- [ ] Public course detail loads and does not expose full lesson content.
- [ ] Public creator page loads if a creator exists.

## Auth and Learner

- [ ] Signup works.
- [ ] Login works.
- [ ] Onboarding can be completed.
- [ ] Learner dashboard loads.
- [ ] `/beta/welcome` shows beta status and activation checklist.
- [ ] Free course enrollment works.
- [ ] Enrolled learner can open lesson content.
- [ ] Non-enrolled learner cannot open protected paid lesson content.

## Payments and Webhooks

- [ ] Paid checkout creates a pending payment.
- [ ] Frontend success/cancel URL does not unlock access.
- [ ] Signed Stripe webhook in provider test mode marks payment success.
- [ ] Replayed signed Stripe webhook does not duplicate enrollment or creator earning.
- [ ] Unsigned Stripe webhook is rejected.
- [ ] Unsigned Razorpay webhook is rejected.
- [ ] Payment history shows the payment state correctly.

## AI

- [ ] `/ai` loads.
- [ ] AI chat under plan limit returns a real provider response.
- [ ] AI usage increments after successful response.
- [ ] AI limit returns clean `402` upgrade-required response.
- [ ] AI cannot expose paid lesson context to a non-enrolled learner.

## Creator and Admin

- [ ] Creator apply flow works.
- [ ] Creator dashboard loads.
- [ ] Creator can create a draft course.
- [ ] Creator can submit course for review.
- [ ] Admin dashboard loads.
- [ ] Admin moderation queue loads.
- [ ] Admin can approve/reject a test course.
- [ ] `/admin/beta` loads.
- [ ] `/admin/beta/first-100` loads.
- [ ] Admin can invite/reject a waitlist entry.

## Referrals and Support

- [ ] Referral apply works.
- [ ] Self-referral is blocked.
- [ ] Duplicate referral is blocked.
- [ ] Feedback submission works.
- [ ] Support request submission works.
- [ ] Admin can review feedback and support requests.

## Observability and Health

- [ ] `GET /api/v1/health` returns healthy.
- [ ] `GET /api/v1/health/readiness` returns ready.
- [ ] API logs show structured request entries without secrets.
- [ ] Sentry receives a controlled test event if configured.
- [ ] Production error responses do not expose stack traces.
- [ ] Stripe/Razorpay dashboards show webhook delivery success.

## Final Decision

- [ ] No critical Sentry events in the first 30 minutes.
- [ ] No unexpected 5xx spike.
- [ ] No payment unlock failures.
- [ ] No AI provider outage under limit.
- [ ] Support and feedback intake still works.
