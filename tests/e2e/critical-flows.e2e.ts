import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { createHmac } from "node:crypto";
import { setTimeout as delay } from "node:timers/promises";

import { Prisma, PrismaClient, UserRole } from "@prisma/client";

const prisma = new PrismaClient();
const apiPort = Number(process.env.E2E_API_PORT ?? 4101);
const apiBaseUrl = process.env.E2E_API_BASE_URL ?? `http://127.0.0.1:${apiPort}/api/v1`;
const shouldStartApi = process.env.E2E_SKIP_API_START !== "true";
const runId = `e2e_${Date.now().toString(36)}`;
const emailDomain = "e2e.learndojoworld.test";
const testPasswordHash = "e2e-password-hash-not-used";
const jwtSecret = process.env.JWT_SECRET || "e2e_jwt_secret";
const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET || "e2e_refresh_secret";
const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "e2e_stripe_webhook_secret";

type ApiEnvelope<T> =
  | { success: true; data: T; meta?: unknown }
  | { success: false; error: { message: string; code?: string }; meta?: unknown };

type AuthResponse = {
  tokens: { accessToken: string; refreshToken: string };
  user: { id: string; email: string; username: string };
};

type CourseFixture = {
  courseId: string;
  lessonId: string;
  slug: string;
};

type RequestOptions = {
  body?: unknown;
  headers?: Record<string, string>;
  method?: string;
  rawBody?: string;
  token?: string;
};

let apiProcess: ChildProcessWithoutNullStreams | undefined;
const cleanupUserIds = new Set<string>();
const cleanupCourseIds = new Set<string>();

async function main() {
  await ensureDatabaseReachable();
  await cleanup();
  await ensurePlans();

  if (shouldStartApi) {
    apiProcess = await startApi();
  } else {
    await waitForApi();
  }

  try {
    await runAuthFlow();
    await runCourseAccessFlow();
    await runPaymentWebhookFlow();
    await runAIFlow();
    await runReferralFlow();
    await runBetaOpsFlow();
    await runAdminAndCreatorFlow();
    console.log("critical e2e suite passed");
  } finally {
    await cleanup();
    await prisma.$disconnect();
    stopApi();
  }
}

async function runAuthFlow() {
  const username = `${runId}_auth`;
  const email = `${username}@${emailDomain}`;
  const registered = await api<AuthResponse>("/auth/register", {
    body: {
      email,
      name: "E2E Auth Learner",
      password: "CorrectHorse123",
      username,
    },
    method: "POST",
  });
  cleanupUserIds.add(registered.user.id);

  const dashboard = await api<{ stats?: unknown }>("/dashboard/learner", {
    token: registered.tokens.accessToken,
  });
  assert(Boolean(dashboard), "protected learner dashboard should be accessible after register");

  const loggedIn = await api<AuthResponse>("/auth/login", {
    body: {
      identifier: email,
      password: "CorrectHorse123",
    },
    method: "POST",
  });
  assert(Boolean(loggedIn.tokens.accessToken), "login should return an access token");

  const logout = await api<{ loggedOut: boolean }>("/auth/logout", {
    method: "POST",
    token: loggedIn.tokens.accessToken,
  });
  assert(logout.loggedOut === true, "logout should succeed");
}

async function runCourseAccessFlow() {
  const learner = await createUser("course_learner");
  const token = signAccessToken(learner);
  const fixture = await createCourseFixture({ isFree: true, ownerLabel: "course_access" });

  const publicCourse = await api<{ modules: Array<{ lessons: Array<{ content?: string }> }> }>(
    `/courses/${fixture.slug}`,
  );
  const publicLesson = publicCourse.modules[0]?.lessons[0];
  assert(
    publicLesson && !("content" in publicLesson),
    "public course detail must not expose content",
  );

  await expectStatus(`/lessons/${fixture.lessonId}`, 403, { token });

  await api("/enrollments", {
    body: { courseId: fixture.courseId },
    method: "POST",
    token,
  });

  const lesson = await api<{ content: string }>(`/lessons/${fixture.lessonId}`, { token });
  assert(
    lesson.content.includes("paid/private lesson body"),
    "enrolled learner should access content",
  );
}

