# Contributing

Thank you for contributing to LearnDojoWorld.

## Workflow

1. Create a branch from `main`
2. Make focused changes
3. Run quality checks
4. Open a pull request
5. Wait for CI checks before merge

## Branch Naming

* `feature/*`
* `fix/*`
* `chore/*`
* `docs/*`

## Required Checks

Before pushing:

```bash
pnpm lint
pnpm typecheck
pnpm build
```

## Pull Requests

PRs should:

* remain focused
* avoid unrelated changes
* include smoke-test notes
* pass CI checks

## Security

Never commit:

* `.env`
* API keys
* tokens
* passwords
* production secrets
