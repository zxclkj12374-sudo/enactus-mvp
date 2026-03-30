import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure, adminProcedure } from "./_core/trpc";
import { z } from "zod";
import { invokeLLM } from "./_core/llm";
import {
  getUserProfile, createOrUpdateUserProfile,
  getActivityLogs, createActivityLog,
  getInterviewQuestions, getInterviewAnswers, createInterviewAnswer,
  getAnalysisReport, createAnalysisReport, updateAnalysisReport,
  getActiveChatSession, createChatSession, updateChatSession,
  getAllUsers, getUserChatSessions, getAdminStats,
  getJobRecommendationsByReport, createJobRecommendation, deleteJobRecommendationsByReport,
  createNotification, getUserNotifications, markNotificationRead,
} from "./db";

const ONBOARDING_SYSTEM_PROMPT = `당신은 NO:DE의 전문 커리어 상담사입니다. 사용자와 자연스러운 대화를 통해 현재 상황, 행동 패턴, 무의식적 성향을 깊이 있게 파악하는 것이 목표입니다.

## 핵심 원칙
1. **절대로 직접적으로 민감한 정보를 묻지 마세요.** "집안 사정이 어떤가요?", "경제적으로 어려운가요?" 같은 질문은 금지입니다.
2. **한 번에 하나의 질문**만 하세요. 여러 질문을 한꺼번에 하지 마세요.
3. **꼬리 질문을 반드시 활용하세요.** 하나의 주제에 대해 최소 2~3번은 깊이 파고드세요. 표면적 답변에 절대 만족하지 마세요.
4. **"왜?"를 자주 물으세요.** 사용자의 선택, 행동, 감정 뒤에 숨겨진 이유를 탐색하세요.
5. **이전 답변을 기억하고 연결하세요.** 앞서 말한 내용과 현재 답변 사이의 연결점이나 모순을 발견하면 자연스럽게 짚어주세요.

## 대화 단계
각 단계에서 충분한 정보를 얻기 전에 다음 단계로 넘어가지 마세요.

### 1단계 - 워밍업 (1~3번째 응답)
- 목표: 편안한 분위기 조성, 기본 정보(학년, 전공) 파악
- 톤: 가볍고 친근하게. 짧은 답변에는 짧게 반응.
- 예: "어떤 공부를 하고 계세요?" → "몇 학년이세요?" → "그 전공을 선택한 특별한 이유가 있었나요?"

### 2단계 - 일상 탐색 (4~7번째 응답)
- 목표: 일상 패턴, 시간 활용, 현재 활동 파악
- 톤: 호기심을 보이며 자연스럽게
- 꼬리 질문: "요즘 하루를 어떻게 보내세요?" → "그 중에서 가장 시간을 많이 쓰는 건?" → "그걸 할 때 기분이 어때요?"
- 간접 파악: 아르바이트 여부, 시간적 여유, 경제적 상황을 대화 속에서 자연스럽게 읽어내세요

### 3단계 - 가치관 탐색 (8~12번째 응답)
- 목표: 보람, 동기, 미래 비전, 의사결정 방식 파악
- 톤: 진지하지만 부담 없이
- 핵심 질문들:
  - "어떤 일을 할 때 시간 가는 줄 모르세요?"
  - "최근에 스스로 뿌듯했던 순간이 있다면?"
  - "5년 후에 어떤 모습이면 좋겠어요?"
  - "갑자기 한 달 동안 자유 시간이 생기면 뭘 하고 싶어요? 왜요?"
- 꼬리 질문으로 "왜 그렇게 생각하세요?"를 반드시 물으세요

### 4단계 - 깊은 탐색 (13~18번째 응답)
- 목표: 주변 환경의 영향, 제약 사항, 무의식적 패턴을 간접적으로 파악
- 톤: 공감적이고 따뜻하게, 판단하지 않는 태도
- 간접 질문 전략:
  - 가정환경: "진로 고민을 누구와 가장 많이 이야기하세요?" → "그분은 어떤 반응이었어요?" → "그 반응이 본인 결정에 영향을 주나요?"
  - 경제적 상황: "졸업 후 바로 취업을 원하시는 편인가요, 아니면 더 준비하고 싶은 게 있나요?" → "어떤 이유로 그렇게 생각하세요?"
  - 주변 압박: "주변 친구들은 요즘 어떤 준비를 하고 있어요?" → "그걸 보면 어떤 생각이 드세요?"
- **모순점 감지**: 이전에 "도전적인 일을 좋아한다"고 했는데 안정적 직업을 원한다면 → "앞에서 도전적인 일에 끌린다고 하셨는데, 안정적인 직업도 중요하시군요. 두 가지 사이에서 어떤 느낌이세요?"

### 5단계 - 정리 (19번째 응답 이후)
- 목표: 대화 내용 요약, 핵심 인사이트 공유
- 톤: 따뜻하고 격려하는
- "오늘 대화를 통해 몇 가지 인상적인 점을 발견했어요. [구체적 내용 2-3가지 언급]. 이 내용을 바탕으로 전문가가 더 깊이 분석해 드릴 예정이에요."

## 응답 톤 동적 조절 규칙

### 사용자가 짧게 답할 때 (1~5단어)
- 반응도 짧게: "네, 알겠어요!" 정도로 가볍게 받고 바로 다음 질문
- 부담 주지 않기: "좀 더 자세히 말해주세요" 같은 압박 금지
- 대신 구체적인 선택지를 제시: "혹시 A 같은 건가요, 아니면 B에 더 가까운가요?"

### 사용자가 길게 답할 때 (3문장 이상)
- 핵심을 짚어서 반응: "아, ~한 부분이 특히 인상적이네요."
- 더 깊이 파고들기: 답변 속 감정이나 가치관을 포착해서 꼬리 질문
- 공감 표현 후 연결 질문: "그런 경험이 있으셨군요. 그게 지금의 진로 생각에도 영향을 줬을까요?"

### 사용자가 방어적이거나 회피할 때
- 주제를 부드럽게 전환: "괜찮아요, 다른 이야기를 해볼까요?"
- 나중에 다른 각도로 다시 접근
- 절대 추궁하지 않기

### 사용자가 감정적일 때
- 먼저 충분히 공감: "그런 마음이 드는 게 당연해요."
- 질문을 잠시 멈추고 경청하는 자세
- 준비가 되면 부드럽게 대화 이어가기

## 금지 사항
- "집안 사정", "경제적 어려움", "부모님 직업" 등 직접적 질문 금지
- 한 번에 2개 이상 질문 금지
- 판단이나 평가하는 말투 금지 ("그건 좀 아쉽네요" 등)
- 이모지 과다 사용 금지 (최대 1개)
- 5문장 이상의 긴 응답 금지

첫 인사: "안녕하세요! NO:DE 커리어 상담에 오신 것을 환영합니다. 편하게 대화하면서 당신에게 맞는 진로를 함께 찾아볼게요. 먼저, 지금 어떤 공부를 하고 계신지 알려주실 수 있을까요?"`;

