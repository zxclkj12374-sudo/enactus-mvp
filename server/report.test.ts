import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "admin-user",
    email: "admin@example.com",
    name: "Admin User",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as unknown as TrpcContext["res"],
  };
}

function createUserContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 2,
    openId: "normal-user",
    email: "user@example.com",
    name: "Normal User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as unknown as TrpcContext["res"],
  };
}

function createUnauthContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as unknown as TrpcContext["res"],
  };
}

describe("Admin report routes", () => {
  it("admin.stats requires admin role", async () => {
    const userCtx = createUserContext();
    const caller = appRouter.createCaller(userCtx);
    await expect(caller.admin.stats()).rejects.toThrow();
  });

  it("admin.users requires admin role", async () => {
    const userCtx = createUserContext();
    const caller = appRouter.createCaller(userCtx);
    await expect(caller.admin.users()).rejects.toThrow();
  });

  it("admin.userDetail requires admin role", async () => {
    const userCtx = createUserContext();
    const caller = appRouter.createCaller(userCtx);
    await expect(caller.admin.userDetail({ userId: 1 })).rejects.toThrow();
  });

  it("admin.createReport requires admin role", async () => {
    const userCtx = createUserContext();
    const caller = appRouter.createCaller(userCtx);
    await expect(
      caller.admin.createReport({
        userId: 2,
        situationAnalysis: "test",
        behaviorAnalysis: "test",
        unconsciousAnalysis: "test",
        actionPlan: "test",
        jobRecommendations: [{ jobTitle: "Test", reason: "Test" }],
      })
    ).rejects.toThrow();
  });

  it("admin.deliverReport requires admin role", async () => {
    const userCtx = createUserContext();
    const caller = appRouter.createCaller(userCtx);
    await expect(caller.admin.deliverReport({ userId: 2 })).rejects.toThrow();
  });

  it("admin.generateAIAnalysis requires admin role", async () => {
    const userCtx = createUserContext();
    const caller = appRouter.createCaller(userCtx);
    await expect(caller.admin.generateAIAnalysis({ userId: 2 })).rejects.toThrow();
  });

  it("unauthenticated user cannot access admin routes", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.admin.stats()).rejects.toThrow();
    await expect(caller.admin.users()).rejects.toThrow();
  });
});

describe("User report routes", () => {
  it("report.get requires authentication", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.report.get()).rejects.toThrow();
  });

  it("report.getJobRecommendations requires authentication", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.report.getJobRecommendations()).rejects.toThrow();
  });
});

describe("Notification routes", () => {
  it("notification.list requires authentication", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.notification.list()).rejects.toThrow();
  });

  it("notification.unreadCount requires authentication", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.notification.unreadCount()).rejects.toThrow();
  });

  it("notification.markRead requires authentication", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.notification.markRead({ notificationId: 1 })).rejects.toThrow();
  });
});

describe("Input validation", () => {
  it("admin.createReport accepts valid input from admin", async () => {
    const adminCtx = createAdminContext();
    const caller = appRouter.createCaller(adminCtx);
    // Empty strings are valid at the schema level; business validation happens in UI
    const result = await caller.admin.createReport({
      userId: 2,
      situationAnalysis: "Test situation",
      behaviorAnalysis: "Test behavior",
      unconsciousAnalysis: "Test unconscious",
      actionPlan: "Test plan",
      jobRecommendations: [{ jobTitle: "Test Job", reason: "Test reason" }],
    });
    expect(result.success).toBe(true);
    expect(result.reportId).toBeDefined();
  });

  it("notification.markRead validates notificationId", async () => {
    const userCtx = createUserContext();
    const caller = appRouter.createCaller(userCtx);
    // Invalid notificationId type should fail
    await expect(
      caller.notification.markRead({ notificationId: "invalid" as any })
    ).rejects.toThrow();
  });
});
