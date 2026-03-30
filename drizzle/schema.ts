import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, json, decimal, boolean } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// 사용자 현황 정보 테이블
export const userProfiles = mysqlTable("user_profiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  grade: varchar("grade", { length: 50 }), // 학년 (1학년, 2학년 등)
  major: varchar("major", { length: 100 }), // 전공
  familyStatus: text("family_status"), // 집안 사정 (텍스트)
  socialPressure: text("social_pressure"), // 주변 눈치 (텍스트)
  additionalInfo: text("additional_info"), // 추가 정보
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type UserProfile = typeof userProfiles.$inferSelect;
export type InsertUserProfile = typeof userProfiles.$inferInsert;

// 활동 기록 테이블
export const activityLogs = mysqlTable("activity_logs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  activityType: varchar("activity_type", { length: 50 }).notNull(), // 학업, 대외활동, 개인프로젝트 등
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  imageUrls: json("image_urls"), // JSON 배열로 여러 이미지 저장
  keywords: json("keywords"), // 자동 추출된 키워드
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type ActivityLog = typeof activityLogs.$inferSelect;
export type InsertActivityLog = typeof activityLogs.$inferInsert;

// 심층 인터뷰 질문 테이블
export const interviewQuestions = mysqlTable("interview_questions", {
  id: int("id").autoincrement().primaryKey(),
  questionNumber: int("question_number").notNull(),
  question: text("question").notNull(),
  category: varchar("category", { length: 100 }), // 현황, 과거경험, 가상상황 등
  followUpQuestions: json("follow_up_questions"), // 꼬리 질문들
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type InterviewQuestion = typeof interviewQuestions.$inferSelect;
export type InsertInterviewQuestion = typeof interviewQuestions.$inferInsert;

// 인터뷰 답변 테이블
export const interviewAnswers = mysqlTable("interview_answers", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  questionId: int("question_id").notNull(),
  answer: text("answer").notNull(),
  keywords: json("keywords"), // 자동 추출된 키워드
  sentiment: varchar("sentiment", { length: 20 }), // positive, neutral, negative
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type InterviewAnswer = typeof interviewAnswers.$inferSelect;
export type InsertInterviewAnswer = typeof interviewAnswers.$inferInsert;

// 분석 보고서 테이블
export const analysisReports = mysqlTable("analysis_reports", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  adminId: int("admin_id"), // 분석을 수행한 관리자
  status: mysqlEnum("status", ["pending", "in_progress", "completed", "delivered"]).default("pending").notNull(),
  situationAnalysis: text("situation_analysis"), // 현 상황 분석
  behaviorAnalysis: text("behavior_analysis"), // 행동 패턴 분석
  unconsciousAnalysis: text("unconscious_analysis"), // 무의식 분석
  jobRecommendations: json("job_recommendations"), // 추천 직무 (JSON 배열)
  actionPlan: text("action_plan"), // 액션 플랜
  reportUrl: varchar("report_url", { length: 500 }), // 생성된 PDF 보고서 URL
  createdAt: timestamp("created_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type AnalysisReport = typeof analysisReports.$inferSelect;
export type InsertAnalysisReport = typeof analysisReports.$inferInsert;

// 직무 추천 테이블
export const jobRecommendations = mysqlTable("job_recommendations", {
  id: int("id").autoincrement().primaryKey(),
  reportId: int("report_id").notNull(),
  jobTitle: varchar("job_title", { length: 200 }).notNull(), // 세부 직무명
  company: varchar("company", { length: 200 }), // 추천 회사/기관
  reason: text("reason"), // 추천 이유
  requiredSkills: json("required_skills"), // 필요 스킬
  careerPath: text("career_path"), // 커리어 경로
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type JobRecommendation = typeof jobRecommendations.$inferSelect;
export type InsertJobRecommendation = typeof jobRecommendations.$inferInsert;

// 결제 정보 테이블
export const payments = mysqlTable("payments", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  reportId: int("report_id"),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 10 }).default("KRW").notNull(),
  status: mysqlEnum("status", ["pending", "completed", "failed", "refunded"]).default("pending").notNull(),
  paymentMethod: varchar("payment_method", { length: 50 }), // toss, card 등
  transactionId: varchar("transaction_id", { length: 200 }), // 결제 게이트웨이 거래 ID
  createdAt: timestamp("created_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = typeof payments.$inferInsert;

// 알림 테이블
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  type: varchar("type", { length: 50 }).notNull(), // report_completed, payment_confirmed 등
  title: varchar("title", { length: 200 }).notNull(),
  content: text("content"),
  relatedId: int("related_id"), // 관련 리소스 ID (reportId, paymentId 등)
  isRead: boolean("is_read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

// AI 대화 세션 테이블 (온보딩 대화 기록)
export const chatSessions = mysqlTable("chat_sessions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  sessionType: varchar("session_type", { length: 50 }).default("onboarding").notNull(),
  messages: json("messages"), // 전체 대화 기록 [{role, content}]
  extractedProfile: json("extracted_profile"), // LLM이 추출한 프로필 정보
  status: mysqlEnum("chat_status", ["active", "completed", "analyzed"]).default("active").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type ChatSession = typeof chatSessions.$inferSelect;
export type InsertChatSession = typeof chatSessions.$inferInsert;