const PROFILE_EXTRACTION_PROMPT = `당신은 전문 커리어 심리 분석가입니다. 다음 대화 내용을 심층 분석하여 사용자의 프로필 정보를 JSON으로 추출하세요.

## 분석 원칙
1. **모든 분석에 근거를 명시하세요.** "N번째 응답에서 ~라고 말한 것으로 보아" 형식으로 대화의 구체적 부분을 인용하세요.
2. **답변 간 연결성을 분석하세요.** 서로 다른 질문에 대한 답변들이 어떻게 연결되는지 파악하세요.
3. **모순점을 반드시 찾아내세요.** 말과 행동의 불일치, 이상과 현실의 괴리를 짚어주세요.
4. **표면적 답변 너머를 분석하세요.** 사용자가 직접 말하지 않았지만 대화 패턴에서 추론할 수 있는 내용을 포함하세요.

## 추출할 정보
- grade: 학년 (예: "3학년", "졸업예정")
- major: 전공 (예: "경영학", "컴퓨터공학")
- familyStatus: 가정 환경 분석 (직접 언급이 없더라도, 아르바이트 여부, 시간 활용 패턴, 졸업 후 계획의 급박함 등에서 간접적으로 추론. 근거를 반드시 명시)
- socialPressure: 주변 환경의 압박 분석 (가족/친구/사회의 기대, 비교 심리, 또래 압박 등. 대화에서 "주변에서", "부모님이", "친구들은" 등의 언급을 근거로 분석)
- additionalInfo: 기타 중요한 맥락 정보 (대화에서 발견한 특이사항, 숨겨진 강점, 잠재적 리스크 등)
- keywords: 핵심 키워드 배열 (성향, 관심사, 강점, 약점 등 최소 5개 이상)
- personality: 성격 유형 분석 (MBTI 추정이 아닌, 대화에서 드러난 실제 행동 패턴 기반 분석. 예: "새로운 것에 빠르게 흥미를 느끼지만 지속성이 약한 탐색형" 등)
- interests: 관심 분야 배열 (직접 언급 + 대화 맥락에서 추론한 잠재적 관심사 포함)
- constraints: 제약 사항 분석 (시간적, 경제적, 환경적, 심리적 제약을 대화 맥락에서 추론. 근거 명시)
- unconsciousPatterns: 무의식적 패턴 심층 분석 (답변 간 모순점, 반복적으로 등장하는 주제, 회피하는 주제, 강조하는 가치와 실제 행동의 괴리 등. 구체적 대화 내용을 인용하여 분석)

대화에서 직접 언급되지 않은 정보는 null로 설정하되, 간접적으로 추론 가능한 경우에는 "[추론] ~" 형식으로 근거와 함께 작성하세요.`;

