# First 100 Users System

## Goal

The first 100 users sprint is a controlled growth and operations layer for beta acquisition, activation, cohort management, and founder-led onboarding. It is not a public launch system and does not replace the existing beta access, security, support, or incident process.

## Target Personas

### Learners

- Motivated self-learners who want structured progress, AI help, and memory workflows.
- Early adopters willing to give feedback about confusing flows.
- Users who can complete at least one lesson and try the AI tutor during the first week.

### Creators

- Instructors, domain experts, or builders who can create practical text-first course material.
- Creators who want early input into course builder, review, revenue, and payout workflows.
- People comfortable with founder-led onboarding and direct feedback loops.

## Learner Outreach Message

Subject: Join the LearnDojoWorld controlled beta

Message:

Hi,

I am inviting a small group of learners into the LearnDojoWorld beta. The product combines courses, AI tutoring, progress tracking, flashcards, revision, and a memory engine in one learning loop.

The beta goal is simple: complete onboarding, enroll in a course, finish one lesson, try the AI tutor, and tell us what felt useful or confusing.

If you want early access, join here: `/beta`

Founder, LearnDojoWorld

## Creator Outreach Message

Subject: Early creator invite for LearnDojoWorld

Message:

Hi,

I am onboarding a small group of creators into LearnDojoWorld before public launch. Creators can apply, create course drafts, build modules and lessons, submit for review, and test the early revenue and payout review foundation.

The current beta is intentionally controlled. I am looking for creators who can give practical feedback on the course builder, publishing review flow, and learner experience.

If you want early creator access, join here: `/beta`

Founder, LearnDojoWorld

## Activation Metrics

The first-100 dashboard tracks:

- Waitlist count
- Invited count
- Accepted count
- Signup count
- Onboarding completed
- First course enrollment
- First lesson completed
- First AI message
- Creator applications
- Feedback submitted
- Support requests

## Weekly Founder Review Checklist

Review every week:

- How many waitlisted users were invited?
- How many invited users accepted?
- How many accepted users completed onboarding?
- How many users enrolled in a first course?
- How many users completed a first lesson?
- How many users tried the AI tutor?
- What were the top three confusion points?
- Are support requests increasing faster than the team can answer?
- Are AI costs within expected beta limits?
- Are creators able to submit useful course drafts?

## Founder Dashboard Checklist

Before inviting the next cohort:

- `/admin/beta/first-100` loads without errors.
- Waitlist entries can be invited and rejected.
- Cohorts can be created for operational grouping.
- Activation funnel is zero-safe and uses real production data.
- Feedback and support totals are visible.
- Existing `/admin/beta` support and feedback review still works.
- E2E suite passes.

## Operating Rules

- Do not fake metrics.
- Do not hard-block login or registration until the product has an explicit launch gate.
- Do not weaken auth, RBAC, rate limits, webhook signatures, AI limits, or content access checks.
- Invite in small batches so support and incident response can keep up.
- Treat every payment, AI, creator, and admin issue as real production risk.