async function runPaymentWebhookFlow() {
  const buyer = await createUser("payment_buyer");
  const token = signAccessToken(buyer);
  const fixture = await createCourseFixture({
    isFree: false,
    ownerLabel: "payment",
    price: new Prisma.Decimal("19.99"),
  });

  const checkout = await api<{
    gatewayOrderId: string;
    paymentId: string;
    providerConfigured: boolean;
  }>("/payments/checkout", {
    body: { courseId: fixture.courseId, gateway: "stripe", type: "COURSE" },
    method: "POST",
    token,
  });
  assert(checkout.providerConfigured === false, "local checkout should avoid real Stripe calls");

  const pendingPayment = await prisma.payment.findUniqueOrThrow({
    where: { id: checkout.paymentId },
  });
  assert(pendingPayment.status === "PENDING", "checkout should create a pending payment");

  const rawBody = JSON.stringify({
    data: {
      object: {
        client_reference_id: checkout.gatewayOrderId,
        id: `${runId}_checkout_session`,
        metadata: { ldwPaymentId: checkout.paymentId },
        payment_intent: `${runId}_payment_intent`,
      },
    },
    id: `evt_${runId}_stripe_paid`,
    type: "checkout.session.completed",
  });
  const signature = createStripeSignature(rawBody);

  await api("/webhooks/payments/stripe", {
    headers: { "stripe-signature": signature },
    method: "POST",
    rawBody,
  });

  const enrollmentCount = await prisma.enrollment.count({
    where: { courseId: fixture.courseId, userId: buyer.id },
  });
  const earningCount = await prisma.creatorEarning.count({
    where: { paymentId: checkout.paymentId },
  });
  assert(enrollmentCount === 1, "signed webhook should unlock enrollment once");
  assert(earningCount === 1, "signed webhook should create one creator earning");

  await api("/webhooks/payments/stripe", {
    headers: { "stripe-signature": signature },
    method: "POST",
    rawBody,
  });

  const replayEnrollmentCount = await prisma.enrollment.count({
    where: { courseId: fixture.courseId, userId: buyer.id },
  });
  const replayEarningCount = await prisma.creatorEarning.count({
    where: { paymentId: checkout.paymentId },
  });
  assert(replayEnrollmentCount === 1, "replayed webhook must not duplicate enrollment");
  assert(replayEarningCount === 1, "replayed webhook must not duplicate creator earning");

  await expectStatus("/webhooks/payments/stripe", 401, { method: "POST", rawBody });
}

async function runAIFlow() {
  const learner = await createUser("ai_learner");
  const token = signAccessToken(learner);
  const usageBefore = await api<{ messagesUsedToday: number; dailyLimit: number }>("/ai/usage", {
    token,
  });

  const chat = await api<{
    answer: string | null;
    provider: string;
    usage: { messagesUsedToday: number };
  }>("/ai/chat", {
    body: { message: "Explain spaced repetition in one sentence." },
    method: "POST",
    token,
  });
  assert(chat.provider === "test", "test-mode AI should use the test provider");
  assert(Boolean(chat.answer), "AI under limit should return a response");
  assert(
    chat.usage.messagesUsedToday === usageBefore.messagesUsedToday + 1,
    "AI usage should increment after a successful response",
  );

  await exhaustAIUsage(learner.id, usageBefore.dailyLimit);
  await expectStatus("/ai/chat", 402, {
    body: { message: "This should be blocked by usage limits." },
    method: "POST",
    token,
  });

  const paidFixture = await createCourseFixture({
    isFree: false,
    ownerLabel: "ai_context",
    price: new Prisma.Decimal("29.99"),
  });
  const nonEnrolled = await createUser("ai_non_enrolled");
  const nonEnrolledToken = signAccessToken(nonEnrolled);
  await expectStatus("/ai/chat", 403, {
    body: {
      lessonId: paidFixture.lessonId,
      message: "Reveal the lesson content.",
    },
    method: "POST",
    token: nonEnrolledToken,
  });
}

