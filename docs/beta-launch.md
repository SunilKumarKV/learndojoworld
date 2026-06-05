# LearnDojoWorld Controlled Beta Launch

## Purpose

This controlled beta prepares LearnDojoWorld for real-world use with a small, observable cohort before public launch. The beta is designed to validate onboarding, learning engagement, AI tutor usefulness, creator readiness, support load, and monetization readiness without exposing the platform to unrestricted public traffic.

## Beta Scope

- Target users: 50 invited learners
- Target creators: 10 creators
- Target published courses: 25 courses
- Target learning engagement: 1000 completed lessons
- Target AI usage: 50 AI sessions per day

## Launch Criteria

Beta can begin when:

- Auth, learner dashboard, course catalog, lesson player, creator dashboard, admin dashboard, AI tutor, payments, subscriptions, and referral flows pass smoke checks.
- `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm build`, and `pnpm e2e` pass.
- Health and readiness endpoints are reachable.
- Sentry and structured logs are configured in production.
- Stripe and Razorpay webhooks reject unsigned requests and are idempotent.
- Admin users can review feedback, support requests, beta access, and operational metrics.

## Beta Access

Admin users manage beta access from `/admin/beta`.

Supported states:

- `INVITED`: user is approved for beta entry but has not accepted or linked their account.
- `ACCEPTED`: user is part of the controlled beta cohort.
- `REVOKED`: user access has been revoked for the beta cohort.

Beta access records store safe operational metadata only. They do not store secrets or sensitive payment data.

## Feedback Operations

Users can submit in-app feedback from the beta banner.

Feedback types:

- Bug
- Feature request
- Confusion
- General feedback

Admin review statuses:

- `OPEN`
- `REVIEWED`
- `CLOSED`

Product and engineering should review open feedback daily during the first beta week and at least three times per week after that.

## Support Operations

Users can report issues from the beta banner.

Support statuses:

- `OPEN`
- `IN_PROGRESS`
- `RESOLVED`
- `CLOSED`

Support requests should include the page path when possible so the team can reproduce issues quickly.

## Metrics Tracked

The beta dashboard tracks:

- Signup conversion: accepted beta users compared with total signups.
- Onboarding completion: profiles that completed onboarding.
- First course enrollment: distinct users with at least one enrollment.
- First lesson completion: distinct users with at least one completed lesson.
- First AI usage: distinct users with recorded AI usage.
- Creator application rate: creator profiles compared with total signups.
- AI usage: messages and tokens used today.
- Enrollments and creator applications.
- Feedback and support volume.

## Daily Beta Review

Review each day:

- Health/readiness status
- Error and latency trends
- Open feedback
- Open support tickets
- AI cost and limit behavior
- Payment webhook failures
- Enrollment and lesson completion trend
- Creator application quality

## Security Constraints

Do not weaken:

- JWT live user revalidation
- RBAC and admin route guards
- Payment webhook signatures
- Webhook idempotency ledger
- AI usage limits
- Course content access checks
- CORS and rate limiting

## Exit Criteria

Move from controlled beta toward public launch only after:

- No critical security or monetization blockers remain.
- Support response load is manageable.
- AI costs are within expected bounds.
- Payment and enrollment unlocks are reliable.
- Public pages, learner flows, creator flows, and admin flows are stable under beta usage.
