# Rollback Runbook

Rollback decisions should protect learners, creators, payments, AI costs, and data integrity. Do not
hide incidents or bypass security controls to restore convenience.

## When to Roll Back

Consider rollback when:

- Login or signup is broken for most users.
- Paid course access unlock is broken.
- Unauthorized content access is detected.
- Payment webhooks fail after deploy.
- AI costs or failures spike after deploy.
- Admin moderation or payout review is unsafe.
- Readiness fails after a deploy.

## Frontend Rollback

For Vercel:

1. Open the Vercel deployment list.
2. Promote the previous known-good deployment.
3. Confirm `NEXT_PUBLIC_API_URL` still points to the correct API.
4. Verify homepage, login, dashboard, beta waitlist, billing, and AI pages.
5. Watch Sentry and web logs for 30 minutes.

Frontend rollback is usually safe when no API contract or database migration dependency changed.

## Backend Rollback

1. Identify the previous known-good API release.
2. Confirm whether the current release ran migrations.
3. If no incompatible migration was applied, redeploy the previous API image/build.
4. Confirm:

   ```bash
   curl https://api.your-domain.com/api/v1/health
   curl https://api.your-domain.com/api/v1/health/readiness
   ```

5. Run the focused smoke path that failed.
6. Confirm webhook delivery recovers.

## Database Rollback Rules

Database rollback is high risk.

- Prefer forward-fix for additive migrations.
- Never run `migrate reset` in production.
- Never edit an already-applied production migration.
- Restore from backup only when data corruption or destructive migration requires it.
- If backup restore is required, pause writes first.
- Check payment, enrollment, subscription, and creator earning integrity after restore.

## Migration Rollback Caution

If a release contains a migration:

1. Classify the migration as additive, backfill, destructive, or contract-changing.
2. Additive nullable tables/columns usually allow application rollback.
3. Required columns, enum removals, table drops, or data rewrites require a custom rollback plan.
4. Keep old code compatible with new nullable columns when possible.

## Incident Communication

For SEV-1/SEV-2:

- Assign an incident lead.
- Notify internal stakeholders immediately.
- Tell beta users if the issue impacts access, payments, or learning for more than 30 minutes.
- Avoid sharing exploit details or internal stack traces.
- Publish a short resolution note after fix or rollback.

## When to Pause Payments or Signups

Pause paid checkout if:

- Webhooks are failing.
- Duplicate creator earnings or enrollments are detected.
- Payment provider keys or webhook secrets may be compromised.
- Paid users cannot access courses after verified payment.

Pause signups or beta invites if:

- Auth is unstable.
- User data integrity is at risk.
- Support load is beyond response targets.
- AI cost controls are not working.