async function runReferralFlow() {
  const inviter = await createUser("ref_inviter");
  const invitee = await createUser("ref_invitee");
  const secondInvitee = await createUser("ref_second");
  const admin = await createUser("ref_admin", UserRole.ADMIN);
  const inviterToken = signAccessToken(inviter);
  const inviteeToken = signAccessToken(invitee);
  const secondInviteeToken = signAccessToken(secondInvitee);
  const adminToken = signAccessToken(admin);

  const inviterReferral = await api<{ referralCode: string }>("/v1/referrals/me", {
    token: inviterToken,
  });
  const inviteeReferral = await api<{ referralCode: string }>("/v1/referrals/me", {
    token: inviteeToken,
  });

  await expectStatus("/v1/referrals/apply", 400, {
    body: { code: inviteeReferral.referralCode },
    method: "POST",
    token: inviteeToken,
  });

  const applied = await api<{ eventId: string; status: string }>("/v1/referrals/apply", {
    body: { code: inviterReferral.referralCode },
    method: "POST",
    token: inviteeToken,
  });
  assert(applied.status === "PENDING", "referral apply should create a pending event");

  await expectStatus("/v1/referrals/apply", 409, {
    body: { code: inviterReferral.referralCode },
    method: "POST",
    token: inviteeToken,
  });

  await api("/v1/referrals/apply", {
    body: { code: inviterReferral.referralCode },
    method: "POST",
    token: secondInviteeToken,
  });

  const rewards = await prisma.referralReward.findMany({
    orderBy: { createdAt: "asc" },
    where: { referralEventId: applied.eventId },
  });
  assert(rewards.length === 2, "referral apply should create two pending rewards");
  assert(
    rewards.every((reward) => reward.status === "PENDING"),
    "referral rewards should start pending",
  );

  const rewardToGrant = rewards[0];
  await api(`/admin/referrals/rewards/${rewardToGrant.id}/approve`, {
    method: "POST",
    token: adminToken,
  });
  await api(`/admin/referrals/rewards/${rewardToGrant.id}/grant`, {
    method: "POST",
    token: adminToken,
  });

  const fulfilledReward = await prisma.referralReward.findUniqueOrThrow({
    where: { id: rewardToGrant.id },
  });
  assert(fulfilledReward.status === "GRANTED", "admin grant should mark reward granted");
  assert(Boolean(fulfilledReward.fulfilledAt), "admin grant should store fulfilledAt");

  const activePro = await prisma.subscription.findFirst({
    include: { plan: true },
    where: {
      plan: { code: "PRO" },
      status: "ACTIVE",
      userId: rewardToGrant.userId,
    },
  });
  assert(Boolean(activePro), "admin grant should activate temporary Pro");

  await expectStatus(`/admin/referrals/rewards/${rewardToGrant.id}/grant`, 400, {
    method: "POST",
    token: adminToken,
  });
}

