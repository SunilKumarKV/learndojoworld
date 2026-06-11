# LearnDojoWorld

LearnDojoWorld is a startup-grade AI learning operating system designed to help learners, creators, educators, and teams build structured learning paths with intelligent guidance, active recall systems, and scalable learning workflows.

This repository contains the production foundation for the LearnDojoWorld platform.

---

# Vision

LearnDojoWorld aims to become a global learning ecosystem focused on:

- active learning
- creator-led education
- structured learning roadmaps
- AI-assisted learning systems
- long-term knowledge retention
- scalable learning infrastructure

The platform is being built as a real production startup system — not a demo application or clone project.

---

# Current Product Status

## Implemented

- PNPM monorepo architecture
- Next.js learner web application
- NestJS backend API
- PostgreSQL + Prisma integration
- Docker local infrastructure
- Authentication system
- Learner onboarding flow
- Learner dashboard foundation
- Protected routes
- Shared packages architecture
- GitHub Actions CI pipeline

## In Progress

- Learning roadmap engine
- Progress tracking
- Course/content systems
- Continue-learning workflows
- Creator workflows
- Admin moderation tools

## Planned

- AI tutoring system
- Personalized recommendations
- Mobile applications
- Realtime collaboration
- Creator monetization
- Enterprise learning systems
- Analytics platform

---

# Tech Stack

## Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS
- TanStack Query

## Backend

- NestJS
- Prisma
- PostgreSQL
- Redis

## Infrastructure

- Docker
- GitHub Actions
- PNPM Workspaces

---

# Repository Structure

```text
learndojoworld/
├── apps/
│   ├── web/
│   └── api/
│
├── packages/
│   ├── ui/
│   ├── shared/
│   ├── config/
│   ├── validators/
│   └── sdk/
│
├── prisma/
├── docs/
├── scripts/
├── .github/
├── package.json
├── pnpm-workspace.yaml
└── README.md
```

---

# Setup

## 1. Install Dependencies

```bash
pnpm install
```

## 2. Start Local Infrastructure

```bash
docker compose up -d
```

## 3. Configure Environment Variables

```bash
cp .env.example .env
```

Update local environment values before running the application.

---

# Database Setup

## Generate Prisma Client

```bash
pnpm db:generate
```

## Run Migrations

```bash
pnpm db:migrate
```

## Seed Development Data

```bash
pnpm db:seed
```

---

# Development

## Start Development Servers

```bash
pnpm dev
```

## Web App

```text
http://localhost:3000
```

## API Server

```text
http://localhost:4000
```

---

# Quality Commands

## Lint

```bash
pnpm lint
```

## Typecheck

```bash
pnpm typecheck
```

## Build

```bash
pnpm build
```

## Format Check

```bash
pnpm format:check
```

---

# Branch Workflow

## Main Branch

`main` contains stable production-ready code only.

## Feature Development

Create new branches from main:

```bash
git checkout main
git pull origin main
git checkout -b feature/my-feature
```

## Branch Naming

- `feature/*`
- `fix/*`
- `chore/*`
- `docs/*`

Examples:

```text
feature/auth-ui
feature/dashboard-engine
fix/onboarding-validation
chore/repo-cleanup
```

## Pull Request Requirements

Before opening a PR:

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm build
pnpm e2e
```

All CI checks must pass before merge.

---

# Deployment Direction

Production deployment readiness is documented in:

- `docs/deployment.md`
- `docs/production-env.md`
- `docs/rollback.md`
- `docs/production-smoke-test.md`
- `docs/observability.md`
- `docs/security-hardening.md`

## Web Application

- Framework: Next.js
- Deployment Target: Vercel
- Required production env includes `NEXT_PUBLIC_API_URL` and Sentry/Razorpay public values as
  applicable.

## Backend API

- Framework: NestJS
- Deployment Target: Railway / Render / AWS
- Required production env includes database, auth, CORS, AI, payment, webhook, and observability
  variables.
- Liveness: `/api/v1/health`
- Readiness: `/api/v1/health/readiness`

## Database

- PostgreSQL
- Prisma ORM
- Production migrations must use `pnpm exec prisma migrate deploy`, not `migrate dev`.

## Infrastructure

- Docker-based local development
- GitHub Actions CI
- PNPM monorepo architecture

---

# Security

- Never commit `.env` files
- Never commit API secrets or credentials
- Use `.env.example` files for templates only
- Use secure environment managers in production

See `SECURITY.md` for additional details.

---

# Startup Roadmap

## Phase 1 — Foundation

- Monorepo architecture
- Auth system
- Learner onboarding
- Dashboard foundation
- CI/CD stabilization

## Phase 2 — Learning Engine

- Learning roadmap system
- Progress tracking
- Continue-learning engine
- Streaks and XP system

## Phase 3 — Creator Platform

- Creator dashboard
- Course publishing
- Revenue systems
- Creator analytics

## Phase 4 — AI Platform

- AI tutoring
- Smart revision engine
- Personalized recommendations
- AI-generated quizzes

## Phase 5 — Scale

- Mobile applications
- Enterprise learning tools
- Global infrastructure
- Realtime collaboration systems

---

# Contributing

Please read:

- `CONTRIBUTING.md`
- `SECURITY.md`

before contributing to the project.

---

# License

This repository is currently under active startup development.

License configuration will be finalized before public production release.
