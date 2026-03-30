import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";
import { MessageCircle, BookOpen, BarChart3, Zap, Sparkles } from "lucide-react";

export default function Home() {
  const { user, isAuthenticated, logout } = useAuth();
  const [, setLocation] = useLocation();

  const features = [
    {
      icon: MessageCircle,
      title: "AI 대화 분석",
      description: "자연스러운 대화를 통해 당신의 현재 상황과 성향을 파악합니다.",
    },
    {
      icon: BookOpen,
      title: "활동 기록",
      description: "학업, 대외활동, 프로젝트 등 모든 경험을 기록하고 분석합니다.",
    },
    {
      icon: BarChart3,
      title: "심층 인터뷰",
      description: "경험과 가치관에 대한 심층 대화로 무의식적 성향을 발견합니다.",
    },
    {
      icon: Zap,
      title: "맞춤형 직무 추천",
      description: "현황, 행동, 무의식을 크로스체크하여 세부 직무를 추천합니다.",
    },
  ];

  return (
    <div className="sacred-geometry-bg min-h-screen">
      {/* 헤더 */}
      <header className="border-b border-yellow-200 bg-white/80 backdrop-blur sticky top-0 z-50">
        <div className="container flex justify-between items-center py-4">
          <div
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => setLocation("/")}
          >
            <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-yellow-700 rounded-lg flex items-center justify-center shadow-md">
              <span className="text-white font-black text-sm tracking-tighter">N:D</span>
            </div>
            <h1 className="text-xl font-black tracking-tight" style={{ color: '#1a1f36' }}>
              NO:DE
            </h1>
          </div>
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <span className="text-sm text-gray-600 hidden sm:inline">{user?.name}</span>
                <Button
                  onClick={() => setLocation("/onboarding")}
                  variant="outline"
                  className="border-yellow-300 hover:bg-yellow-50"
                >
                  상담 시작
                </Button>
                <Button
                  onClick={() => setLocation("/report")}
                  variant="outline"
                  className="border-yellow-300 hover:bg-yellow-50"
                >
                  나의 보고서
                </Button>
                <Button
                  onClick={() => setLocation("/portfolio")}
                  variant="outline"
                  className="border-yellow-300 hover:bg-yellow-50"
                >
                  포트폴리오
                </Button>
                {user?.role === "admin" && (
                  <Button
                    onClick={() => setLocation("/admin")}
                    variant="outline"
                    className="border-yellow-300 hover:bg-yellow-50"
                  >
                    관리자
                  </Button>
                )}
                <Button
                  onClick={logout}
                  variant="ghost"
                  className="text-red-600 hover:bg-red-50"
                >
                  로그아웃
                </Button>
              </>
            ) : (
              <Button
                onClick={() => { window.location.href = getLoginUrl(); }}
                className="bg-yellow-600 hover:bg-yellow-700 text-white"
              >
                로그인
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* 히어로 섹션 */}
      <section className="py-24 md:py-36">
        <div className="container max-w-4xl text-center">
          <p className="gold-subtitle mb-6 text-lg">Data-driven Career Discovery</p>
          <h1 className="navy-headline mb-6" style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}>
            대화로 발견하는<br />나만의 커리어
          </h1>
          <p className="text-lg text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
            AI와의 자연스러운 대화를 통해 당신의 상황, 행동 패턴, 무의식적 성향을
            분석하고 맞춤형 직무를 추천합니다.
          </p>
          <div className="flex justify-center gap-4 flex-wrap">
            {isAuthenticated ? (
              <>
                <Button
                  onClick={() => setLocation("/onboarding")}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white px-8 py-3 text-lg shadow-lg"
                >
                  AI 상담 시작하기
                </Button>
                <Button
                  onClick={() => setLocation("/activity")}
                  variant="outline"
                  className="border-yellow-400 px-8 py-3 text-lg hover:bg-yellow-50"
                  style={{ color: '#1a1f36' }}
                >
                  활동 기록하기
                </Button>
              </>
            ) : (
              <Button
                onClick={() => { window.location.href = getLoginUrl(); }}
                className="bg-yellow-600 hover:bg-yellow-700 text-white px-8 py-3 text-lg shadow-lg"
              >
                지금 시작하기
              </Button>
            )}
          </div>
        </div>
      </section>

      <div className="sacred-divider container" />

      {/* 기능 소개 */}
      <section className="py-20">
        <div className="container">
          <h2 className="navy-headline text-center mb-4">어떻게 작동하나요?</h2>
          <p className="gold-subtitle text-center mb-12">
            4단계로 당신의 커리어를 설계합니다
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <Card
                  key={idx}
                  className="border-2 border-yellow-200 hover:shadow-lg transition group cursor-pointer bg-white/80"
                >
                  <CardHeader>
                    <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-yellow-200 transition">
                      <Icon className="w-6 h-6 text-yellow-700" />
                    </div>
                    <CardTitle style={{ color: '#1a1f36' }}>
                      <span className="text-yellow-600 font-mono text-sm mr-2">0{idx + 1}</span>
                      {feature.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 leading-relaxed">{feature.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      <div className="sacred-divider container" />

      {/* 차별점 섹션 */}
      <section className="py-20">
        <div className="container max-w-3xl">
          <h2 className="navy-headline text-center mb-12">기존 서비스와 다릅니다</h2>
          <div className="space-y-6">
            <div className="flex gap-4 items-start">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center shrink-0 mt-1">
                <span className="text-red-500 font-bold text-sm">X</span>
              </div>
              <div>
                <p className="font-semibold mb-1" style={{ color: '#1a1f36' }}>기존: "집안 사정을 입력하세요"</p>
                <p className="text-gray-600 text-sm">직접적인 질문은 거부감을 주고 솔직한 답변을 방해합니다.</p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center shrink-0 mt-1">
                <Sparkles className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="font-semibold mb-1" style={{ color: '#1a1f36' }}>NO:DE: 자연스러운 대화에서 패턴을 발견</p>
                <p className="text-gray-600 text-sm">AI가 편안한 대화를 이끌며, 답변 속에서 상황과 성향을 자동으로 분석합니다.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="sacred-divider container" />

      {/* CTA 섹션 */}
      <section className="py-20 bg-gradient-to-r from-yellow-50 to-amber-50">
        <div className="container max-w-2xl text-center">
          <h2 className="navy-headline mb-4">지금 시작하세요</h2>
          <p className="text-lg text-gray-700 mb-8 leading-relaxed">
            AI와의 대화 한 번으로 당신의 커리어 방향을 발견하세요.
          </p>
          {!isAuthenticated && (
            <Button
              onClick={() => { window.location.href = getLoginUrl(); }}
              className="bg-yellow-600 hover:bg-yellow-700 text-white px-8 py-3 text-lg shadow-lg"
            >
              무료로 시작하기
            </Button>
          )}
        </div>
      </section>

      {/* 푸터 */}
      <footer className="border-t border-yellow-200 bg-white py-8">
        <div className="container text-center text-sm text-gray-500">
          <p className="font-semibold mb-1" style={{ color: '#1a1f36' }}>NO:DE</p>
          <p>Data-driven Career Discovery Platform</p>
          <p className="mt-2">&copy; 2026 NO:DE. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
