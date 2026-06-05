# LearnDojoWorld Beta Support Playbook

## Support Goals

Support during beta should help users keep learning while giving the product team clear, reproducible evidence about what is broken or confusing.

## Response Targets

- Payment, login, account access, or paid course access: same day, target under 4 hours.
- AI tutor blocked or repeatedly failing: same day.
- Course progress, quiz, flashcard, or revision issue: 1 business day.
- Creator dashboard or course builder issue: 1 business day.
- General feedback or feature request: 3 business days.

## Intake

Users can submit support requests from the beta banner. Each request should capture:

- User account
- Subject
- Message
- Current page path when available
- Created timestamp
- Current status

## Triage Status

- `OPEN`: not reviewed yet.
- `IN_PROGRESS`: assigned or actively investigating.
- `RESOLVED`: fix, workaround, or answer delivered.
- `CLOSED`: no further action required.

## Escalation

Escalate immediately when a request involves:

- Payment charged but access not unlocked
- Unauthorized access to paid content
- Admin or creator permission issue
- AI exposing content the user should not access
- Repeated 5xx errors
- Data loss or progress corruption
- Security concern

## Handling User Reports

1. Acknowledge the user.
2. Reproduce if possible.
3. Check whether it is isolated or systemic.
4. Link related feedback or incident notes.
5. Update the support request status.
6. Close only after the user has a fix, workaround, or clear answer.

## Safe Communication

Use simple, honest language. Do not disclose:

- Stack traces
- Secrets
- Internal tokens
- Webhook payload signatures
- Raw payment data
- Other users' data

## Weekly Support Review

Review:

- Open ticket count
- Oldest open ticket
- Top recurring confusion points
- Payment and AI issues
- Creator onboarding issues
- Product changes needed before expanding beta access