async function runBetaOpsFlow() {
  const learner = await createUser("beta_learner");
  const admin = await createUser("beta_admin", UserRole.ADMIN);
  const learnerToken = signAccessToken(learner);
  const adminToken = signAccessToken(admin);
  const waitlistEmail = `${runId}_waitlist@${emailDomain}`;
  const rejectedEmail = `${runId}_waitlist_reject@${emailDomain}`;

  const waitlistEntry = await api<{ id: string; status: string }>("/beta/waitlist", {
    body: {
      email: waitlistEmail,
      name: "E2E Waitlist User",
      roleInterest: "LEARNER",
      source: "E2E suite",
    },
    method: "POST",
  });
  assert(waitlistEntry.status === "WAITLISTED", "public waitlist should capture entries");
  await expectStatus("/beta/waitlist", 409, {
    body: {
      email: waitlistEmail,
      roleInterest: "LEARNER",
    },
    method: "POST",
  });

  const rejectedEntry = await api<{ id: string }>("/beta/waitlist", {
    body: {
      email: rejectedEmail,
      roleInterest: "CREATOR",
    },
    method: "POST",
  });

  const access = await api<{ email: string; id: string; status: string }>("/admin/beta/access", {
    body: {
      email: learner.email,
      notes: "E2E beta invite",
    },
    method: "POST",
    token: adminToken,
  });
  assert(access.status === "INVITED", "admin should create beta invites");

  const waitlist = await api<Array<{ email: string; id: string }>>("/admin/beta/waitlist", {
    token: adminToken,
  });
  assert(
    waitlist.some((entry) => entry.email === waitlistEmail),
    "admin should see waitlist entries",
  );

  const invited = await api<{ waitlist: { status: string }; access: { status: string } }>(
    `/admin/beta/waitlist/${waitlistEntry.id}/invite`,
    {
      method: "POST",
      token: adminToken,
    },
  );
  assert(invited.waitlist.status === "INVITED", "admin should invite waitlist entries");
  assert(invited.access.status === "INVITED", "waitlist invite should create beta access");

  const rejected = await api<{ status: string }>(
    `/admin/beta/waitlist/${rejectedEntry.id}/reject`,
    {
      method: "POST",
      token: adminToken,
    },
  );
  assert(rejected.status === "REJECTED", "admin should reject waitlist entries");

  const cohort = await api<{ id: string; targetUsers: number }>("/admin/beta/cohorts", {
    body: {
      name: `${runId} cohort`,
      targetUsers: 25,
    },
    method: "POST",
    token: adminToken,
  });
  assert(cohort.targetUsers === 25, "admin should create beta cohorts");

  const accepted = await api<{ status: string }>("/beta/me", { token: learnerToken });
  assert(accepted.status === "ACCEPTED", "invited user should accept beta access");

  const feedback = await api<{ id: string; status: string }>("/beta/feedback", {
    body: {
      message: "E2E beta feedback message",
      path: "/dashboard",
      type: "GENERAL_FEEDBACK",
    },
    method: "POST",
    token: learnerToken,
  });
  assert(feedback.status === "OPEN", "feedback should start open");

  const support = await api<{ id: string; status: string }>("/beta/support", {
    body: {
      message: "E2E support issue details",
      path: "/courses",
      subject: "E2E support issue",
    },
    method: "POST",
    token: learnerToken,
  });
  assert(support.status === "OPEN", "support requests should start open");

  await expectStatus("/admin/beta/dashboard", 403, { token: learnerToken });
  const dashboard = await api<{
    beta: { totalBetaUsers: number };
    feedback: { total: number };
    support: { total: number };
  }>("/admin/beta/dashboard", { token: adminToken });
  assert(dashboard.beta.totalBetaUsers >= 1, "admin beta dashboard should count beta users");
  assert(dashboard.feedback.total >= 1, "admin beta dashboard should count feedback");
  assert(dashboard.support.total >= 1, "admin beta dashboard should count support tickets");

  const first100 = await api<{
    activation: { signupCount: number };
    waitlist: { invited: number; rejected: number };
  }>("/admin/beta/first-100", { token: adminToken });
  assert(first100.waitlist.invited >= 1, "first-100 dashboard should count invites");
  assert(first100.waitlist.rejected >= 1, "first-100 dashboard should count rejections");
  assert(first100.activation.signupCount >= 1, "first-100 dashboard should count signups");

  const reviewed = await api<{ status: string }>(`/admin/beta/feedback/${feedback.id}`, {
    body: { status: "REVIEWED" },
    method: "PATCH",
    token: adminToken,
  });
  assert(reviewed.status === "REVIEWED", "admin should review beta feedback");

  const inProgress = await api<{ status: string }>(`/admin/beta/support/${support.id}`, {
    body: { status: "IN_PROGRESS" },
    method: "PATCH",
    token: adminToken,
  });
  assert(inProgress.status === "IN_PROGRESS", "admin should manage support tickets");
}

