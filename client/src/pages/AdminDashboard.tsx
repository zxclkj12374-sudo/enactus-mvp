import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/lib/trpc";
import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { Streamdown } from "streamdown";
import {
  ArrowLeft, Users, FileText, MessageCircle, Brain, Shield,
  Loader2, ChevronRight, Send, Sparkles, Plus, Trash2, Briefcase, Eye,
} from "lucide-react";

interface JobRec {
  jobTitle: string;
  company: string;
  reason: string;
  requiredSkills: string[];
  careerPath: string;
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState("users");

  // 분석 폼 상태
  const [situationAnalysis, setSituationAnalysis] = useState("");
  const [behaviorAnalysis, setBehaviorAnalysis] = useState("");
  const [unconsciousAnalysis, setUnconsciousAnalysis] = useState("");
  const [actionPlan, setActionPlan] = useState("");
  const [jobRecs, setJobRecs] = useState<JobRec[]>([
    { jobTitle: "", company: "", reason: "", requiredSkills: [], careerPath: "" },
  ]);

  // 데이터 쿼리
  const statsQuery = trpc.admin.stats.useQuery(undefined, { enabled: user?.role === "admin" });
  const usersQuery = trpc.admin.users.useQuery(undefined, { enabled: user?.role === "admin" });
  const userDetailQuery = trpc.admin.userDetail.useQuery(
    { userId: selectedUserId! },
    { enabled: !!selectedUserId && user?.role === "admin" }
  );

  // 뮤테이션
  const createReportMutation = trpc.admin.createReport.useMutation({
    onSuccess: () => {
      toast.success("분석 보고서가 저장되었습니다", { description: "사용자에게 알림이 전송되었습니다." });
      userDetailQuery.refetch();
    },
    onError: (err) => toast.error("저장 실패", { description: err.message }),
  });

  const deliverReportMutation = trpc.admin.deliverReport.useMutation({
    onSuccess: () => {
      toast.success("보고서가 전달되었습니다");
      userDetailQuery.refetch();
    },
    onError: (err) => toast.error("전달 실패", { description: err.message }),
  });

  const generateAIMutation = trpc.admin.generateAIAnalysis.useMutation({
    onSuccess: (data) => {
      setSituationAnalysis(data.situationAnalysis);
      setBehaviorAnalysis(data.behaviorAnalysis);
      setUnconsciousAnalysis(data.unconsciousAnalysis);
      setActionPlan(data.actionPlan);
      if (data.jobRecommendations.length > 0) {
        setJobRecs(data.jobRecommendations.map((j: any) => ({
          jobTitle: j.jobTitle || "",
          company: j.company || "",
          reason: j.reason || "",
          requiredSkills: j.requiredSkills || [],
          careerPath: j.careerPath || "",
        })));
      }
      toast.success("AI 보조 분석이 생성되었습니다", { description: "내용을 검토하고 수정한 후 저장하세요." });
    },
    onError: (err) => toast.error("AI 분석 생성 실패", { description: err.message }),
  });

  const normalUsers = useMemo(() =>
    (usersQuery.data || []).filter((u: any) => u.role === "user"),
    [usersQuery.data]
  );

  // 사용자 선택 시 기존 보고서 데이터 로드
  const handleSelectUser = (userId: number) => {
    setSelectedUserId(userId);
    setActiveTab("detail");
    // 폼 초기화
    setSituationAnalysis("");
    setBehaviorAnalysis("");
    setUnconsciousAnalysis("");
    setActionPlan("");
    setJobRecs([{ jobTitle: "", company: "", reason: "", requiredSkills: [], careerPath: "" }]);
  };

  // 기존 보고서가 있으면 폼에 로드
  const detail = userDetailQuery.data;
  const hasExistingReport = !!detail?.report;

  const loadExistingReport = () => {
    if (detail?.report) {
      setSituationAnalysis(detail.report.situationAnalysis || "");
      setBehaviorAnalysis(detail.report.behaviorAnalysis || "");
      setUnconsciousAnalysis(detail.report.unconsciousAnalysis || "");
      setActionPlan(detail.report.actionPlan || "");
      if (detail.jobRecommendations.length > 0) {
        setJobRecs(detail.jobRecommendations.map((j: any) => ({
          jobTitle: j.jobTitle || "",
          company: j.company || "",
          reason: j.reason || "",
          requiredSkills: Array.isArray(j.requiredSkills) ? j.requiredSkills : [],
          careerPath: j.careerPath || "",
        })));
      }
    }
  };

