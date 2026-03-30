import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(role: "user" | "admin" = "user"): {
  ctx: TrpcContext;
  clearedCookies: { name: string; options: Record<string, unknown> }[];
} {
  const clearedCookies: { name: string; options: Record<string, unknown> }[] =
    [];

  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user-001",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: (name: string, options: Record<string, unknown>) => {
        clearedCookies.push({ name, options });
      },
    } as TrpcContext["res"],
  };

  return { ctx, clearedCookies };
}

function createUnauthContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("auth.me", () => {
  it("returns user for authenticated context", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result).toBeDefined();
    expect(result?.openId).toBe("test-user-001");
    expect(result?.name).toBe("Test User");
  });

  it("returns null for unauthenticated context", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result).toBeNull();
  });
});

describe("profile router", () => {
  it("rejects unauthenticated profile.get", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.profile.get()).rejects.toThrow();
  });

  it("rejects unauthenticated profile.update", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.profile.update({ grade: "3학년", major: "경영학" })
    ).rejects.toThrow();
  });
});

describe("activity router", () => {
  it("rejects unauthenticated activity.list", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.activity.list()).rejects.toThrow();
  });

  it("rejects unauthenticated activity.create", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.activity.create({
        activityType: "학업",
        title: "테스트 활동",
      })
    ).rejects.toThrow();
  });

  it("accepts valid activity.create input", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    // Valid input with required fields should succeed (writes to DB)
    const result = await caller.activity.create({
      activityType: "학업",
      title: "테스트 활동",
      description: "테스트 설명",
    });
    expect(result).toEqual({ success: true });
  });
});

describe("interview router", () => {
  it("allows public access to interview.questions", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    // Should not throw even for unauthenticated users
    const result = await caller.interview.questions();
    expect(Array.isArray(result)).toBe(true);
  });

  it("rejects unauthenticated interview.submitAnswer", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.interview.submitAnswer({
        questionId: 1,
        answer: "테스트 답변",
      })
    ).rejects.toThrow();
  });
});

describe("chat router", () => {
  it("rejects unauthenticated chat.getSession", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.chat.getSession()).rejects.toThrow();
  });

  it("rejects unauthenticated chat.sendMessage", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.chat.sendMessage({ message: "안녕하세요" })
    ).rejects.toThrow();
  });

  it("rejects unauthenticated chat.completeSession", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.chat.completeSession()).rejects.toThrow();
  });

  it("rejects unauthenticated chat.resetSession", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.chat.resetSession()).rejects.toThrow();
  });

  it("validates sendMessage input - empty string rejected", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.chat.sendMessage({ message: "" })
    ).rejects.toThrow();
  });
});

describe("report router", () => {
  it("rejects unauthenticated report.get", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.report.get()).rejects.toThrow();
  });
});