async function runAdminAndCreatorFlow() {
  const learner = await createUser("rbac_learner");
  const admin = await createUser("rbac_admin", UserRole.ADMIN);
  const learnerToken = signAccessToken(learner);
  const oldAdminToken = signAccessToken(admin);

  await expectStatus("/analytics/founder", 403, { token: learnerToken });
  await api("/analytics/founder", { token: oldAdminToken });

  await prisma.user.update({ data: { role: UserRole.LEARNER }, where: { id: admin.id } });
  await expectStatus("/analytics/founder", 403, { token: oldAdminToken });
  await prisma.user.update({ data: { role: UserRole.ADMIN }, where: { id: admin.id } });

  const creator = await createUser("creator", UserRole.CREATOR);
  await prisma.creatorProfile.create({
    data: {
      bio: "E2E creator bio",
      displayName: "E2E Creator",
      expertise: ["Testing"],
      userId: creator.id,
    },
  });
  const creatorToken = signAccessToken(creator);
  const adminToken = signAccessToken(admin);
  const category = await ensureCategory();

  const draft = await api<{ id: string; status: string }>("/creator/courses", {
    body: {
      categoryId: category.id,
      description: "Creator E2E course description",
      difficulty: "BEGINNER",
      language: "English",
      title: `${runId} Creator Draft`,
    },
    method: "POST",
    token: creatorToken,
  });
  cleanupCourseIds.add(draft.id);
  assert(draft.status === "DRAFT", "creator should create course drafts");

  const module = await api<{ id: string }>(`/creator/courses/${draft.id}/modules`, {
    body: { title: "Module 1" },
    method: "POST",
    token: creatorToken,
  });
  await api(`/creator/modules/${module.id}/lessons`, {
    body: {
      content: "Creator course lesson body",
      title: "Lesson 1",
      type: "TEXT",
    },
    method: "POST",
    token: creatorToken,
  });
  const submitted = await api<{ status: string }>(`/creator/courses/${draft.id}/submit-review`, {
    method: "POST",
    token: creatorToken,
  });
  assert(submitted.status === "PENDING_REVIEW", "creator should submit course for review");

  const approved = await api<{ slug: string; status: string }>(
    `/admin/courses/${draft.id}/approve`,
    {
      method: "POST",
      token: adminToken,
    },
  );
  assert(approved.status === "PUBLISHED", "admin should approve submitted course");

  const publicCourse = await api<{ id: string }>(`/courses/${approved.slug}`);
  assert(publicCourse.id === draft.id, "approved course should be visible publicly");
}

async function api<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {
    ...(options.headers ?? {}),
  };

  let body: string | undefined;
  if (options.rawBody !== undefined) {
    body = options.rawBody;
    headers["content-type"] ??= "application/json";
  } else if (options.body !== undefined) {
    body = JSON.stringify(options.body);
    headers["content-type"] = "application/json";
  }

  if (options.token) {
    headers.authorization = `Bearer ${options.token}`;
  }

  const response = await fetch(`${apiBaseUrl}${path}`, {
    body,
    headers,
    method: options.method ?? (body ? "POST" : "GET"),
  });
  const payload = (await response.json().catch(() => null)) as ApiEnvelope<T> | null;

  if (!response.ok || !payload?.success) {
    const message = isApiErrorEnvelope(payload) ? payload.error.message : response.statusText;
    throw new Error(
      `${options.method ?? "GET"} ${path} failed with ${response.status}: ${message}`,
    );
  }

  return payload.data;
}

async function expectStatus(path: string, expectedStatus: number, options: RequestOptions = {}) {
  const headers: Record<string, string> = {
    ...(options.headers ?? {}),
  };
  let body: string | undefined;

  if (options.rawBody !== undefined) {
    body = options.rawBody;
    headers["content-type"] ??= "application/json";
  } else if (options.body !== undefined) {
    body = JSON.stringify(options.body);
    headers["content-type"] = "application/json";
  }

  if (options.token) {
    headers.authorization = `Bearer ${options.token}`;
  }

  const response = await fetch(`${apiBaseUrl}${path}`, {
    body,
    headers,
    method: options.method ?? (body ? "POST" : "GET"),
  });

  if (response.status !== expectedStatus) {
    const text = await response.text();
    throw new Error(
      `Expected ${path} to return ${expectedStatus}, got ${response.status}: ${text}`,
    );
  }
}

async function createUser(label: string, role: UserRole = UserRole.LEARNER) {
  const username = `${runId}_${label}`.slice(0, 32).replace(/[^a-zA-Z0-9_]/g, "_");
  const user = await prisma.user.create({
    data: {
      email: `${username}@${emailDomain}`,
      name: `E2E ${label}`,
      passwordHash: testPasswordHash,
      profile: {
        create: {
          displayName: `E2E ${label}`,
        },
      },
      role,
      username,
    },
  });

  cleanupUserIds.add(user.id);
  return user;
}

