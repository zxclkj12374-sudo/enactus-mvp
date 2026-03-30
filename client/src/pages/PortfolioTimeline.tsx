import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import {
  ArrowLeft,
  Calendar,
  FileText,
  Image as ImageIcon,
  Plus,
  Loader2,
} from "lucide-react";

export default function PortfolioTimeline() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const activityListQuery = trpc.activity.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const profileQuery = trpc.profile.get.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const activities = activityListQuery.data || [];
  const sortedActivities = [...activities].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const getActivityColor = (type: string) => {
    const colors: Record<string, string> = {
      학업: "border-blue-300 text-blue-700 bg-blue-50",
      대외활동: "border-purple-300 text-purple-700 bg-purple-50",
      개인프로젝트: "border-green-300 text-green-700 bg-green-50",
      인턴십: "border-indigo-300 text-indigo-700 bg-indigo-50",
      봉사: "border-red-300 text-red-700 bg-red-50",
      자격증: "border-teal-300 text-teal-700 bg-teal-50",
      기타: "border-gray-300 text-gray-700 bg-gray-50",
    };
    return colors[type] || colors["기타"];
  };

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
                  포트폴리오 타임라인
                </h1>
                <p className="text-xs text-gray-500">
                  당신의 성장 기록을 한눈에
                </p>
              </div>
            </div>
          </div>
          <Button
            onClick={() => setLocation("/activity")}
            size="sm"
            className="bg-yellow-600 hover:bg-yellow-700 text-white"
          >
            <Plus className="w-4 h-4 mr-1" />
            활동 추가
          </Button>
        </div>
      </header>

      <div className="container max-w-4xl py-6">
        {/* 프로필 요약 */}
        {profileQuery.data && (
          <Card className="border border-yellow-200 bg-white/80 mb-6">
            <CardHeader className="pb-3">
              <CardTitle
                className="text-base"
                style={{ color: "#1a1f36" }}
              >
                프로필 요약
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500">학년</p>
                  <p
                    className="text-sm font-semibold"
                    style={{ color: "#1a1f36" }}
                  >
                    {profileQuery.data.grade || "미입력"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">전공</p>
                  <p
                    className="text-sm font-semibold"
                    style={{ color: "#1a1f36" }}
                  >
                    {profileQuery.data.major || "미입력"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 타임라인 */}
        {activityListQuery.isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-yellow-600" />
          </div>
        ) : sortedActivities.length > 0 ? (
          <div className="space-y-4">
            {sortedActivities.map((activity, idx) => (
              <div key={activity.id} className="relative flex gap-4">
                {/* 타임라인 라인 */}
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-yellow-100 border-3 border-yellow-400 flex items-center justify-center z-10 shrink-0">
                    <FileText className="w-5 h-5 text-yellow-700" />
                  </div>
                  {idx < sortedActivities.length - 1 && (
                    <div className="w-0.5 flex-1 bg-gradient-to-b from-yellow-400 to-yellow-200 mt-1" />
                  )}
                </div>

                {/* 활동 카드 */}
                <Card className="flex-1 border border-yellow-200 bg-white/80 hover:shadow-md transition mb-2">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex-1">
                        <CardTitle
                          className="text-base"
                          style={{ color: "#1a1f36" }}
                        >
                          {activity.title}
                        </CardTitle>
                        <div className="flex items-center gap-1 mt-1 text-xs text-gray-400">
                          <Calendar className="w-3 h-3" />
                          <span>
                            {new Date(activity.createdAt).toLocaleDateString(
                              "ko-KR",
                              {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              }
                            )}
                          </span>
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className={getActivityColor(activity.activityType)}
                      >
                        {activity.activityType}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {activity.description && (
                      <p className="text-sm text-gray-600 leading-relaxed">
                        {activity.description}
                      </p>
                    )}

                    {(() => {
                      const imgs = activity.imageUrls as string[] | null;
                      if (!imgs || !Array.isArray(imgs) || imgs.length === 0) return null;
                      return (
                        <div className="grid grid-cols-3 gap-2">
                          {imgs.map((imageUrl: string, imgIdx: number) => (
                            <div
                              key={imgIdx}
                              className="relative group overflow-hidden rounded-lg border border-yellow-200"
                            >
                              <img
                                src={imageUrl}
                                alt={`Activity ${imgIdx}`}
                                className="w-full h-24 object-cover group-hover:scale-105 transition"
                              />
                            </div>
                          ))}
                        </div>
                      );
                    })()}

                    {(() => {
                      const kws = activity.keywords as string[] | null;
                      if (!kws || !Array.isArray(kws) || kws.length === 0) return null;
                      return (
                        <div className="flex flex-wrap gap-1.5 pt-2 border-t border-yellow-100">
                          {kws.map((keyword: string, keyIdx: number) => (
                            <Badge
                              key={keyIdx}
                              variant="outline"
                              className="border-yellow-200 text-yellow-700 bg-yellow-50/50 text-xs"
                            >
                              {keyword}
                            </Badge>
                          ))}
                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        ) : (
          <Card className="border border-yellow-200 bg-white/80 text-center py-16">
            <CardContent>
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">
                아직 기록된 활동이 없습니다.
              </p>
              <p className="text-sm text-gray-400 mb-6">
                활동을 기록하면 타임라인에 표시됩니다.
              </p>
              <Button
                onClick={() => setLocation("/activity")}
                className="bg-yellow-600 hover:bg-yellow-700 text-white"
              >
                <Plus className="w-4 h-4 mr-1" />
                첫 활동 기록하기
              </Button>
            </CardContent>
          </Card>
        )}

        {/* 통계 */}
        {sortedActivities.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
            <Card className="border border-yellow-200 bg-white/80">
              <CardHeader className="pb-1">
                <CardTitle className="text-xs font-medium text-gray-500">
                  총 활동
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p
                  className="text-xl font-bold"
                  style={{ color: "#1a1f36" }}
                >
                  {sortedActivities.length}
                </p>
              </CardContent>
            </Card>

            {Object.entries(
              sortedActivities.reduce(
                (acc, activity) => {
                  acc[activity.activityType] =
                    (acc[activity.activityType] || 0) + 1;
                  return acc;
                },
                {} as Record<string, number>
              )
            )
              .slice(0, 3)
              .map(([type, count]: [string, number]) => (
                <Card
                  key={type}
                  className="border border-yellow-200 bg-white/80"
                >
                  <CardHeader className="pb-1">
                    <CardTitle className="text-xs font-medium text-gray-500">
                      {type}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xl font-bold text-yellow-600">
                      {count}
                    </p>
                  </CardContent>
                </Card>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
