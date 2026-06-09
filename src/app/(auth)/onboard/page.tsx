"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Globe, ArrowRight, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useUserStore } from "@/store/userStore";

// 브라우저 언어 감지 → preferredLang 초기값 설정
function detectLanguage(): string {
  if (typeof window === "undefined") return "ko";
  const lang = navigator.language.split("-")[0];
  const supported = ["ko", "en", "ja", "zh", "es", "fr", "de", "pt"];
  return supported.includes(lang) ? lang : "en";
}

export default function OnboardPage() {
  const router = useRouter();
  const supabase = createClient();
  const { setProfile, setPreferredLang } = useUserStore();

  const [nickname, setNickname] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleStart = async () => {
    const trimmed = nickname.trim();
    if (!trimmed) {
      setError("닉네임을 입력해 주세요");
      return;
    }
    if (trimmed.length < 2) {
      setError("2글자 이상 입력해 주세요");
      return;
    }
    if (trimmed.length > 20) {
      setError("20글자 이하로 입력해 주세요");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // 1. 익명 로그인
      const { data: authData, error: authError } = await supabase.auth.signInAnonymously();
      if (authError) {
        // 익명 로그인 비활성화된 경우 안내
        if (authError.message?.includes("Anonymous") || authError.status === 422) {
          setError("Supabase 대시보드에서 익명 로그인을 활성화해 주세요 (Authentication → Providers → Anonymous)");
        } else {
          setError(`로그인 오류: ${authError.message}`);
        }
        setIsLoading(false);
        return;
      }

      const userId = authData.user!.id;
      const detectedLang = detectLanguage();

      // 2. 프로필 upsert (이미 존재하면 닉네임만 업데이트)
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .upsert(
          {
            id: userId,
            nickname: trimmed,
            languages: [detectedLang],
          },
          { onConflict: "id" }
        )
        .select()
        .single();

      if (profileError) {
        setError(`프로필 생성 오류: ${profileError.message}`);
        setIsLoading(false);
        return;
      }

      // 3. 전역 스토어 업데이트
      setProfile(profile);
      setPreferredLang(detectedLang);

      // 4. 홈으로 이동
      router.replace("/home");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "알 수 없는 오류";
      console.error("Onboard error:", err);
      setError(`오류가 발생했어요: ${message}`);
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-white px-6">
      {/* 헤더 영역 */}
      <div className="flex-1 flex flex-col justify-center items-center gap-6 pb-10">
        {/* 로고 */}
        <div className="flex items-center gap-2">
          <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/30">
            <Globe className="w-7 h-7 text-white" />
          </div>
          <span className="text-2xl font-bold text-gray-900 tracking-tight">
            NomadLounge
          </span>
        </div>

        {/* 카피 */}
        <div className="text-center space-y-1">
          <p className="text-xl font-semibold text-gray-900">
            지금 이 도시의 여행자들과
          </p>
          <p className="text-sm text-gray-500">
            앱 설치 없이, 닉네임 하나로 즉시 입장
          </p>
        </div>

        {/* 입력 폼 */}
        <div className="w-full max-w-sm space-y-3 mt-4">
          <div className="space-y-1">
            <input
              type="text"
              value={nickname}
              onChange={(e) => {
                setNickname(e.target.value);
                setError("");
              }}
              onKeyDown={(e) => e.key === "Enter" && handleStart()}
              placeholder="닉네임을 입력하세요 (예: 방랑하는곰)"
              maxLength={20}
              autoFocus
              className={`
                w-full px-4 py-3.5 rounded-2xl border text-sm outline-none transition-all
                placeholder:text-gray-300
                ${error
                  ? "border-red-400 bg-red-50 focus:border-red-400"
                  : "border-gray-200 bg-gray-50 focus:border-primary focus:bg-white focus:shadow-sm focus:shadow-primary/10"
                }
              `}
            />
            {error && (
              <p className="text-xs text-red-500 pl-1">{error}</p>
            )}
            <p className="text-xs text-gray-400 pl-1">
              나중에 언제든지 변경 가능해요
            </p>
          </div>

          <button
            onClick={handleStart}
            disabled={isLoading || !nickname.trim()}
            className={`
              w-full py-3.5 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2
              transition-all duration-200
              ${isLoading || !nickname.trim()
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-primary text-white shadow-lg shadow-primary/30 active:scale-[0.98]"
              }
            `}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>입장 중...</span>
              </>
            ) : (
              <>
                <span>라운지 입장하기</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* 하단 안내 */}
      <div className="pb-8 text-center">
        <p className="text-xs text-gray-400">
          계속 진행하면{" "}
          <span className="text-gray-500 underline underline-offset-2 cursor-pointer">이용약관</span>
          에 동의하는 것으로 간주됩니다
        </p>
      </div>
    </div>
  );
}
