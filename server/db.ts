import { eq, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, userProfiles, InsertUserProfile, activityLogs, InsertActivityLog, interviewQuestions, interviewAnswers, InsertInterviewAnswer, analysisReports, InsertAnalysisReport, jobRecommendations, InsertJobRecommendation, notifications, InsertNotification, chatSessions, InsertChatSession } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

// TODO: add feature queries here as your schema grows.

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// 사용자 프로필 관련 쿼리
export async function getUserProfile(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createOrUpdateUserProfile(userId: number, profile: Omit<InsertUserProfile, 'userId'>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const existing = await getUserProfile(userId);
  if (existing) {
    await db.update(userProfiles)
      .set({ ...profile, userId })
      .where(eq(userProfiles.userId, userId));
  } else {
    await db.insert(userProfiles).values({ ...profile, userId });
  }
}

// 활동 기록 관련 쿼리
export async function getActivityLogs(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(activityLogs).where(eq(activityLogs.userId, userId));
}

export async function createActivityLog(userId: number, log: Omit<InsertActivityLog, 'userId'>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(activityLogs).values({ ...log, userId });
}

// 인터뷰 질문 관련 쿼리
export async function getInterviewQuestions() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(interviewQuestions).orderBy(interviewQuestions.questionNumber);
}

export async function getInterviewQuestion(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(interviewQuestions).where(eq(interviewQuestions.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// 인터뷰 답변 관련 쿼리
export async function getInterviewAnswers(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(interviewAnswers).where(eq(interviewAnswers.userId, userId));
}

export async function createInterviewAnswer(userId: number, answer: Omit<InsertInterviewAnswer, 'userId'>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(interviewAnswers).values({ ...answer, userId });
}

// 분석 보고서 관련 쿼리
export async function getAnalysisReport(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(analysisReports).where(eq(analysisReports.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createAnalysisReport(userId: number, report: Omit<InsertAnalysisReport, 'userId'>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(analysisReports).values({ ...report, userId });
  return result;
}

// 알림 관련 쿼리
export async function createNotification(userId: number, notification: Omit<InsertNotification, 'userId'>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(notifications).values({ ...notification, userId });
}

// 관리자용: 전체 사용자 목록 조회
export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(users).orderBy(desc(users.createdAt));
}

// 관리자용: 사용자의 대화 세션 조회
export async function getUserChatSessions(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(chatSessions).where(eq(chatSessions.userId, userId)).orderBy(desc(chatSessions.createdAt));
}

// 관리자용: 전체 통계
export async function getAdminStats() {
  const db = await getDb();
  if (!db) return { totalUsers: 0, completedChats: 0, pendingReports: 0, completedReports: 0 };
  const allUsers = await db.select().from(users);
  const completedSessions = await db.select().from(chatSessions);
  const allReports = await db.select().from(analysisReports);
  return {
    totalUsers: allUsers.filter(u => u.role === 'user').length,
    completedChats: completedSessions.filter((s: any) => s.status === 'completed' || s.status === 'analyzed').length,
    pendingReports: allReports.filter((r: any) => r.status === 'pending' || r.status === 'in_progress').length,
    completedReports: allReports.filter((r: any) => r.status === 'completed' || r.status === 'delivered').length,
  };
}

// 분석 보고서 업데이트
export async function updateAnalysisReport(reportId: number, data: Partial<InsertAnalysisReport>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(analysisReports).set(data).where(eq(analysisReports.id, reportId));
}

// 사용자별 분석 보고서 목록
export async function getAnalysisReportsByAdmin(adminId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(analysisReports).where(eq(analysisReports.adminId, adminId)).orderBy(desc(analysisReports.createdAt));
}

// 직무 추천 관련 쿼리
export async function getJobRecommendationsByReport(reportId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(jobRecommendations).where(eq(jobRecommendations.reportId, reportId));
}

export async function createJobRecommendation(data: InsertJobRecommendation) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(jobRecommendations).values(data);
}

export async function deleteJobRecommendationsByReport(reportId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(jobRecommendations).where(eq(jobRecommendations.reportId, reportId));
}

// 알림 조회
export async function getUserNotifications(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt));
}

export async function markNotificationRead(notificationId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, notificationId));
}

// 대화 세션 관련 쿼리
export async function getActiveChatSession(userId: number, sessionType: string = "onboarding") {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(chatSessions)
    .where(eq(chatSessions.userId, userId))
    .orderBy(desc(chatSessions.createdAt))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createChatSession(userId: number, sessionType: string = "onboarding") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(chatSessions).values({
    userId,
    sessionType,
    messages: JSON.stringify([]),
    status: "active",
  });
  return result;
}

export async function updateChatSession(sessionId: number, data: { messages?: unknown; extractedProfile?: unknown; status?: "active" | "completed" | "analyzed" }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const updateData: Record<string, unknown> = {};
  if (data.messages !== undefined) updateData.messages = JSON.stringify(data.messages);
  if (data.extractedProfile !== undefined) updateData.extractedProfile = JSON.stringify(data.extractedProfile);
  if (data.status !== undefined) updateData.status = data.status;
  await db.update(chatSessions).set(updateData).where(eq(chatSessions.id, sessionId));
}
