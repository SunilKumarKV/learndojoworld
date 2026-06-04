# Observability

LearnDojoWorld keeps observability optional in local development and safe in production. Sentry is
initialized only when a DSN is configured.

## Environment Variables

Backend:

```env
SENTRY_DSN=
SENTRY_ENVIRONMENT=production
SENTRY_TRACES_SAMPLE_RATE=0.05
LOG_LEVEL=info
```

Frontend:

```env
NEXT_PUBLIC_SENTRY_DSN=
NEXT_PUBLIC_SENTRY_ENVIRONMENT=production
NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE=0.05
```

Use empty DSN values for local development if Sentry should stay disabled.

## Local Sentry Test

1. Create a Sentry project for the API and another for the web app.
2. Add the API DSN to `SENTRY_DSN`.
3. Add the browser DSN to `NEXT_PUBLIC_SENTRY_DSN`.
4. Start the app with `pnpm dev`.
5. Trigger a controlled server error or frontend render error in a local-only branch.
6. Confirm the event appears in Sentry.
7. Remove the controlled error before committing.

Never commit DSNs, auth tokens, API keys, or Sentry auth tokens.

## Health Checks

Liveness:

```bash
curl http://localhost:4000/api/v1/health
```

Readiness:

```bash
curl http://localhost:4000/api/v1/health/readiness
```

Readiness checks database connectivity. It returns `503` when a required dependency is unavailable.

## Logging

The API logs:

- request method
- request path
- response status code
- duration in milliseconds
- request id

Development logs are readable text. Production logs are structured JSON.

## Never Log

- passwords
- authorization headers
- cookies
- refresh/access tokens
- API keys
- webhook signatures
- Sentry DSNs
- payment provider secrets
- raw AI provider keys

The shared API logger redacts common secret-bearing keys, but callers should still avoid passing
sensitive objects into logs.

## Production Checklist

- Configure `SENTRY_DSN` for the API.
- Configure `NEXT_PUBLIC_SENTRY_DSN` for the web app.
- Set `SENTRY_ENVIRONMENT` and `NEXT_PUBLIC_SENTRY_ENVIRONMENT`.
- Keep `SENTRY_TRACES_SAMPLE_RATE` modest in production.
- Set `LOG_LEVEL=info` or `warn`.
- Route JSON logs to the deployment platform log drain.
- Monitor `/api/v1/health` and `/api/v1/health/readiness`.
- Verify production error responses do not include stack traces.
- Verify source map upload settings are configured only in CI/deployment, not committed secrets.
