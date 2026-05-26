# LearnDojoWorld

Global production-focused learning platform monorepo.

LearnDojoWorld is designed as a modern learning SaaS platform focused on structured learning, memory-based study techniques, active recall, creator content, dashboards, quizzes, progress tracking, and scalable full-stack architecture.

## Vision

LearnDojoWorld aims to combine the best parts of structured coding platforms, creator-led learning, gamified progress, and memory science into one learner-focused product.

The long-term goal is to help users learn deeply, revise consistently, and retain knowledge for real-world application.

## Core Product Ideas

- Structured learning roadmaps
- Course and lesson management
- Learner dashboard
- Creator dashboard
- Admin dashboard
- Quiz and flashcard system
- Active recall workflows
- Spaced repetition planning
- Progress tracking
- Streaks, XP, and levels
- Calm Mode / Dojo Mode learning experience
- Real-world examples and visual explanations
- Notes and revision system
- Role-based access control

## Monorepo Structure

```txt
apps/client       React + Vite frontend
apps/server       Node.js + Express API
packages/shared   Shared utilities, constants, and types
docs              Architecture and product documentation
.github           GitHub workflows and templates
```

## Tech Stack

### Frontend

- React.js
- Vite
- Tailwind CSS
- React Router
- Axios
- Zustand
- React Hook Form
- Zod

### Backend

- Node.js
- Express.js
- PostgreSQL
- Prisma ORM
- JWT Authentication
- bcrypt
- Zod validation

### Tooling

- PNPM
- Monorepo architecture
- GitHub Actions
- ESLint / formatting workflow

## Getting Started

### Requirements

- Node.js 20+
- PNPM 10+
- PostgreSQL

### Install

```bash
pnpm install
```

### Environment

Create environment files based on the provided examples:

```bash
cp apps/client/.env.example apps/client/.env
cp apps/server/.env.example apps/server/.env
```

### Development

```bash
pnpm dev
```

### Build

```bash
pnpm build
```

### Lint / Format / Test

```bash
pnpm lint
pnpm format
pnpm test
```

## Production Architecture Goals

This project is intended to support:

- scalable frontend/backend separation
- shared type-safe contracts
- PostgreSQL-backed data models
- secure authentication
- role-based route protection
- creator/learner/admin workflows
- deployment-ready environment configuration
- long-term SaaS monetization planning

## Roadmap

- [ ] Learner authentication
- [ ] Course catalog
- [ ] Lesson player
- [ ] Quiz system
- [ ] Flashcards
- [ ] Progress tracking
- [ ] Creator studio
- [ ] Admin moderation
- [ ] Public landing page
- [ ] Payment/subscription planning
- [ ] AI-assisted summaries and quizzes
- [ ] Mobile-friendly learning experience

## Repository Purpose

This repository is part of the long-term global product roadmap for LearnDojoWorld and should be maintained with production-level standards.

## Author

Sunil Kumar K V

- Portfolio: https://sunilcraft.vercel.app
- GitHub: https://github.com/SunilKumarKV
- LinkedIn: https://www.linkedin.com/in/sunilkumarkv44/
