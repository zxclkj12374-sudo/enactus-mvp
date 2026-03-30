import { useAuth } from "@/_core/hooks/useAuth";
import { AIChatBox, type Message } from "@/components/AIChatBox";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import {
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  MessageCircle,
  Loader2,
} from "lucide-react";

export default function OnboardingChat() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessionLoaded, setSessionLoaded] = useState(false);

  // 세션 가져오기
  const sessionQuery = trpc.chat.getSession.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  // 메시지 전송
  const sendMutation = trpc.chat.sendMessage.useMutation({
    onSuccess: (data) => {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.aiMessage },
      ]);
    },
    onError: () => {
      toast.error("메시지 전송에 실패했습니다. 다시 시도해 주세요.");
    },
  });

  // 대화 완료
  const completeMutation = trpc.chat.completeSession.useMutation({
    onSuccess: (data) => {
      toast.success("상담이 완료되었습니다! 분석 결과를 확인해 보세요.");
      setLocation("/portfolio");
    },
    onError: () => {
      toast.error("상담 완료 처리에 실패했습니다.");
    },
  });

  // 새 세션
  const resetMutation = trpc.chat.resetSession.useMutation({
    onSuccess: () => {
      setMessages([]);
      setSessionLoaded(false);
      sessionQuery.refetch();
      toast.success("새로운 상담이 시작되었습니다.");
    },
  });

  // 세션 데이터 로드
  useEffect(() => {
    if (sessionQuery.data && !sessionLoaded) {
      const loadedMessages: Message[] = (
        sessionQuery.data.messages as Array<{ role: string; content: string }>
      ).map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));
      setMessages(loadedMessages);
      setSessionLoaded(true);
    }
  }, [sessionQuery.data, sessionLoaded]);

  const handleSendMessage = (content: string) => {
    setMessages((prev) => [...prev, { role: "user", content }]);
    sendMutation.mutate({ message: content });
  };

  const userMessageCount = useMemo(
    () => messages.filter((m) => m.role === "user").length,
    [messages]
  );

  // 로딩 상태
  if (authLoading) {
    return (
      <div className="sacred-geometry-bg min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-yellow-600" />
      </div>
    );
  }

  // 비로그인 상태
  if (!isAuthenticated) {
    return (
      <div className="sacred-geometry-bg min-h-screen flex items-center justify-center">
        <Card className="max-w-md w-full border-2 border-yellow-200">
          <CardContent className="pt-8 pb-8 text-center space-y-4">
            <MessageCircle className="w-12 h-12 text-yellow-600 mx-auto" />
            <h2
              className="text-xl font-bold"
              style={{ color: "#1a1f36" }}
            >
              로그인이 필요합니다
            </h2>
            <p className="text-gray-600 text-sm">
              AI 커리어 상담을 시작하려면 먼저 로그인해 주세요.
            </p>
            <Button
              onClick={() => {
                window.location.href = getLoginUrl();
              }}
              className="bg-yellow-600 hover:bg-yellow-700 text-white w-full"
            >
              로그인하기
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="sacred-geometry-bg min-h-screen flex flex-col">
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
                  AI 커리어 상담
                </h1>
                <p className="text-xs text-gray-500">
                  자연스러운 대화로 진로를 탐색합니다
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {userMessageCount > 0 && (
              <Badge
                variant="outline"
                className="border-yellow-300 text-yellow-700 text-xs"
              >
                <MessageCircle className="w-3 h-3 mr-1" />
                {userMessageCount}회 대화
              </Badge>
            )}
            {userMessageCount >= 5 && (
              <Button
                onClick={() => completeMutation.mutate()}
                disabled={completeMutation.isPending}
                className="bg-green-600 hover:bg-green-700 text-white text-sm"
                size="sm"
              >
                {completeMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-1" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 mr-1" />
                )}
                상담 완료
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => resetMutation.mutate()}
              disabled={resetMutation.isPending}
              className="text-gray-500 hover:text-gray-700 text-xs"
            >
              새 상담
            </Button>
          </div>
        </div>
      </header>

      {/* 대화 영역 */}
      <div className="flex-1 container max-w-3xl py-4 flex flex-col">
        {/* 진행 상태 표시 */}
        {userMessageCount > 0 && userMessageCount < 5 && (
          <div className="mb-3 px-2">
            <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
              <Sparkles className="w-3 h-3 text-yellow-500" />
              <span>
                대화를 더 진행하면 분석 정확도가 높아집니다 ({userMessageCount}
                /5 최소 대화)
              </span>
            </div>
            <div className="w-full bg-yellow-100 rounded-full h-1.5">
              <div
                className="bg-yellow-500 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (userMessageCount / 5) * 100)}%` }}
              />
            </div>
          </div>
        )}

        {sessionQuery.isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-yellow-600 mx-auto" />
              <p className="text-sm text-gray-500">상담을 준비하고 있습니다...</p>
            </div>
          </div>
        ) : (
          <AIChatBox
            messages={messages}
            onSendMessage={handleSendMessage}
            isLoading={sendMutation.isPending}
            placeholder="편하게 이야기해 주세요..."
            height="calc(100vh - 160px)"
            emptyStateMessage="AI 커리어 상담사와 대화를 시작해 보세요"
            suggestedPrompts={[
              "안녕하세요, 진로 상담을 받고 싶어요",
              "요즘 취업 준비를 어떻게 해야 할지 모르겠어요",
              "제 전공이 맞는 건지 고민이에요",
            ]}
          />
        )}
      </div>
    </div>
  );
}