const PROFILE_EXTRACTION_SCHEMA = {
  type: "json_schema" as const,
  json_schema: {
    name: "profile_extraction",
    strict: true,
    schema: {
      type: "object",
      properties: {
        grade: { type: ["string", "null"], description: "학년" },
        major: { type: ["string", "null"], description: "전공" },
        familyStatus: { type: ["string", "null"], description: "가정 환경 분석" },
        socialPressure: { type: ["string", "null"], description: "주변 환경 압박" },
        additionalInfo: { type: ["string", "null"], description: "기타 정보" },
        keywords: { type: "array", items: { type: "string" }, description: "핵심 키워드" },
        personality: { type: ["string", "null"], description: "성격 유형" },
        interests: { type: "array", items: { type: "string" }, description: "관심 분야" },
        constraints: { type: ["string", "null"], description: "제약 사항" },
        unconsciousPatterns: { type: ["string", "null"], description: "무의식적 패턴" },
      },
      required: ["grade", "major", "familyStatus", "socialPressure", "additionalInfo", "keywords", "personality", "interests", "constraints", "unconsciousPatterns"],
      additionalProperties: false,
    },
  },
};

function parseMessages(raw: unknown): Array<{ role: string; content: string }> {
  if (!raw) return [];
  try {
    return typeof raw === 'string' ? JSON.parse(raw) : raw as Array<{ role: string; content: string }>;
  } catch {
    return [];
  }
}