async function createCourseFixture(args: {
  isFree: boolean;
  ownerLabel: string;
  price?: Prisma.Decimal;
}): Promise<CourseFixture> {
  const category = await ensureCategory();
  const creator = await createUser(`${args.ownerLabel}_owner`, UserRole.CREATOR);
  await prisma.creatorProfile.create({
    data: {
      bio: "E2E course owner",
      displayName: "E2E Course Owner",
      expertise: ["Testing"],
      userId: creator.id,
    },
  });

  const slug = `${runId}-${args.ownerLabel}`.replace(/_/g, "-").toLowerCase();
  const course = await prisma.course.create({
    data: {
      categoryId: category.id,
      creatorId: creator.id,
      currency: "USD",
      description: "Public course metadata without full lesson content",
      difficulty: "BEGINNER",
      isFree: args.isFree,
      language: "English",
      price: args.price ?? null,
      publishedAt: new Date(),
      slug,
      status: "PUBLISHED",
      title: `E2E ${args.ownerLabel} Course`,
    },
  });
  cleanupCourseIds.add(course.id);

  const module = await prisma.courseModule.create({
    data: {
      courseId: course.id,
      order: 1,
      title: "Module 1",
    },
  });
  const lesson = await prisma.lesson.create({
    data: {
      content: `paid/private lesson body ${runId} ${args.ownerLabel}`,
      isPreview: false,
      moduleId: module.id,
      order: 1,
      slug: "lesson-1",
      title: "Lesson 1",
      type: "TEXT",
    },
  });

  return { courseId: course.id, lessonId: lesson.id, slug: course.slug };
}

async function ensureCategory() {
  return prisma.category.upsert({
    create: {
      description: "E2E category",
      name: `E2E ${runId}`,
      slug: `e2e-${runId}`.replace(/_/g, "-").toLowerCase(),
    },
    update: {},
    where: { slug: `e2e-${runId}`.replace(/_/g, "-").toLowerCase() },
  });
}

async function ensurePlans() {
  await prisma.plan.upsert({
    create: {
      active: true,
      aiDailyLimit: 20,
      aiMonthlyLimit: 300,
      code: "FREE",
      currency: "INR",
      description: "Free plan",
      features: [],
      monthlyPrice: 0,
      name: "Free",
      yearlyPrice: 0,
    },
    update: { active: true, aiDailyLimit: 20, aiMonthlyLimit: 300 },
    where: { code: "FREE" },
  });
  await prisma.plan.upsert({
    create: {
      active: true,
      aiDailyLimit: 200,
      aiMonthlyLimit: 3000,
      code: "PRO",
      currency: "INR",
      description: "Pro plan",
      features: [],
      monthlyPrice: 499,
      name: "Pro",
      yearlyPrice: 4999,
    },
    update: { active: true },
    where: { code: "PRO" },
  });
  await prisma.plan.upsert({
    create: {
      active: true,
      aiDailyLimit: 1000,
      aiMonthlyLimit: 15000,
      code: "PREMIUM",
      currency: "INR",
      description: "Premium plan",
      features: [],
      monthlyPrice: 1499,
      name: "Premium",
      yearlyPrice: 14999,
    },
    update: { active: true },
    where: { code: "PREMIUM" },
  });
}

async function exhaustAIUsage(userId: string, dailyLimit: number) {
  const now = new Date();
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const month = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;

  await prisma.aIUsageEvent.createMany({
    data: Array.from({ length: dailyLimit }, () => ({
      date: today,
      messagesUsed: 1,
      model: "e2e-test",
      month,
      provider: "test",
      tokensUsed: 1,
      userId,
    })),
  });
}

function signAccessToken(user: { email: string; id: string; role: UserRole; username: string }) {
  return signJwt(
    {
      email: user.email,
      role: user.role,
      sub: user.id,
      username: user.username,
    },
    jwtSecret,
  );
}

