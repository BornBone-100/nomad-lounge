"use client";

import { useRouter } from "next/navigation";
import { Sparkles, MessageCircle, ShieldCheck, RefreshCw, Zap } from "lucide-react";
import { useMatchRecommendations } from "@/hooks/useMatchRecommendations";
import { cn } from "@/lib/utils";

interface MatchRecommendationsProps {
  cityId: string;
}

function countryToFlag(code: string | null): string {
  if (!code) return "🌍";
  return code.toUpperCase().split("").map((c) =>
    String.fromCodePoint(127397 + c.charCodeAt(0))
  ).join("");
}

function scoreBar(score: number) {
  const pct = Math.min(score, 100);
  const color =
    pct >= 70 ? "bg-green-400" :
    pct >= 40 ? "bg-primary" :
                "bg-gray-300";
  return { pct, color };
}

const STYLE_TAG_LABELS: Record<string, string> = {
  foodie: "🍜 맛집", activity: "🏄 액티비티", nightlife: "🌙 야경",
  culture: "🏛️ 문화", chill: "☕ 카페", nature: "🏔️ 자연",
  budget: "💸 가성비", luxury: "✨ 럭셔리", photo: "📸 감성", solo: "🧳 솔로",
};

// 체류 일정 표시용
function formatDate(d: string | null) {
  if (!d) return null;
  return new Date(d).toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
}

export function MatchRecommendations({ cityId }: MatchRecommendationsProps) {
  const router = useRouter();
  const { matches, loading, refresh } = useMatchRecommendations(cityId);

  if (loading) {
    return (
      <div className="px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-1.5 mb-3">
          <Sparkles className="w-3.5 h-3.5 text-violet-500" />
          <span className="text-xs font-bold text-gray-900">나와 잘 맞는 여행자</span>
        </div>
        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="shrink-0 w-56 h-36 rounded-2xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (matches.length === 0) return null;

  // 시그널 활성 유저 수
  const activeSignalCount = matches.filter((m) => m.signal_active).length;

  return (
    <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-b from-violet-50/50 to-white">

      {/* 헤더 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-violet-500" fill="currentColor" />
          <span className="text-xs font-bold text-gray-900">
            나와 잘 맞는 여행자
          </span>
          <span className="text-[10px] text-gray-400">({matches.length}명)</span>
          {activeSignalCount > 0 && (
            <span className="flex items-center gap-0.5 text-[10px] font-bold text-yellow-600 bg-yellow-50 px-1.5 py-0.5 rounded-full">
              <Zap className="w-2.5 h-2.5" fill="currentColor" />
              {activeSignalCount}명 지금 가능
            </span>
          )}
        </div>
        <button
          onClick={refresh}
          className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-gray-100 active:scale-90 transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5 text-gray-400" />
        </button>
      </div>

      {/* 카드 가로 스크롤 */}
      <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
        {matches.map((m) => {
          const { pct, color } = scoreBar(m.score);
          const checkIn  = formatDate(m.check_in_date);
          const checkOut = formatDate(m.check_out_date);

          return (
            <div
              key={m.id}
              onClick={() => router.push(`/dm/${m.id}?name=${encodeURIComponent(m.nickname)}`)}
              className={cn(
                "shrink-0 w-56 bg-white rounded-2xl border shadow-sm p-3.5 cursor-pointer",
                "active:scale-[0.97] transition-all",
                m.signal_active
                  ? "border-yellow-300 ring-1 ring-yellow-200"
                  : "border-gray-100"
              )}
            >
              {/* 시그널 활성 배너 */}
              {m.signal_active && (
                <div className="flex items-center gap-1 text-[10px] font-bold text-yellow-700 bg-yellow-50 px-2 py-1 rounded-lg mb-2">
                  <span>{m.signal_emoji}</span>
                  <span className="truncate">{m.status_signal}</span>
                  <span className="ml-auto text-yellow-500">지금 가능</span>
                </div>
              )}

              {/* 유저 정보 */}
              <div className="flex items-center gap-2 mb-2">
                <div className="relative shrink-0">
                  <div className={cn(
                    "w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold",
                    m.signal_active
                      ? "bg-gradient-to-br from-yellow-200 to-orange-200 text-orange-700"
                      : "bg-gradient-to-br from-violet-200 to-primary/20 text-primary"
                  )}>
                    {m.nickname[0].toUpperCase()}
                  </div>
                  {m.is_verified && (
                    <ShieldCheck className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 text-green-500 bg-white rounded-full" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-bold text-gray-900 truncate">{m.nickname}</span>
                    <span className="text-sm">{countryToFlag(m.home_country)}</span>
                  </div>
                  <span className="text-[10px] text-gray-400">
                    {m.manner_temperature?.toFixed(1)}℃
                  </span>
                </div>
              </div>

              {/* 매칭 점수 바 */}
              <div className="mb-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-gray-500">매칭도</span>
                  <span className="text-[10px] font-bold text-gray-700">{pct}점</span>
                </div>
                <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={cn("h-full rounded-full transition-all", color)}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>

              {/* 매칭 이유 */}
              <div className="flex flex-wrap gap-1 mb-2">
                {m.matchReasons.slice(0, 3).map((r) => (
                  <span key={r}
                    className="text-[10px] bg-violet-50 text-violet-600 font-semibold px-1.5 py-0.5 rounded-full">
                    ✓ {r}
                  </span>
                ))}
              </div>

              {/* 여행 스타일 태그 */}
              {m.travel_style_tags.length > 0 && (
                <div className="flex gap-1 mb-2 overflow-hidden">
                  {m.travel_style_tags.slice(0, 2).map((tag) => (
                    <span key={tag}
                      className="text-[10px] text-gray-500 bg-gray-50 px-1.5 py-0.5 rounded-full shrink-0">
                      {STYLE_TAG_LABELS[tag] ?? tag}
                    </span>
                  ))}
                </div>
              )}

              {/* 체류 일정 */}
              {checkIn && checkOut && (
                <div className="text-[10px] text-gray-400 mb-2">
                  📅 {checkIn} ~ {checkOut}
                </div>
              )}

              {/* 자기소개 */}
              {m.bio && (
                <p className="text-[11px] text-gray-500 leading-relaxed mb-2 line-clamp-2">
                  "{m.bio}"
                </p>
              )}

              {/* DM 버튼 */}
              <button className="w-full flex items-center justify-center gap-1 py-1.5 rounded-xl
                bg-primary/10 text-primary text-[11px] font-bold
                active:bg-primary active:text-white transition-all">
                <MessageCircle className="w-3 h-3" />
                대화 시작하기
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
