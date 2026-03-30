import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { getLoginUrl } from "@/const";
import { Streamdown } from "streamdown";
import {
  ArrowLeft, FileText, Briefcase, Target, Brain, Eye,
  Loader2, Lock, CheckCircle2, Clock, TrendingUp, Sparkles,
} from "lucide-react";

export default function MyReport() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  const reportQuery = trpc.report.get.useQuery(undefined, { enabled: isAuthenticated });
  const jobsQuery = trpc.report.getJobRecommendations.useQuery(undefined, { enabled: isAuthenticated });

  if (loading) {
    return (
      <div className="sacred-geometry-bg min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-yellow-600" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="sacred-geometry-bg min-h-screen flex items-center justify-center">
        <Card className="max-w-md w-full border-2 border-yellow-200">
          <CardContent className="pt-8 pb-8 text-center space-y-4">
            <Lock className="w-12 h-12 text-yellow-500 mx-auto" />
            <h2 className="text-xl font-bold" style={{ color: "#1a1f36" }}>로그인이 필요합니다</h2>
            <p className="text-gray-600 text-sm">분석 보고서를 확인하려면 로그인해 주세요.</p>
            <Button onClick={() => window.location.href = getLoginUrl()} className="bg-yellow-600 hover:bg-yellow-700 text-white">
              로그인
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const report = reportQuery.data;
  const jobs = jobsQuery.data || [];

  return (
    <div className="sacred-geometry-bg min-h-screen">
      {/* 헤더 */}
      <header className="border-b border-yellow-200 bg-white/80 backdrop-blur sticky top-0 z-50">
        <div className="container flex justify-between items-center py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => setLocation("/")} className="hover:bg-yellow-50">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-yellow-500 to-yellow-700 rounded-lg flex items-center justify-center shadow-sm">
                <span className="text-white font-black text-xs tracking-tighter">N:D</span>
              </div>
              <div>
                <h1 className="text-base font-bold leading-tight" style={{ color: "#1a1f36" }}>나의 분석 보고서</h1>
                <p className="text-xs text-gray-500">전문가가 작성한 맞춤형 커리어 분석</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container py-6 max-w-4xl mx-auto">
        {reportQuery.isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-yellow-600 mb-4" />
            <p className="text-gray-500">보고서를 불러오는 중...</p>
          </div>
        ) : !report ? (
          /* 보고서가 아직 없을 때 */
          <Card className="border-2 border-dashed border-yellow-300 bg-white/60">
            <CardContent className="py-16 text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-yellow-100 rounded-full flex items-center justify-center">
                <Clock className="w-8 h-8 text-yellow-600" />
              </div>
              <h2 className="text-xl font-bold" style={{ color: "#1a1f36" }}>분석 보고서 준비 중</h2>
              <p className="text-gray-600 text-sm max-w-md mx-auto">
                NO:DE 전문가가 당신의 데이터를 분석하고 있습니다. 보고서가 완성되면 알림을 보내드리겠습니다.
              </p>
              <div className="flex flex-col items-center gap-2 pt-4">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span>AI 상담 완료</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Loader2 className="w-4 h-4 animate-spin text-yellow-500" />
                  <span>전문가 분석 진행 중</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Clock className="w-4 h-4" />
                  <span>보고서 전달 대기</span>
                </div>
              </div>
              <Button variant="outline" className="border-yellow-300 mt-4" onClick={() => setLocation("/")}>
                홈으로 돌아가기
              </Button>
            </CardContent>
          </Card>
        ) : report.status === "pending" || report.status === "in_progress" ? (
          /* 보고서 작성 중 */
          <Card className="border-2 border-yellow-200 bg-white/80">
            <CardContent className="py-16 text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-yellow-100 rounded-full flex items-center justify-center">
                <Brain className="w-8 h-8 text-yellow-600 animate-pulse" />
              </div>
              <h2 className="text-xl font-bold" style={{ color: "#1a1f36" }}>전문가가 분석 중입니다</h2>
              <p className="text-gray-600 text-sm max-w-md mx-auto">
                당신의 대화 내용과 활동 기록을 바탕으로 심층 분석을 진행하고 있습니다. 완료되면 알림을 보내드리겠습니다.
              </p>
            </CardContent>
          </Card>
        ) : (
          /* 보고서 완료 / 전달됨 */
          <div className="space-y-6">
            {/* 보고서 헤더 */}
            <Card className="border border-yellow-200 bg-gradient-to-r from-yellow-50 to-orange-50">
              <CardContent className="py-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                      <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold" style={{ color: "#1a1f36" }}>
                        {user?.name || "사용자"}님의 커리어 분석 보고서
                      </h2>
                      <p className="text-xs text-gray-500">
                        작성일: {report.completedAt ? new Date(report.completedAt).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" }) : ""}
                      </p>
                    </div>
                  </div>
                  <Badge className={report.status === "delivered" ? "bg-green-600" : "bg-blue-600"}>
                    {report.status === "delivered" ? "전달 완료" : "분석 완료"}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* 현 상황 분석 */}
            <Card className="border border-blue-200 bg-white/90">
              <CardHeader>
                <CardTitle className="flex items-center gap-2" style={{ color: "#1a1f36" }}>
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <Eye className="w-4 h-4 text-blue-700" />
                  </div>
                  현 상황 분석
                </CardTitle>
                <CardDescription>학업 상태, 환경적 요인, 제약 사항에 대한 종합 분석</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none text-gray-700">
                  <Streamdown>{report.situationAnalysis || ""}</Streamdown>
                </div>
              </CardContent>
            </Card>

            {/* 행동 패턴 분석 */}
            <Card className="border border-green-200 bg-white/90">
              <CardHeader>
                <CardTitle className="flex items-center gap-2" style={{ color: "#1a1f36" }}>
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-green-700" />
                  </div>
                  행동 패턴 분석
                </CardTitle>
                <CardDescription>활동 기록과 대화에서 파악된 행동 패턴 및 의사결정 방식</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none text-gray-700">
                  <Streamdown>{report.behaviorAnalysis || ""}</Streamdown>
                </div>
              </CardContent>
            </Card>

            {/* 무의식 분석 */}
            <Card className="border border-purple-200 bg-white/90">
              <CardHeader>
                <CardTitle className="flex items-center gap-2" style={{ color: "#1a1f36" }}>
                  <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                    <Brain className="w-4 h-4 text-purple-700" />
                  </div>
                  무의식 분석
                </CardTitle>
                <CardDescription>대화 속 답변 패턴과 모순점에서 드러나는 무의식적 성향</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none text-gray-700">
                  <Streamdown>{report.unconsciousAnalysis || ""}</Streamdown>
                </div>
              </CardContent>
            </Card>

            {/* 액션 플랜 */}
            <Card className="border border-orange-200 bg-white/90">
              <CardHeader>
                <CardTitle className="flex items-center gap-2" style={{ color: "#1a1f36" }}>
                  <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                    <Target className="w-4 h-4 text-orange-700" />
                  </div>
                  액션 플랜
                </CardTitle>
                <CardDescription>현재 상황에서 실현 가능한 구체적 행동 계획</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none text-gray-700">
                  <Streamdown>{report.actionPlan || ""}</Streamdown>
                </div>
              </CardContent>
            </Card>

            {/* 직무 추천 */}
            {jobs.length > 0 && (
              <Card className="border border-yellow-300 bg-white/90">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2" style={{ color: "#1a1f36" }}>
                    <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center">
                      <Briefcase className="w-4 h-4 text-yellow-700" />
                    </div>
                    맞춤형 직무 추천
                  </CardTitle>
                  <CardDescription>현재 상황에서 입사 가능한 수준의 세부 직무 추천</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {jobs.map((job: any, index: number) => (
                    <div key={job.id || index} className="p-5 border border-gray-200 rounded-xl bg-gradient-to-r from-gray-50 to-yellow-50 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className="bg-yellow-600 text-white text-xs">추천 {index + 1}</Badge>
                          </div>
                          <h3 className="text-lg font-bold" style={{ color: "#1a1f36" }}>{job.jobTitle}</h3>
                          {job.company && <p className="text-sm text-gray-500">{job.company}</p>}
                        </div>
                      </div>

                      <Separator />

                      <div>
                        <p className="text-xs font-semibold text-gray-500 mb-1">추천 이유</p>
                        <p className="text-sm text-gray-700">{job.reason}</p>
                      </div>

                      {job.requiredSkills && (() => {
                        const skills = Array.isArray(job.requiredSkills) ? job.requiredSkills :
                          typeof job.requiredSkills === 'string' ? JSON.parse(job.requiredSkills) : [];
                        return skills.length > 0 ? (
                          <div>
                            <p className="text-xs font-semibold text-gray-500 mb-2">필요 스킬</p>
                            <div className="flex flex-wrap gap-1">
                              {skills.map((skill: string, i: number) => (
                                <Badge key={i} variant="secondary" className="bg-blue-100 text-blue-800 text-xs">{skill}</Badge>
                              ))}
                            </div>
                          </div>
                        ) : null;
                      })()}

                      {job.careerPath && (
                        <div>
                          <p className="text-xs font-semibold text-gray-500 mb-1">커리어 경로</p>
                          <p className="text-sm text-gray-700">{job.careerPath}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* 하단 안내 */}
            <Card className="border border-gray-200 bg-gray-50">
              <CardContent className="py-4 text-center">
                <p className="text-xs text-gray-500">
                  이 보고서는 NO:DE 전문가가 AI 상담 대화, 활동 기록, 인터뷰 답변을 종합 분석하여 작성했습니다.
                  추가 상담이 필요하시면 언제든 문의해 주세요.
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
