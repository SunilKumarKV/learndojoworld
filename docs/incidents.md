# LearnDojoWorld Incident Process

## Severity Levels

### SEV-1: Critical

Use for payment unlock failures, unauthorized content exposure, admin/security bypass, production outage, webhook replay mutation, or AI cost runaway.

Response target: acknowledge within 15 minutes and begin mitigation immediately.

### SEV-2: High

Use for broken login, broken onboarding, broken lesson access for enrolled users, creator submission failures, serious AI degradation, or elevated API errors.

Response target: acknowledge within 1 hour.

### SEV-3: Medium

Use for isolated feature failures, confusing UI defects, intermittent provider errors, analytics gaps, or non-critical admin workflow issues.

Response target: acknowledge within 1 business day.

### SEV-4: Low

Use for cosmetic issues, copy issues, minor usability feedback, or low-risk operational improvements.

Response target: triage during the normal weekly review.

## Incident Roles

- Incident lead: owns coordination and final decision making.
- Engineering owner: investigates root cause and prepares the fix.
- Support owner: communicates with impacted beta users.
- Founder owner: decides whether to pause beta invitations or rollback.

## First 15 Minutes

1. Confirm impact and severity.
2. Check health and readiness endpoints.
3. Check recent deploy, migration, and environment changes.
4. Check Sentry events and API logs.
5. Pause risky manual actions such as payouts, creator approvals, or beta invites if relevant.
6. Start an incident note with timeline, owner, impact, and current mitigation.

## Rollback Steps

1. Identify the last known good deployment.
2. Confirm whether a database migration was included.
3. If no irreversible migration exists, rollback the application deploy.
4. If a migration is involved, prefer forward-fix unless rollback has been tested.
5. Verify `/api/v1/health` and `/api/v1/health/readiness`.
6. Re-run the affected smoke path.
7. Document the rollback time and result.

## Communication Steps

For SEV-1 and SEV-2:

1. Notify internal team immediately.
2. Notify impacted beta users if user-facing impact lasts longer than 30 minutes.
3. Use plain language and avoid exposing security details.
4. Share resolution once fixed.
5. Add a post-incident note within 48 hours.

## Post-Incident Review

Include:

- What happened
- Customer impact
- Root cause
- Detection gap
- Fix shipped
- Follow-up prevention work
- Owner and due date

## Never Do During Incidents

- Do not disable security controls to restore convenience.
- Do not replay unsigned webhooks.
- Do not manually mark paid subscriptions active without verified payment.
- Do not paste secrets, tokens, payment data, or API keys into logs or tickets.
- Do not hide known beta-impacting issues from the founder review.
