import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { toast } from "sonner";

export default function ProfileForm() {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    grade: "",
    major: "",
    familyStatus: "",
    socialPressure: "",
    additionalInfo: "",
  });

  const profileQuery = trpc.profile.get.useQuery();
  const updateProfileMutation = trpc.profile.update.useMutation();

  // 프로필 데이터 로드
  if (profileQuery.data && !formData.grade) {
    setFormData({
      grade: profileQuery.data?.grade || "",
      major: profileQuery.data?.major || "",
      familyStatus: profileQuery.data?.familyStatus || "",
      socialPressure: profileQuery.data?.socialPressure || "",
      additionalInfo: profileQuery.data?.additionalInfo || "",
    });
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateProfileMutation.mutateAsync(formData);
      toast.success("프로필이 저장되었습니다.");
    } catch (error) {
      toast.error("프로필 저장에 실패했습니다.");
    }
  };

  return (
    <div className="sacred-geometry-bg min-h-screen py-12">
      <div className="container max-w-2xl">
        <div className="mb-8">
          <h1 className="navy-headline mb-2">현황 정보 입력</h1>
          <p className="gold-subtitle">당신의 현재 상황을 알려주세요</p>
        </div>

        <Card className="border-2 border-yellow-200 shadow-lg">
          <CardHeader>
            <CardTitle>기본 정보</CardTitle>
            <CardDescription>
              학년, 전공, 집안 사정, 주변 눈치 등 현재 상황을 입력해주세요.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="grade">학년</Label>
                <Input
                  id="grade"
                  name="grade"
                  placeholder="예: 3학년"
                  value={formData.grade}
                  onChange={handleChange}
                  className="border-yellow-200 focus:border-yellow-400"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="major">전공</Label>
                <Input
                  id="major"
                  name="major"
                  placeholder="예: 컴퓨터공학"
                  value={formData.major}
                  onChange={handleChange}
                  className="border-yellow-200 focus:border-yellow-400"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="familyStatus">집안 사정</Label>
                <Textarea
                  id="familyStatus"
                  name="familyStatus"
                  placeholder="가정 상황, 경제적 상황 등을 자유롭게 작성해주세요."
                  value={formData.familyStatus}
                  onChange={handleChange}
                  rows={4}
                  className="border-yellow-200 focus:border-yellow-400"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="socialPressure">주변 눈치</Label>
                <Textarea
                  id="socialPressure"
                  name="socialPressure"
                  placeholder="가족, 친구, 사회적 기대 등으로 인한 압박감을 작성해주세요."
                  value={formData.socialPressure}
                  onChange={handleChange}
                  rows={4}
                  className="border-yellow-200 focus:border-yellow-400"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="additionalInfo">추가 정보</Label>
                <Textarea
                  id="additionalInfo"
                  name="additionalInfo"
                  placeholder="기타 중요한 정보가 있다면 작성해주세요."
                  value={formData.additionalInfo}
                  onChange={handleChange}
                  rows={3}
                  className="border-yellow-200 focus:border-yellow-400"
                />
              </div>

              <div className="sacred-divider" />

              <Button
                type="submit"
                disabled={updateProfileMutation.isPending}
                className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-semibold py-2 rounded-lg"
              >
                {updateProfileMutation.isPending ? "저장 중..." : "저장하기"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
