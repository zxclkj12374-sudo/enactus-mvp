import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { Upload, ArrowLeft, Calendar, Loader2 } from "lucide-react";

export default function ActivityUpload() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [formData, setFormData] = useState({
    activityType: "",
    title: "",
    description: "",
    imageUrls: [] as string[],
  });
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const createActivityMutation = trpc.activity.create.useMutation();
  const activityListQuery = trpc.activity.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const handleActivityTypeChange = (value: string) => {
    setFormData((prev) => ({ ...prev, activityType: value }));
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach((file) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          const imageUrl = event.target?.result as string;
          setUploadedImages((prev) => [...prev, imageUrl]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.activityType || !formData.title) {
      toast.error("활동 유형과 제목을 입력해주세요.");
      return;
    }

    try {
      await createActivityMutation.mutateAsync({
        ...formData,
        imageUrls: uploadedImages,
      });
      toast.success("활동이 기록되었습니다.");
      setFormData({
        activityType: "",
        title: "",
        description: "",
        imageUrls: [],
      });
      setUploadedImages([]);
      activityListQuery.refetch();
    } catch {
      toast.error("활동 기록에 실패했습니다.");
    }
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
                  활동 기록
                </h1>
                <p className="text-xs text-gray-500">
                  당신의 경험을 기록하세요
                </p>
              </div>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLocation("/portfolio")}
            className="border-yellow-300 hover:bg-yellow-50 text-sm"
          >
            타임라인 보기
          </Button>
        </div>
      </header>

      <div className="container max-w-4xl py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 활동 기록 폼 */}
          <div className="lg:col-span-2">
            <Card className="border border-yellow-200 bg-white/80">
              <CardHeader>
                <CardTitle style={{ color: "#1a1f36" }}>
                  새로운 활동 기록
                </CardTitle>
                <CardDescription>
                  학업, 대외활동, 개인 프로젝트 등 모든 경험을 기록해 주세요.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="activityType">활동 유형</Label>
                    <Select
                      value={formData.activityType}
                      onValueChange={handleActivityTypeChange}
                    >
                      <SelectTrigger className="border-yellow-200">
                        <SelectValue placeholder="활동 유형을 선택하세요" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="학업">학업</SelectItem>
                        <SelectItem value="대외활동">대외활동</SelectItem>
                        <SelectItem value="개인프로젝트">
                          개인 프로젝트
                        </SelectItem>
                        <SelectItem value="인턴십">인턴십</SelectItem>
                        <SelectItem value="봉사">봉사</SelectItem>
                        <SelectItem value="자격증">자격증</SelectItem>
                        <SelectItem value="기타">기타</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="title">활동 제목</Label>
                    <Input
                      id="title"
                      name="title"
                      placeholder="예: 데이터 분석 프로젝트"
                      value={formData.title}
                      onChange={handleChange}
                      className="border-yellow-200 focus:border-yellow-400"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">활동 설명</Label>
                    <Textarea
                      id="description"
                      name="description"
                      placeholder="활동에 대해 자세히 설명해 주세요. 어떤 역할을 했고, 무엇을 배웠는지 기록하면 분석에 도움이 됩니다."
                      value={formData.description}
                      onChange={handleChange}
                      rows={5}
                      className="border-yellow-200 focus:border-yellow-400"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>이미지 업로드 (선택)</Label>
                    <div className="border-2 border-dashed border-yellow-300 rounded-lg p-6 text-center cursor-pointer hover:bg-yellow-50 transition">
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        id="imageInput"
                      />
                      <label
                        htmlFor="imageInput"
                        className="cursor-pointer flex flex-col items-center gap-2"
                      >
                        <Upload className="w-8 h-8 text-yellow-600" />
                        <span className="text-sm text-gray-600">
                          클릭하여 이미지를 업로드하세요
                        </span>
                        <span className="text-xs text-gray-400">
                          활동 증빙 사진, 인증서 등
                        </span>
                      </label>
                    </div>
                  </div>

                  {uploadedImages.length > 0 && (
                    <div className="grid grid-cols-3 gap-3">
                      {uploadedImages.map((img, idx) => (
                        <div key={idx} className="relative group">
                          <img
                            src={img}
                            alt={`Uploaded ${idx}`}
                            className="w-full h-24 object-cover rounded-lg border border-yellow-200"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setUploadedImages((prev) =>
                                prev.filter((_, i) => i !== idx)
                              )
                            }
                            className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition flex items-center justify-center"
                          >
                            x
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={createActivityMutation.isPending}
                    className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-semibold"
                  >
                    {createActivityMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        저장 중...
                      </>
                    ) : (
                      "활동 기록하기"
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* 최근 활동 목록 */}
          <div>
            <Card className="border border-yellow-200 bg-white/80">
              <CardHeader>
                <CardTitle
                  className="text-base"
                  style={{ color: "#1a1f36" }}
                >
                  최근 활동
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {activityListQuery.data && activityListQuery.data.length > 0 ? (
                    activityListQuery.data.map((activity) => (
                      <div
                        key={activity.id}
                        className="p-3 bg-yellow-50/50 rounded-lg border border-yellow-100 hover:border-yellow-300 transition"
                      >
                        <div className="flex justify-between items-start gap-2">
                          <p
                            className="font-semibold text-sm"
                            style={{ color: "#1a1f36" }}
                          >
                            {activity.title}
                          </p>
                          <Badge
                            variant="outline"
                            className="border-yellow-300 text-yellow-700 text-xs shrink-0"
                          >
                            {activity.activityType}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1 mt-2 text-xs text-gray-400">
                          <Calendar className="w-3 h-3" />
                          <span>
                            {new Date(activity.createdAt).toLocaleDateString(
                              "ko-KR"
                            )}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-gray-400 text-sm py-6">
                      아직 기록된 활동이 없습니다.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