/** 대화 컨텍스트를 분석하여 동적 시스템 프롬프트 보조 지시를 생성 */
function buildDynamicContext(messages: Array<{ role: string; content: string }>): string {
  const userMessages = messages.filter(m => m.role === "user");
  const count = userMessages.length;
  if (count === 0) return "";

  // 1. 현재 대화 단계 판별
  let stage = "";
  if (count <= 3) stage = "현재 1단계(워밍업)입니다. 가볍고 친근하게 기본 정보를 파악하세요.";
  else if (count <= 7) stage = "현재 2단계(일상 탐색)입니다. 일상 패턴과 활동을 파악하세요.";
  else if (count <= 12) stage = "현재 3단계(가치관 탐색)입니다. 보람, 동기, 미래 비전을 탐색하세요.";
  else if (count <= 18) stage = "현재 4단계(깊은 탐색)입니다. 주변 환경, 제약, 무의식적 패턴을 간접적으로 파악하세요.";
  else stage = "현재 5단계(정리)입니다. 대화를 요약하고 핵심 인사이트를 공유하세요.";

  // 2. 최근 사용자 응답 길이 분석
  const lastMsg = userMessages[userMessages.length - 1];
  const lastLen = lastMsg?.content.length || 0;
  let toneTip = "";
  if (lastLen <= 10) {
    toneTip = "사용자가 짧게 답했습니다. 반응도 짧게 하고, 구체적인 선택지를 제시하세요. 부담을 주지 마세요.";
  } else if (lastLen <= 30) {
    toneTip = "사용자가 보통 길이로 답했습니다. 핵심을 짚어 반응하고 자연스럽게 꼬리 질문을 하세요.";
  } else {
    toneTip = "사용자가 길게 답했습니다. 답변 속 감정이나 가치관을 포착하여 깊이 파고드세요. 공감을 충분히 표현하세요.";
  }

  // 3. 감정/방어 패턴 감지
  const defensiveKeywords = ["잘 모르겠", "그냥", "별로", "상관없", "아무거나", "글쎄", "몰라", "패스"];
  const emotionalKeywords = ["힘들", "어렵", "걱정", "불안", "스트레스", "지치", "우울", "답답", "막막"];
  const isDefensive = defensiveKeywords.some(k => lastMsg?.content.includes(k));
  const isEmotional = emotionalKeywords.some(k => lastMsg?.content.includes(k));

  let emotionTip = "";
  if (isDefensive) {
    emotionTip = "사용자가 방어적/회피적 답변을 했습니다. 주제를 부드럽게 전환하고, 나중에 다른 각도로 다시 접근하세요. 절대 추궁하지 마세요.";
  } else if (isEmotional) {
    emotionTip = "사용자가 감정적인 표현을 했습니다. 먼저 충분히 공감하세요. 질문을 잠시 멈추고 경청하는 자세를 보여주세요.";
  }

  // 4. 모순점 감지 힌트
  let contradictionHint = "";
  if (count >= 5) {
    const allUserText = userMessages.map(m => m.content).join(" ");
    const wantsChallenge = /도전|새로운|모험|창업|시작/.test(allUserText);
    const wantsStability = /안정|공무원|대기업|월급|정규직/.test(allUserText);
    const likesTeam = /팀|협업|같이|함께|동아리/.test(allUserText);
    const likesAlone = /혼자|독립|자유|개인/.test(allUserText);

    if (wantsChallenge && wantsStability) {
      contradictionHint = "[모순 감지] 사용자가 도전/새로움과 안정을 동시에 언급했습니다. 이 두 가치 사이의 우선순위를 자연스럽게 탐색하세요.";
    }
    if (likesTeam && likesAlone) {
      contradictionHint += " [모순 감지] 협업과 독립 작업 모두 언급했습니다. 어떤 상황에서 각각을 선호하는지 물어보세요.";
    }
  }

  return `\n\n---\n[동적 컨텍스트]\n${stage}\n${toneTip}\n${emotionTip}\n${contradictionHint}\n총 대화 횟수: ${count}회`.trim();
}

