# Architecture

LearnDojoWorld is structured as a PNPM monorepo for a startup-grade AI learning operating system.

## Workspace Layout

```text
apps/
  web/
  api/
packages/
  ui/
  shared/
  config/
  validators/
  sdk/
prisma/
docs/
scripts/
```

## Boundaries

- `apps/web`: learner-facing web application. The intended framework is Next.js.
- `apps/api`: backend service. The intended framework is NestJS.
- `packages/ui`: shared interface primitives for product applications.
- `packages/shared`: shared TypeScript domain utilities and constants.
- `packages/config`: shared runtime and build configuration helpers.
- `packages/validators`: shared validation schemas for app and API boundaries.
- `packages/sdk`: typed client package for consuming LearnDojoWorld APIs.
- `prisma`: database schema, migrations, and seed entrypoint.
- `docs`: product and engineering documentation.
- `scripts`: repository automation scripts.

## Phase 1 Scope

Phase 1 is limited to production foundation and learner MVP preparation. Authentication, admin workflows, monetization, advanced AI flows, and other Phase 2 features are outside this foundation step.
