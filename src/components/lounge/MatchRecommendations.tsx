"use client";

import { useRouter } from "next/navigation";
import { Sparkles, MessageCircle, ShieldCheck, ChevronRight } from "lucide-react";
import { useMatchRecommendations } from "@/hooks/useMatchRecommendations";

interface MatchRecommendationsProps {
  cityId: string;
}

function countryToFlag(code: string | null): string {
  if (!code) return "🌍";
  return code.toUpperCase().split("").map((c) =>
    String.fromCodePoint(127397 + c.charCodeAt(0))
  ).join("");
}

function scoreColor(score: number): string {
  if (score >= 70) return "text-green-600 bg-green-50";
  if (score >= 40) return "text-primary bg-primary/10";
  return "text-gray-500 bg-gray-100";
}

const STYLE_TAG_LABELS: Record<string, string> = {
  foodie: "🍜 맛집", activity: "🏄 액티비티", nightlife: "🌙 야경",
  culture: "🏛️ 문화", chill: "☕ 카페", nature: "🏔️ 자연",
  budget: "💸 가성비", luxury: "✨ 럭셔리", photo: "📸 감성", solo: "🧳 솔로",
};

export function MatchRecommendations({ cityId }: MatchRecommendationsProps) {
  const router = useRouter();
  const { matches, loading } = useMatchRecommendations(cityId);

  if (loading) {
    return (
      <div className="px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-1.5 mb-3">
          <Sparkles className="w-3.5 h-3.5 text-violet-500" />
          <span className="text-xs font-bold text-gray-900">나와 잘 맞는 여행자</span>
        </div>
        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="shrink-0 w-52 h-28 rounded-2xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (matches.length === 0) return null;

  return (
    <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-b from-violet-50/40 to-white">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-violet-500" fill="currentColor" />
          <span className="text-xs font-bold text-gray-900">
            나와 잘 맞는 여행자 ({matches.length}명)
          </span>
        </div>
        <span className="text-[10px] text-gray-400">스타일·일정·언어 기반</span>
      </div>

      {/* 카드 가로 스크롤 */}
      <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
        {matches.map((m) => (
          <div
            key={m.id}
            className="shrink-0 w-52 bg-white rounded-2xl border border-gray-100 shadow-sm p-3.5
              active:scale-[0.98] transition-all cursor-pointer"
            onClick={() => router.push(`/dm/${m.id}?name=${encodeURIComponent(m.nickname)}`)}
          >
            {/* 유저 정보 */}
            <div className="flex items-center gap-2 mb-2">
              <div className="relative shrink-0">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-200 to-primary/20
                  flex items-center justify-center text-sm font-bold text-primary">
                  {m.nickname[0].toUpperCase()}
                </div>
                {/* 인증 뱃지 */}
                {m.is_verified && (
                  <ShieldCheck className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 text-green-500 bg-white rounded-full" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <span className="text-xs font-bold text-gray-900 truncate">{m.nickname}</span>
                  <span className="text-sm">{countryToFlag(m.home_country)}</span>
                </div>
                {/* 매칭 점수 */}
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${scoreColor(m.score)}`}>
                  매칭 {m.score}점
                </span>
              </div>
            </div>

            {/* 자기소개 */}
            {m.bio && (
              <p className="text-[11px] text-gray-500 leading-relaxed mb-2 line-clamp-2">
                "{m.bio}"
              </p>
            )}

            {/* 매칭 이유 태그 */}
            <div className="flex flex-wrap gap-1 mb-2.5">
              {m.matchReasons.slice(0, 2).map((r) => (
                <span key={r}
                  className="text-[10px] bg-violet-50 text-violet-600 font-semibold px-1.5 py-0.5 rounded-full">
                  ✓ {r}
                </span>
              ))}
            </div>

            {/* 여행 스타일 태그 */}
            {m.travel_style_tags?.length > 0 && (
              <div className="flex gap-1 mb-2.5 overflow-hidden">
                {m.travel_style_tags.slice(0, 2).map((tag) => (
                  <span key={tag}
                    className="text-[10px] text-gray-500 bg-gray-50 px-1.5 py-0.5 rounded-full shrink-0">
                    {STYLE_TAG_LABELS[tag] ?? tag}
                  </span>
                ))}
              </div>
            )}

            {/* DM 버튼 */}
            <button className="w-full flex items-center justify-center gap-1 py-1.5 rounded-xl
              bg-primary/10 text-primary text-[11px] font-bold active:bg-primary active:text-white transition-all">
              <MessageCircle className="w-3 h-3" />
              대화 시작하기
              <ChevronRight className="w-3 h-3 ml-auto" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