function syncProfileToDb(userId: number, extractedProfile: any) {
  if (!extractedProfile) return;
  try {
    const profile = typeof extractedProfile === 'string' ? JSON.parse(extractedProfile) : extractedProfile;
    if (!profile || !profile.grade) return;
    createOrUpdateUserProfile(userId, {
      grade: profile.grade || undefined,
      major: profile.major || undefined,
      familyStatus: profile.familyStatus || undefined,
      socialPressure: profile.socialPressure || undefined,
      additionalInfo: JSON.stringify({
        keywords: profile.keywords,
        personality: profile.personality,
        interests: profile.interests,
        constraints: profile.constraints,
        unconsciousPatterns: profile.unconsciousPatterns,
      }),
    }).catch(e => console.warn("[Chat] Profile sync failed:", e));
  } catch (e) {
    console.warn("[Chat] Profile sync parse failed:", e);
  }
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ===== 대화형 AI 온보딩 =====
  chat: router({
    getSession: protectedProcedure.query(async ({ ctx }) => {
      let session = await getActiveChatSession(ctx.user.id);
      if (!session) {
        await createChatSession(ctx.user.id, "onboarding");
        session = await getActiveChatSession(ctx.user.id);
      }
      if (!session) throw new Error("Failed to create chat session");

      let messages = parseMessages(session.messages);

      if (messages.length === 0) {
        const llmResult = await invokeLLM({
          messages: [{ role: "system", content: ONBOARDING_SYSTEM_PROMPT }],
        });
        const aiContent = typeof llmResult.choices[0]?.message?.content === 'string'
          ? llmResult.choices[0].message.content : '';
        messages = [{ role: "assistant", content: aiContent }];
        await updateChatSession(session.id, { messages });
      }

      return {
        id: session.id,
        messages: messages.filter(m => m.role !== "system"),
        status: session.status,
        extractedProfile: session.extractedProfile,
      };
    }),

    sendMessage: protectedProcedure
      .input(z.object({ message: z.string().min(1) }))
      .mutation(async ({ ctx, input }) => {
        let session = await getActiveChatSession(ctx.user.id);
        if (!session) {
          await createChatSession(ctx.user.id, "onboarding");
          session = await getActiveChatSession(ctx.user.id);
        }
        if (!session) throw new Error("No active chat session");

        let messages = parseMessages(session.messages);
        messages.push({ role: "user", content: input.message });

        // 동적 컨텍스트를 시스템 프롬프트에 주입
        const dynamicContext = buildDynamicContext(messages);
        const llmMessages = [
          { role: "system" as const, content: ONBOARDING_SYSTEM_PROMPT + dynamicContext },
          ...messages.map(m => ({ role: m.role as "user" | "assistant", content: m.content })),
        ];

        const llmResult = await invokeLLM({ messages: llmMessages });
        const aiContent = typeof llmResult.choices[0]?.message?.content === 'string'
          ? llmResult.choices[0].message.content
          : '죄송합니다, 잠시 문제가 발생했어요. 다시 말씀해 주시겠어요?';
        messages.push({ role: "assistant", content: aiContent });

        const userMsgCount = messages.filter(m => m.role === "user").length;
        let extractedProfile = session.extractedProfile;

        // 더 빈번한 프로필 추출: 4회부터 매 2회마다
        if (userMsgCount >= 4 && userMsgCount % 2 === 0) {
          try {
            const extractionResult = await invokeLLM({
              messages: [
                { role: "system", content: PROFILE_EXTRACTION_PROMPT },
                { role: "user", content: `대화 내용:\n${messages.map(m => `${m.role}: ${m.content}`).join('\n')}` },
              ],
              response_format: PROFILE_EXTRACTION_SCHEMA,
            });
            const profileContent = extractionResult.choices[0]?.message?.content;
            if (typeof profileContent === 'string') {
              extractedProfile = JSON.parse(profileContent);
            }
          } catch (e) {
            console.warn("[Chat] Profile extraction failed:", e);
          }
        }

        await updateChatSession(session.id, { messages, extractedProfile });
        syncProfileToDb(ctx.user.id, extractedProfile);

        return { aiMessage: aiContent, extractedProfile, messageCount: userMsgCount };
      }),

    completeSession: protectedProcedure.mutation(async ({ ctx }) => {
      const session = await getActiveChatSession(ctx.user.id);
      if (!session) throw new Error("No active chat session");

      let messages = parseMessages(session.messages);

      try {
        const extractionResult = await invokeLLM({
          messages: [
            { role: "system", content: PROFILE_EXTRACTION_PROMPT },
            { role: "user", content: `대화 내용:\n${messages.map(m => `${m.role}: ${m.content}`).join('\n')}` },
          ],
          response_format: PROFILE_EXTRACTION_SCHEMA,
        });
        const profileContent = extractionResult.choices[0]?.message?.content;
        if (typeof profileContent === 'string') {
          const extractedProfile = JSON.parse(profileContent);
          await updateChatSession(session.id, { extractedProfile, status: "completed" });
          syncProfileToDb(ctx.user.id, extractedProfile);
          return { success: true, extractedProfile };
        }
      } catch (e) {
        console.warn("[Chat] Final extraction failed:", e);
      }

      await updateChatSession(session.id, { status: "completed" });
      return { success: true, extractedProfile: session.extractedProfile };
    }),

    resetSession: protectedProcedure.mutation(async ({ ctx }) => {
      await createChatSession(ctx.user.id, "onboarding");
      return { success: true };
    }),
  }),

  // ===== 사용자 프로필 =====
  profile: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      return await getUserProfile(ctx.user.id);
    }),
    update: protectedProcedure
      .input(z.object({
        grade: z.string().optional(),
        major: z.string().optional(),
        familyStatus: z.string().optional(),
        socialPressure: z.string().optional(),
        additionalInfo: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await createOrUpdateUserProfile(ctx.user.id, input);
        return { success: true };
      }),
  }),

  // ===== 활동 기록 =====
  activity: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await getActivityLogs(ctx.user.id);
    }),
    create: protectedProcedure
      .input(z.object({
        activityType: z.string(),
        title: z.string(),
        description: z.string().optional(),
        imageUrls: z.array(z.string()).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await createActivityLog(ctx.user.id, {
          activityType: input.activityType,
          title: input.title,
          description: input.description,
          imageUrls: input.imageUrls || [],
        });
        return { success: true };
      }),
  }),

  // ===== 인터뷰 =====
  interview: router({
    questions: publicProcedure.query(async () => {
      return await getInterviewQuestions();
    }),
    answers: protectedProcedure.query(async ({ ctx }) => {
      return await getInterviewAnswers(ctx.user.id);
    }),
    submitAnswer: protectedProcedure
      .input(z.object({
        questionId: z.number(),
        answer: z.string(),
        keywords: z.array(z.string()).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await createInterviewAnswer(ctx.user.id, {
          questionId: input.questionId,
          answer: input.answer,
          keywords: input.keywords || [],
        });
        return { success: true };
      }),
  }),

  // ===== 분석 보고서 (사용자용) =====
  report: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      const report = await getAnalysisReport(ctx.user.id);
      return report ?? null;
    }),
    getJobRecommendations: protectedProcedure.query(async ({ ctx }) => {
      const report = await getAnalysisReport(ctx.user.id);
      if (!report) return [];
      return await getJobRecommendationsByReport(report.id);
    }),
  }),

  // ===== 알림 =====
  notification: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await getUserNotifications(ctx.user.id);
    }),
    markRead: protectedProcedure
      .input(z.object({ notificationId: z.number() }))
      .mutation(async ({ input }) => {
        await markNotificationRead(input.notificationId);
        return { success: true };
      }),
    unreadCount: protectedProcedure.query(async ({ ctx }) => {
      const notifications = await getUserNotifications(ctx.user.id);
      return notifications.filter((n: any) => !n.isRead).length;
    }),
  }),

  // ===== 관리자 전용 =====
  admin: router({
    // 통계
    stats: adminProcedure.query(async () => {
      return await getAdminStats();
    }),

    // 전체 사용자 목록
    users: adminProcedure.query(async () => {
      return await getAllUsers();
    }),

    // 사용자 상세 정보 (프로필 + 대화 + 활동 + 인터뷰)
    userDetail: adminProcedure
      .input(z.object({ userId: z.number() }))
      .query(async ({ input }) => {
        const profile = await getUserProfile(input.userId);
        const chatSessions = await getUserChatSessions(input.userId);
        const activities = await getActivityLogs(input.userId);
        const answers = await getInterviewAnswers(input.userId);
        const report = await getAnalysisReport(input.userId);
        const jobRecs = report ? await getJobRecommendationsByReport(report.id) : [];
        return { profile, chatSessions, activities, answers, report, jobRecommendations: jobRecs };
      }),

    // 보고서 생성
    createReport: adminProcedure
      .input(z.object({
        userId: z.number(),
        situationAnalysis: z.string(),
        behaviorAnalysis: z.string(),
        unconsciousAnalysis: z.string(),
        actionPlan: z.string(),
        jobRecommendations: z.array(z.object({
          jobTitle: z.string(),
          company: z.string().optional(),
          reason: z.string(),
          requiredSkills: z.array(z.string()).optional(),
          careerPath: z.string().optional(),
        })),
      }))
      .mutation(async ({ ctx, input }) => {
        // 기존 보고서가 있으면 업데이트, 없으면 생성
        const existingReport = await getAnalysisReport(input.userId);

        let reportId: number;
        if (existingReport) {
          await updateAnalysisReport(existingReport.id, {
            adminId: ctx.user.id,
            situationAnalysis: input.situationAnalysis,
            behaviorAnalysis: input.behaviorAnalysis,
            unconsciousAnalysis: input.unconsciousAnalysis,
            actionPlan: input.actionPlan,
            status: "completed",
            completedAt: new Date(),
          });
          reportId = existingReport.id;
          // 기존 직무 추천 삭제 후 재생성
          await deleteJobRecommendationsByReport(reportId);
        } else {
          const result = await createAnalysisReport(input.userId, {
            adminId: ctx.user.id,
            situationAnalysis: input.situationAnalysis,
            behaviorAnalysis: input.behaviorAnalysis,
            unconsciousAnalysis: input.unconsciousAnalysis,
            actionPlan: input.actionPlan,
            status: "completed",
            completedAt: new Date(),
          });
          reportId = (result as any)[0]?.insertId || (result as any).insertId;
        }

        // 직무 추천 저장
        for (const job of input.jobRecommendations) {
          await createJobRecommendation({
            reportId,
            jobTitle: job.jobTitle,
            company: job.company,
            reason: job.reason,
            requiredSkills: job.requiredSkills || [],
            careerPath: job.careerPath,
          });
        }

        // 사용자에게 알림 전송
        await createNotification(input.userId, {
          type: "report_completed",
          title: "분석 보고서가 완성되었습니다",
          content: "NO:DE 전문가가 당신의 커리어 분석 보고서를 작성했습니다. 지금 확인해 보세요!",
          relatedId: reportId,
        });

        return { success: true, reportId };
      }),

    // 보고서 전달 (상태를 delivered로 변경)
    deliverReport: adminProcedure
      .input(z.object({ userId: z.number() }))
      .mutation(async ({ input }) => {
        const report = await getAnalysisReport(input.userId);
        if (!report) throw new Error("Report not found");
        await updateAnalysisReport(report.id, { status: "delivered" });

        await createNotification(input.userId, {
          type: "report_delivered",
          title: "분석 보고서가 전달되었습니다",
          content: "커리어 분석 보고서를 확인하고, 추천 직무와 액션 플랜을 살펴보세요.",
          relatedId: report.id,
        });

        return { success: true };
      }),

    // AI 보조 분석 생성
    generateAIAnalysis: adminProcedure
      .input(z.object({ userId: z.number() }))
      .mutation(async ({ input }) => {
        const profile = await getUserProfile(input.userId);
        const chatSessions = await getUserChatSessions(input.userId);
        const activities = await getActivityLogs(input.userId);

        // 대화 내용 추출
        let chatContent = "";
        for (const session of chatSessions) {
          const msgs = parseMessages(session.messages);
          chatContent += msgs.map(m => `${m.role}: ${m.content}`).join('\n') + '\n\n';
        }

        // 활동 기록 요약
        const activitySummary = activities.map((a: any) =>
          `[${a.activityType}] ${a.title}: ${a.description || '설명 없음'}`
        ).join('\n');

        const analysisPrompt = `당신은 전문 커리어 컨설턴트입니다. 아래 데이터를 바탕으로 심층 분석을 수행하세요.

## 사용자 프로필
${profile ? `학년: ${profile.grade || '미상'}, 전공: ${profile.major || '미상'}` : '프로필 정보 없음'}
${profile?.additionalInfo ? `추가 분석: ${profile.additionalInfo}` : ''}

## AI 상담 대화 내용
${chatContent || '대화 기록 없음'}

## 활동 기록
${activitySummary || '활동 기록 없음'}

## 분석 요청
다음 4가지 영역을 각각 상세하게 분석하세요:

1. **현 상황 분석**: 학업 상태, 환경적 요인, 제약 사항을 종합적으로 분석. 대화에서 간접적으로 파악된 가정 환경, 경제적 상황, 주변의 기대와 압박 등을 포함.

2. **행동 패턴 분석**: 활동 기록과 대화에서 드러나는 행동 패턴, 의사결정 방식, 시간 활용 패턴을 분석. 어떤 상황에서 적극적이고 어떤 상황에서 소극적인지 파악.

3. **무의식 분석**: 대화 속 답변 패턴, 모순점, 반복되는 주제에서 드러나는 무의식적 성향을 분석. 말과 행동의 불일치, 회피하는 주제, 강조하는 가치관 등을 짚어줌.

4. **액션 플랜**: 현재 상황에서 실현 가능한 구체적인 행동 계획. 단기(1-3개월), 중기(3-6개월), 장기(6-12개월) 계획을 포함.

각 분석은 반드시 대화 내용의 구체적인 부분을 근거로 제시하세요.`;

        const jobPrompt = `위 분석을 바탕으로, 이 사용자에게 적합한 세부 직무를 3-5개 추천하세요.

## 추천 기준
- "마케터", "개발자" 같은 포괄적 직무가 아닌, "B2B SaaS 콘텐츠 마케터", "핀테크 프론트엔드 개발자" 수준의 세부 직무
- 현재 학년과 상황을 고려하여 실제 입사 가능한 수준
- 각 직무에 대해: 추천 이유, 필요 스킬, 커리어 경로를 구체적으로 제시`;

        const analysisResult = await invokeLLM({
          messages: [
            { role: "system", content: "당신은 전문 커리어 컨설턴트입니다. 한국어로 답변하세요." },
            { role: "user", content: analysisPrompt },
          ],
        });

        const analysisContent = typeof analysisResult.choices[0]?.message?.content === 'string'
          ? analysisResult.choices[0].message.content : '';

        // 직무 추천 생성
        const jobResult = await invokeLLM({
          messages: [
            { role: "system", content: "당신은 전문 커리어 컨설턴트입니다. 한국어로 답변하세요." },
            { role: "user", content: analysisPrompt },
            { role: "assistant", content: analysisContent },
            { role: "user", content: jobPrompt },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "job_recommendations",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  recommendations: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        jobTitle: { type: "string", description: "세부 직무명" },
                        company: { type: "string", description: "추천 회사/기관 유형" },
                        reason: { type: "string", description: "추천 이유" },
                        requiredSkills: { type: "array", items: { type: "string" }, description: "필요 스킬" },
                        careerPath: { type: "string", description: "커리어 경로" },
                      },
                      required: ["jobTitle", "company", "reason", "requiredSkills", "careerPath"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["recommendations"],
                additionalProperties: false,
              },
            },
          },
        });

        let jobRecommendations: any[] = [];
        try {
          const jobContent = jobResult.choices[0]?.message?.content;
          if (typeof jobContent === 'string') {
            const parsed = JSON.parse(jobContent);
            jobRecommendations = parsed.recommendations || [];
          }
        } catch (e) {
          console.warn("[Admin] Job recommendation parse failed:", e);
        }

        // 분석 내용을 4개 섹션으로 분리
        const sections = analysisContent.split(/(?=\d+\.\s*\*\*)/);
        const situationAnalysis = sections.find(s => s.includes('상황 분석')) || sections[0] || '';
        const behaviorAnalysis = sections.find(s => s.includes('행동 패턴')) || sections[1] || '';
        const unconsciousAnalysis = sections.find(s => s.includes('무의식')) || sections[2] || '';
        const actionPlan = sections.find(s => s.includes('액션 플랜')) || sections[3] || '';

        return {
          situationAnalysis: situationAnalysis.trim(),
          behaviorAnalysis: behaviorAnalysis.trim(),
          unconsciousAnalysis: unconsciousAnalysis.trim(),
          actionPlan: actionPlan.trim(),
          jobRecommendations,
          rawAnalysis: analysisContent,
        };
      }),
  }),
});

export type AppRouter = typeof appRouter;