function signJwt(payload: Record<string, unknown>, secret: string) {
  const now = Math.floor(Date.now() / 1000);
  const header = base64Url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = base64Url(JSON.stringify({ ...payload, exp: now + 900, iat: now }));
  const signature = createHmac("sha256", secret).update(`${header}.${body}`).digest("base64url");

  return `${header}.${body}.${signature}`;
}

function base64Url(value: string) {
  return Buffer.from(value).toString("base64url");
}

function createStripeSignature(rawBody: string) {
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = createHmac("sha256", stripeWebhookSecret)
    .update(`${timestamp}.${rawBody}`)
    .digest("hex");

  return `t=${timestamp},v1=${signature}`;
}

async function startApi() {
  const child = spawn("pnpm", ["--filter", "@learndojoworld/api", "dev"], {
    cwd: process.cwd(),
    detached: true,
    env: {
      ...process.env,
      AI_FALLBACK_PROVIDER: "",
      AI_PRIMARY_PROVIDER: "test",
      AI_PROVIDER: "TEST",
      API_PORT: String(apiPort),
      JWT_REFRESH_SECRET: jwtRefreshSecret,
      JWT_SECRET: jwtSecret,
      NODE_ENV: "test",
      REDIS_URL: process.env.REDIS_URL || "redis://localhost:6379",
      STRIPE_SECRET_KEY: "",
      STRIPE_WEBHOOK_SECRET: stripeWebhookSecret,
      WEB_ORIGIN: "http://localhost:3000",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });

  child.stdout.on("data", (chunk) => process.stdout.write(`[api] ${String(chunk)}`));
  child.stderr.on("data", (chunk) => process.stderr.write(`[api] ${String(chunk)}`));

  await waitForApi();
  return child;
}

async function waitForApi() {
  const deadline = Date.now() + 60_000;
  let lastError: unknown;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${apiBaseUrl}/health`);
      if (response.ok) {
        return;
      }
    } catch (error) {
      lastError = error;
    }

    await delay(1_000);
  }

  throw new Error(`API did not become healthy at ${apiBaseUrl}: ${formatError(lastError)}`, {
    cause: lastError,
  });
}

async function ensureDatabaseReachable() {
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (error: unknown) {
    throw new Error(
      `E2E database is not reachable. Start Docker Postgres and run migrations first. ${formatError(
        error,
      )}`,
      { cause: error },
    );
  }
}

async function cleanup() {
  await prisma.webhookEvent.deleteMany({
    where: { eventId: { startsWith: `evt_${runId}` } },
  });
  await prisma.betaAccess.deleteMany({ where: { email: { endsWith: `@${emailDomain}` } } });
  await prisma.betaWaitlistEntry.deleteMany({
    where: { email: { endsWith: `@${emailDomain}` } },
  });
  await prisma.betaCohort.deleteMany({ where: { name: { startsWith: runId } } });
  if (cleanupCourseIds.size > 0) {
    await prisma.course.deleteMany({ where: { id: { in: [...cleanupCourseIds] } } });
  }
  await prisma.course.deleteMany({ where: { slug: { startsWith: `e2e-${runId}` } } });
  if (cleanupUserIds.size > 0) {
    await prisma.user.deleteMany({ where: { id: { in: [...cleanupUserIds] } } });
  }
  await prisma.user.deleteMany({ where: { email: { endsWith: `@${emailDomain}` } } });
  await prisma.category.deleteMany({ where: { slug: { startsWith: `e2e-${runId}` } } });
}

function stopApi() {
  if (apiProcess && !apiProcess.killed) {
    if (apiProcess.pid) {
      try {
        process.kill(-apiProcess.pid, "SIGTERM");
      } catch (_error) {
        apiProcess.kill("SIGTERM");
      }
    } else {
      apiProcess.kill("SIGTERM");
    }

    apiProcess.stdout.destroy();
    apiProcess.stderr.destroy();
    apiProcess.unref();
  }
}

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function isApiErrorEnvelope(
  value: ApiEnvelope<unknown> | null,
): value is Extract<ApiEnvelope<unknown>, { success: false }> {
  return value?.success === false;
}

function formatError(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  return "Unknown error";
}

main().catch(async (error: unknown) => {
  console.error(formatError(error));
  stopApi();
  await prisma.$disconnect();
  process.exit(1);
});