  const handleSubmitReport = () => {
    if (!selectedUserId) return;
    if (!situationAnalysis.trim() || !behaviorAnalysis.trim() || !unconsciousAnalysis.trim() || !actionPlan.trim()) {
      toast.error("모든 분석 항목을 작성해 주세요");
      return;
    }
    const validJobs = jobRecs.filter(j => j.jobTitle.trim() && j.reason.trim());
    if (validJobs.length === 0) {
      toast.error("최소 1개의 직무 추천을 작성해 주세요");
      return;
    }
    createReportMutation.mutate({
      userId: selectedUserId,
      situationAnalysis,
      behaviorAnalysis,
      unconsciousAnalysis,
      actionPlan,
      jobRecommendations: validJobs,
    });
  };

  const addJobRec = () => {
    setJobRecs([...jobRecs, { jobTitle: "", company: "", reason: "", requiredSkills: [], careerPath: "" }]);
  };

  const removeJobRec = (index: number) => {
    setJobRecs(jobRecs.filter((_, i) => i !== index));
  };

  const updateJobRec = (index: number, field: keyof JobRec, value: any) => {
    const updated = [...jobRecs];
    updated[index] = { ...updated[index], [field]: value };
    setJobRecs(updated);
  };

  // 관리자 확인
  if (user?.role !== "admin") {
    return (
      <div className="sacred-geometry-bg min-h-screen flex items-center justify-center">
        <Card className="max-w-md w-full border-2 border-red-200">
          <CardContent className="pt-8 pb-8 text-center space-y-4">
            <Shield className="w-12 h-12 text-red-400 mx-auto" />
            <h2 className="text-xl font-bold" style={{ color: "#1a1f36" }}>접근 권한이 없습니다</h2>
            <p className="text-gray-600 text-sm">관리자만 접근할 수 있는 페이지입니다.</p>
            <Button onClick={() => setLocation("/")} variant="outline" className="border-yellow-300">홈으로 돌아가기</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 대화 내용 파싱 헬퍼
  const parseMsgs = (raw: unknown) => {
    if (!raw) return [];
    try {
      const arr = typeof raw === "string" ? JSON.parse(raw) : raw;
      return Array.isArray(arr) ? arr : [];
    } catch { return []; }
  };

  const parseProfile = (raw: unknown) => {
    if (!raw) return null;
    try {
      return typeof raw === "string" ? JSON.parse(raw) : raw;
    } catch { return null; }
  };

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
                <h1 className="text-base font-bold leading-tight" style={{ color: "#1a1f36" }}>관리자 대시보드</h1>
                <p className="text-xs text-gray-500">사용자 데이터 분석 및 보고서 생성</p>
              </div>
            </div>
          </div>
          <Badge variant="outline" className="border-yellow-300 text-yellow-700">
            <Shield className="w-3 h-3 mr-1" /> Admin
          </Badge>
        </div>
      </header>

      <div className="container py-6">
        {/* 통계 카드 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: "총 사용자", value: statsQuery.data?.totalUsers ?? "--", icon: Users, color: "text-yellow-600" },
            { label: "상담 완료", value: statsQuery.data?.completedChats ?? "--", icon: MessageCircle, color: "text-green-600" },
            { label: "분석 대기", value: statsQuery.data?.pendingReports ?? "--", icon: Brain, color: "text-yellow-600" },
            { label: "보고서 완료", value: statsQuery.data?.completedReports ?? "--", icon: FileText, color: "text-blue-600" },
          ].map((stat) => (
            <Card key={stat.label} className="border border-yellow-200 bg-white/80">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-gray-500">{stat.label}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  <span className="text-2xl font-bold" style={{ color: "#1a1f36" }}>{stat.value}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* 탭 */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="bg-yellow-50 border border-yellow-200">
            <TabsTrigger value="users" className="data-[state=active]:bg-yellow-600 data-[state=active]:text-white">사용자 목록</TabsTrigger>
            <TabsTrigger value="detail" className="data-[state=active]:bg-yellow-600 data-[state=active]:text-white" disabled={!selectedUserId}>
              사용자 상세
            </TabsTrigger>
            <TabsTrigger value="report" className="data-[state=active]:bg-yellow-600 data-[state=active]:text-white" disabled={!selectedUserId}>
              보고서 작성
            </TabsTrigger>
          </TabsList>

          {/* ===== 사용자 목록 탭 ===== */}
          <TabsContent value="users">
            <Card className="border border-yellow-200 bg-white/80">
              <CardHeader>
                <CardTitle style={{ color: "#1a1f36" }}>사용자 목록</CardTitle>
                <CardDescription>AI 상담을 완료한 사용자를 선택하여 분석을 시작하세요.</CardDescription>
              </CardHeader>
              <CardContent>
                {usersQuery.isLoading ? (
                  <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-yellow-600" /></div>
                ) : normalUsers.length === 0 ? (
                  <div className="text-center text-gray-500 py-12">
                    <Users className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                    <p className="text-sm">아직 등록된 사용자가 없습니다.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {normalUsers.map((u: any) => (
                      <button
                        key={u.id}
                        onClick={() => handleSelectUser(u.id)}
                        className={`w-full flex items-center justify-between p-4 rounded-lg border transition-all hover:shadow-sm ${
                          selectedUserId === u.id
                            ? "border-yellow-400 bg-yellow-50"
                            : "border-gray-200 hover:border-yellow-300 bg-white"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center text-white font-bold text-sm">
                            {(u.name || "U")[0]}
                          </div>
                          <div className="text-left">
                            <p className="font-semibold text-sm" style={{ color: "#1a1f36" }}>{u.name || "이름 미등록"}</p>
                            <p className="text-xs text-gray-500">{u.email || "이메일 미등록"}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-400">
                            {new Date(u.createdAt).toLocaleDateString("ko-KR")}
                          </span>
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ===== 사용자 상세 탭 ===== */}
          <TabsContent value="detail">
            {userDetailQuery.isLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-yellow-600" /></div>
            ) : detail ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* 프로필 정보 */}
                <Card className="border border-yellow-200 bg-white/80">
                  <CardHeader>
                    <CardTitle className="text-sm" style={{ color: "#1a1f36" }}>추출된 프로필</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {detail.profile ? (
                      <>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="p-3 bg-yellow-50 rounded-lg">
                            <p className="text-xs text-gray-500 mb-1">학년</p>
                            <p className="font-semibold text-sm" style={{ color: "#1a1f36" }}>{detail.profile.grade || "미파악"}</p>
                          </div>
                          <div className="p-3 bg-yellow-50 rounded-lg">
                            <p className="text-xs text-gray-500 mb-1">전공</p>
                            <p className="font-semibold text-sm" style={{ color: "#1a1f36" }}>{detail.profile.major || "미파악"}</p>
                          </div>
                        </div>
                        {detail.profile.familyStatus && (
                          <div className="p-3 bg-orange-50 rounded-lg">
                            <p className="text-xs text-gray-500 mb-1">환경 분석</p>
                            <p className="text-sm text-gray-700">{detail.profile.familyStatus}</p>
                          </div>
                        )}
                        {detail.profile.socialPressure && (
                          <div className="p-3 bg-blue-50 rounded-lg">
                            <p className="text-xs text-gray-500 mb-1">주변 환경 영향</p>
                            <p className="text-sm text-gray-700">{detail.profile.socialPressure}</p>
                          </div>
                        )}
                        {detail.profile.additionalInfo && (() => {
                          const info = parseProfile(detail.profile!.additionalInfo);
                          if (!info) return null;
                          return (
                            <div className="space-y-2">
                              {info.keywords && info.keywords.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {info.keywords.map((k: string, i: number) => (
                                    <Badge key={i} variant="secondary" className="bg-yellow-100 text-yellow-800 text-xs">{k}</Badge>
                                  ))}
                                </div>
                              )}
                              {info.personality && (
                                <div className="p-3 bg-purple-50 rounded-lg">
                                  <p className="text-xs text-gray-500 mb-1">성격 유형</p>
                                  <p className="text-sm text-gray-700">{info.personality}</p>
                                </div>
                              )}
                              {info.unconsciousPatterns && (
                                <div className="p-3 bg-red-50 rounded-lg">
                                  <p className="text-xs text-gray-500 mb-1">무의식 패턴</p>
                                  <p className="text-sm text-gray-700">{info.unconsciousPatterns}</p>
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </>
                    ) : (
                      <p className="text-sm text-gray-500 text-center py-4">프로필 정보가 아직 추출되지 않았습니다.</p>
                    )}
                  </CardContent>
                </Card>

                {/* 대화 기록 */}
                <Card className="border border-yellow-200 bg-white/80">
                  <CardHeader>
                    <CardTitle className="text-sm" style={{ color: "#1a1f36" }}>
                      AI 상담 대화 기록 ({detail.chatSessions.length}개 세션)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[400px]">
                      {detail.chatSessions.length === 0 ? (
                        <p className="text-sm text-gray-500 text-center py-4">대화 기록이 없습니다.</p>
                      ) : (
                        detail.chatSessions.map((session: any, si: number) => {
                          const msgs = parseMsgs(session.messages);
                          return (
                            <div key={si} className="mb-4">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant="outline" className="text-xs">
                                  세션 {si + 1}
                                </Badge>
                                <Badge variant={session.status === "completed" ? "default" : "secondary"} className="text-xs">
                                  {session.status === "completed" ? "완료" : session.status === "analyzed" ? "분석됨" : "진행중"}
                                </Badge>
                              </div>
                              <div className="space-y-2">
                                {msgs.filter((m: any) => m.role !== "system").map((msg: any, mi: number) => (
                                  <div key={mi} className={`p-2 rounded-lg text-xs ${
                                    msg.role === "user" ? "bg-yellow-50 ml-4" : "bg-gray-50 mr-4"
                                  }`}>
                                    <span className="font-semibold text-gray-500 block mb-1">
                                      {msg.role === "user" ? "사용자" : "AI"}
                                    </span>
                                    <p className="text-gray-700 whitespace-pre-wrap">{msg.content}</p>
                                  </div>
                                ))}
                              </div>
                              {si < detail.chatSessions.length - 1 && <Separator className="my-3" />}
                            </div>
                          );
                        })
                      )}
                    </ScrollArea>
                  </CardContent>
                </Card>

                {/* 활동 기록 */}
                <Card className="border border-yellow-200 bg-white/80">
                  <CardHeader>
                    <CardTitle className="text-sm" style={{ color: "#1a1f36" }}>활동 기록 ({detail.activities.length}건)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {detail.activities.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-4">활동 기록이 없습니다.</p>
                    ) : (
                      <div className="space-y-2">
                        {detail.activities.map((a: any) => (
                          <div key={a.id} className="p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className="text-xs">{a.activityType}</Badge>
                              <span className="font-semibold text-sm" style={{ color: "#1a1f36" }}>{a.title}</span>
                            </div>
                            {a.description && <p className="text-xs text-gray-600">{a.description}</p>}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* 기존 보고서 상태 */}
                <Card className="border border-yellow-200 bg-white/80">
                  <CardHeader>
                    <CardTitle className="text-sm" style={{ color: "#1a1f36" }}>보고서 상태</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {hasExistingReport ? (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Badge className={
                            detail.report!.status === "delivered" ? "bg-green-600" :
                            detail.report!.status === "completed" ? "bg-blue-600" : "bg-yellow-600"
                          }>
                            {detail.report!.status === "delivered" ? "전달 완료" :
                             detail.report!.status === "completed" ? "작성 완료" :
                             detail.report!.status === "in_progress" ? "작성 중" : "대기 중"}
                          </Badge>
                          {detail.report!.completedAt && (
                            <span className="text-xs text-gray-500">
                              {new Date(detail.report!.completedAt).toLocaleDateString("ko-KR")}
                            </span>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" className="border-yellow-300" onClick={() => { loadExistingReport(); setActiveTab("report"); }}>
                            <Eye className="w-3 h-3 mr-1" /> 보고서 수정
                          </Button>
                          {detail.report!.status === "completed" && (
                            <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white"
                              onClick={() => deliverReportMutation.mutate({ userId: selectedUserId! })}
                              disabled={deliverReportMutation.isPending}
                            >
                              {deliverReportMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Send className="w-3 h-3 mr-1" />}
                              사용자에게 전달
                            </Button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-sm text-gray-500 mb-3">아직 보고서가 작성되지 않았습니다.</p>
                        <Button size="sm" className="bg-yellow-600 hover:bg-yellow-700 text-white" onClick={() => setActiveTab("report")}>
                          <FileText className="w-3 h-3 mr-1" /> 보고서 작성 시작
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <p>사용자를 선택해 주세요.</p>
              </div>
            )}
          </TabsContent>

          {/* ===== 보고서 작성 탭 ===== */}
          <TabsContent value="report">
            {!selectedUserId ? (
              <Card className="border border-yellow-200 bg-white/80">
                <CardContent className="text-center py-12">
                  <Brain className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm text-gray-500">사용자 목록에서 사용자를 선택해 주세요.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {/* AI 보조 분석 버튼 */}
                <Card className="border border-yellow-200 bg-gradient-to-r from-yellow-50 to-orange-50">
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-sm" style={{ color: "#1a1f36" }}>AI 보조 분석</h3>
                        <p className="text-xs text-gray-500">사용자의 대화, 활동, 프로필 데이터를 기반으로 AI가 초안을 생성합니다.</p>
                      </div>
                      <Button
                        onClick={() => generateAIMutation.mutate({ userId: selectedUserId })}
                        disabled={generateAIMutation.isPending}
                        className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white"
                      >
                        {generateAIMutation.isPending ? (
                          <><Loader2 className="w-4 h-4 animate-spin mr-2" /> 분석 중...</>
                        ) : (
                          <><Sparkles className="w-4 h-4 mr-2" /> AI 분석 생성</>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* 분석 항목들 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <Card className="border border-yellow-200 bg-white/80">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2" style={{ color: "#1a1f36" }}>
                        <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-700">1</div>
                        현 상황 분석
                      </CardTitle>
                      <CardDescription className="text-xs">학업 상태, 환경적 요인, 제약 사항을 종합적으로 분석</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Textarea
                        placeholder="대화에서 파악된 학업 상태, 환경적 요인, 제약 사항 등을 종합적으로 분석하세요. 대화 내용의 구체적 근거를 포함하세요."
                        value={situationAnalysis}
                        onChange={(e) => setSituationAnalysis(e.target.value)}
                        rows={8}
                        className="border-yellow-200 focus:border-yellow-400 text-sm"
                      />
                    </CardContent>
                  </Card>

                  <Card className="border border-yellow-200 bg-white/80">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2" style={{ color: "#1a1f36" }}>
                        <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-xs font-bold text-green-700">2</div>
                        행동 패턴 분석
                      </CardTitle>
                      <CardDescription className="text-xs">활동 기록과 대화에서 보이는 행동 패턴, 의사결정 방식</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Textarea
                        placeholder="활동 기록과 대화에서 드러나는 행동 패턴, 의사결정 방식, 시간 활용 패턴을 분석하세요."
                        value={behaviorAnalysis}
                        onChange={(e) => setBehaviorAnalysis(e.target.value)}
                        rows={8}
                        className="border-yellow-200 focus:border-yellow-400 text-sm"
                      />
                    </CardContent>
                  </Card>

                  <Card className="border border-yellow-200 bg-white/80">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2" style={{ color: "#1a1f36" }}>
                        <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center text-xs font-bold text-purple-700">3</div>
                        무의식 분석
                      </CardTitle>
                      <CardDescription className="text-xs">답변 패턴, 모순점, 반복 주제에서 드러나는 무의식적 성향</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Textarea
                        placeholder="대화 속 답변 패턴, 모순점, 반복되는 주제에서 드러나는 무의식적 성향을 분석하세요. 말과 행동의 불일치, 회피하는 주제 등을 짚어주세요."
                        value={unconsciousAnalysis}
                        onChange={(e) => setUnconsciousAnalysis(e.target.value)}
                        rows={8}
                        className="border-yellow-200 focus:border-yellow-400 text-sm"
                      />
                    </CardContent>
                  </Card>

                  <Card className="border border-yellow-200 bg-white/80">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2" style={{ color: "#1a1f36" }}>
                        <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center text-xs font-bold text-orange-700">4</div>
                        액션 플랜
                      </CardTitle>
                      <CardDescription className="text-xs">현재 상황에서 실현 가능한 구체적 행동 계획</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Textarea
                        placeholder="단기(1-3개월), 중기(3-6개월), 장기(6-12개월) 계획을 포함한 구체적인 액션 플랜을 작성하세요."
                        value={actionPlan}
                        onChange={(e) => setActionPlan(e.target.value)}
                        rows={8}
                        className="border-yellow-200 focus:border-yellow-400 text-sm"
                      />
                    </CardContent>
                  </Card>
                </div>

                {/* 직무 추천 */}
                <Card className="border border-yellow-200 bg-white/80">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-sm flex items-center gap-2" style={{ color: "#1a1f36" }}>
                          <Briefcase className="w-4 h-4 text-yellow-600" />
                          세부 직무 추천
                        </CardTitle>
                        <CardDescription className="text-xs">포괄적 직무가 아닌, 입사 가능한 수준의 세부 직무를 추천하세요.</CardDescription>
                      </div>
                      <Button size="sm" variant="outline" className="border-yellow-300" onClick={addJobRec}>
                        <Plus className="w-3 h-3 mr-1" /> 추가
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {jobRecs.map((job, index) => (
                      <div key={index} className="p-4 border border-gray-200 rounded-lg space-y-3 relative">
                        {jobRecs.length > 1 && (
                          <Button size="icon" variant="ghost" className="absolute top-2 right-2 w-6 h-6 text-gray-400 hover:text-red-500"
                            onClick={() => removeJobRec(index)}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        )}
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="text-xs">추천 {index + 1}</Badge>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs font-medium text-gray-600">세부 직무명 *</label>
                            <Input placeholder="예: B2B SaaS 콘텐츠 마케터" value={job.jobTitle}
                              onChange={(e) => updateJobRec(index, "jobTitle", e.target.value)}
                              className="border-yellow-200 text-sm mt-1" />
                          </div>
                          <div>
                            <label className="text-xs font-medium text-gray-600">추천 회사/기관</label>
                            <Input placeholder="예: 토스, 당근마켓 등 핀테크 스타트업" value={job.company}
                              onChange={(e) => updateJobRec(index, "company", e.target.value)}
                              className="border-yellow-200 text-sm mt-1" />
                          </div>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-600">추천 이유 *</label>
                          <Textarea placeholder="이 직무를 추천하는 구체적인 이유를 작성하세요." value={job.reason}
                            onChange={(e) => updateJobRec(index, "reason", e.target.value)}
                            rows={3} className="border-yellow-200 text-sm mt-1" />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-600">필요 스킬 (쉼표로 구분)</label>
                          <Input placeholder="예: 콘텐츠 기획, SEO, 데이터 분석"
                            value={job.requiredSkills.join(", ")}
                            onChange={(e) => updateJobRec(index, "requiredSkills", e.target.value.split(",").map(s => s.trim()).filter(Boolean))}
                            className="border-yellow-200 text-sm mt-1" />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-600">커리어 경로</label>
                          <Input placeholder="예: 주니어 마케터 → 시니어 → 마케팅 팀장" value={job.careerPath}
                            onChange={(e) => updateJobRec(index, "careerPath", e.target.value)}
                            className="border-yellow-200 text-sm mt-1" />
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* 저장 버튼 */}
                <div className="flex gap-3 justify-end">
                  <Button variant="outline" className="border-yellow-300" onClick={() => setActiveTab("detail")}>
                    취소
                  </Button>
                  <Button
                    onClick={handleSubmitReport}
                    disabled={createReportMutation.isPending}
                    className="bg-yellow-600 hover:bg-yellow-700 text-white font-semibold px-8"
                  >
                    {createReportMutation.isPending ? (
                      <><Loader2 className="w-4 h-4 animate-spin mr-2" /> 저장 중...</>
                    ) : (
                      <><FileText className="w-4 h-4 mr-2" /> 분석 보고서 저장 및 알림 전송</>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
