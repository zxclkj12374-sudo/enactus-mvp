import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import {
  ChevronRight,
  ChevronLeft,
  ArrowLeft,
  ClipboardList,
  Loader2,
} from "lucide-react";

export default function InterviewPage() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});

  const questionsQuery = trpc.interview.questions.useQuery();
  const submitAnswerMutation = trpc.interview.submitAnswer.useMutation();

  const questions = questionsQuery.data || [];
  const currentQuestion = questions[currentQuestionIndex];
  const progress =
    questions.length > 0
      ? ((currentQuestionIndex + 1) / questions.length) * 100
      : 0;

  const handleAnswerChange = (value: string) => {
    if (currentQuestion) {
      setAnswers((prev) => ({ ...prev, [currentQuestion.id]: value }));
    }
  };

  const handleNext = async () => {
    if (currentQuestion && !answers[currentQuestion.id]) {
      toast.error("답변을 입력해 주세요.");
      return;
    }

    if (currentQuestion && answers[currentQuestion.id]) {
      try {
        await submitAnswerMutation.mutateAsync({
          questionId: currentQuestion.id,
          answer: answers[currentQuestion.id],
        });
      } catch {
        toast.error("답변 저장에 실패했습니다.");
        return;
      }
    }

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      toast.success("모든 질문에 답변했습니다!");
      setLocation("/portfolio");
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  if (questionsQuery.isLoading) {
    return (
      <div className="sacred-geometry-bg min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-yellow-600" />
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="sacred-geometry-bg min-h-screen">
        <header className="border-b border-yellow-200 bg-white/80 backdrop-blur sticky top-0 z-50">
          <div className="container flex items-center gap-3 py-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation("/")}
              className="hover:bg-yellow-50"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-yellow-500 to-yellow-700 rounded-lg flex items-center justify-center shadow-sm">
                <span className="text-white font-black text-xs tracking-tighter">
                  N:D
                </span>
              </div>
              <h1
                className="text-base font-bold"
                style={{ color: "#1a1f36" }}
              >
                심층 인터뷰
              </h1>
            </div>
          </div>
        </header>
        <div className="flex items-center justify-center" style={{ minHeight: "calc(100vh - 60px)" }}>
          <Card className="max-w-md w-full border border-yellow-200 bg-white/80 text-center">
            <CardContent className="pt-8 pb-8 space-y-4">
              <ClipboardList className="w-12 h-12 text-gray-300 mx-auto" />
              <p className="text-gray-500">
                아직 준비된 인터뷰 질문이 없습니다.
              </p>
              <p className="text-sm text-gray-400">
                AI 상담을 먼저 진행해 주세요.
              </p>
              <Button
                onClick={() => setLocation("/onboarding")}
                className="bg-yellow-600 hover:bg-yellow-700 text-white"
              >
                AI 상담 시작하기
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="sacred-geometry-bg min-h-screen">
      {/* 헤더 */}
      <header className="border-b border-yellow-200 bg-white/80 backdrop-blur sticky top-0 z-50">
        <div className="container flex justify-between items-center py-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation("/")}
              className="hover:bg-yellow-50"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-yellow-500 to-yellow-700 rounded-lg flex items-center justify-center shadow-sm">
                <span className="text-white font-black text-xs tracking-tighter">
                  N:D
                </span>
              </div>
              <div>
                <h1
                  className="text-base font-bold leading-tight"
                  style={{ color: "#1a1f36" }}
                >
                  심층 인터뷰
                </h1>
                <p className="text-xs text-gray-500">
                  질문 {currentQuestionIndex + 1} / {questions.length}
                </p>
              </div>
            </div>
          </div>
          <div className="text-sm font-semibold text-yellow-700">
            {Math.round(progress)}%
          </div>
        </div>
        <div className="h-1 bg-yellow-100">
          <div
            className="h-full bg-yellow-500 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </header>

      <div className="container max-w-2xl py-6">
        <Card className="border border-yellow-200 bg-white/80">
          <CardHeader>
            <CardTitle style={{ color: "#1a1f36" }}>
              {currentQuestion.question}
            </CardTitle>
            {currentQuestion.category && (
              <p className="text-sm text-yellow-700 mt-1">
                {currentQuestion.category}
              </p>
            )}
          </CardHeader>

          <CardContent className="space-y-5">
            <Textarea
              placeholder="당신의 생각과 경험을 자유롭게 작성해 주세요."
              value={answers[currentQuestion.id] || ""}
              onChange={(e) => handleAnswerChange(e.target.value)}
              rows={6}
              className="border-yellow-200 focus:border-yellow-400"
            />

            {currentQuestion.followUpQuestions &&
            Array.isArray(currentQuestion.followUpQuestions) &&
            (currentQuestion.followUpQuestions as string[]).length > 0 ? (
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <p
                  className="text-sm font-semibold mb-2"
                  style={{ color: "#1a1f36" }}
                >
                  추가 고려사항:
                </p>
                <ul className="space-y-1">
                  {(currentQuestion.followUpQuestions as string[]).map(
                    (q: string, idx: number) => (
                      <li key={idx} className="text-sm text-gray-600">
                        {q}
                      </li>
                    )
                  )}
                </ul>
              </div>
            ) : null}

            <div className="flex justify-between gap-4 pt-2">
              <Button
                onClick={handlePrevious}
                disabled={currentQuestionIndex === 0}
                variant="outline"
                className="border-yellow-300 hover:bg-yellow-50"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                이전
              </Button>

              <Button
                onClick={handleNext}
                disabled={submitAnswerMutation.isPending}
                className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white font-semibold"
              >
                {submitAnswerMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-1" />
                ) : null}
                {currentQuestionIndex === questions.length - 1
                  ? "완료"
                  : "다음"}
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
