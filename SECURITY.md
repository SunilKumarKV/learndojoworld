# Security Policy

LearnDojoWorld is a startup-stage learning platform. Security issues should be handled privately and responsibly.

## Supported Versions

The `main` branch is the only supported production-ready line. Feature branches are active development and may change frequently.

## Reporting a Vulnerability

Please do not open public GitHub issues for security vulnerabilities.

Send a private report to the project maintainer with:

- a clear description of the issue
- affected area or route
- reproduction steps
- expected impact
- screenshots or logs, if helpful

## Security Expectations

Contributors must avoid committing:

- `.env` files
- access tokens or API keys
- database credentials
- private certificates
- production secrets
- personal user data

## Local Development Secrets

Use `.env.example` files as templates only. Real secrets should remain local or inside trusted deployment secret managers.

## Production Readiness Notes

Before production launch, verify:

- HTTPS is enforced
- authentication tokens are stored safely
- CORS allows only trusted origins
- database backups are configured
- rate limiting is enabled for auth-sensitive endpoints
- error responses do not leak secrets
- dependency alerts are monitored
