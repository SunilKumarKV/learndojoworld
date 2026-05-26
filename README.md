# LearnDojoWorld

LearnDojoWorld is a startup-grade AI learning operating system designed to help learners, educators, and teams build structured learning paths with intelligent guidance.

This repository is being prepared as the production foundation for the LearnDojoWorld platform. It is intentionally clean and minimal at this stage: no demo app, no cloned starter experience, and no Phase 2 product surface.

## Phase 1 Goal

Phase 1 focuses on the foundation and learner MVP:

- Establish a clean PNPM monorepo structure.
- Prepare the application and package boundaries.
- Set up the base infrastructure direction for database, cache, and services.
- Keep the product scope focused on the learner MVP.

Authentication, advanced AI workflows, monetization, admin systems, and other Phase 2 capabilities are intentionally not implemented yet.

## Tech Stack

- Next.js
- NestJS
- PostgreSQL
- Prisma
- Redis
- PNPM

## Repository Structure

```text
learndojoworld/
  apps/
  packages/
  prisma/
  docs/
  scripts/
  .env.example
  .gitignore
  README.md
  package.json
  pnpm-workspace.yaml
```

## Getting Started

Install dependencies after apps and packages are added:

```bash
pnpm install
```

Run development services once the app workspaces exist:

```bash
pnpm dev
```

## Environment

Copy `.env.example` to `.env` and provide local values when services are introduced.
