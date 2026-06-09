"use client";

import { MessageCircle, Flame } from "lucide-react";
import { relativeTime } from "@/lib/utils";
import type { MessageWithProfile } from "@/types/database";

interface SignalFeedCardProps {
  message: MessageWithProfile;
  onDM?: (userId: string, nickname: string) => void;
}

// 국가 코드 → 국기 이모지 변환
function countryToFlag(countryCode: string | null): string {
  if (!countryCode) return "🌍";
  return countryCode
    .toUpperCase()
    .split("")
    .map((c) => String.fromCodePoint(127397 + c.charCodeAt(0)))
    .join("");
}

// 매너 온도 컬러
function getTempColor(temp?: number): string {
  if (!temp) return "text-blue-500";
  if (temp >= 38) return "text-orange-500";
  if (temp >= 36.5) return "text-green-500";
  return "text-blue-500";
}

export function SignalFeedCard({ message, onDM }: SignalFeedCardProps) {
  const { profiles } = message;
  const flag = countryToFlag(profiles.home_country);
  const tempColor = getTempColor(36.5); // 실제로는 profiles에서 받아야 함

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 active:scale-[0.99] transition-all">
      {/* 유저 정보 헤더 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          {/* 아바타 */}
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-sm font-bold text-primary shrink-0">
            {profiles.nickname[0].toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold text-gray-900">{profiles.nickname}</span>
              <span className="text-base">{flag}</span>
            </div>
            <span className="text-xs text-gray-400">{relativeTime(message.created_at)}</span>
          </div>
        </div>
        {/* 매너 온도 */}
        <div className={`flex items-center gap-0.5 text-xs font-bold ${tempColor}`}>
          <Flame className="w-3 h-3" />
          <span>36.5℃</span>
        </div>
      </div>

      {/* 메시지 본문 */}
      <p className="text-sm text-gray-800 leading-relaxed mb-3">{message.content}</p>

      {/* 시그널 배지 */}
      {profiles.status_signal && (
        <span className="inline-block text-xs bg-primary-light text-primary font-semibold px-2.5 py-1 rounded-full mb-3">
          {profiles.signal_emoji} {profiles.status_signal}
        </span>
      )}

      {/* DM 버튼 */}
      <button
        onClick={() => onDM?.(message.user_id, profiles.nickname)}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl
          bg-primary-light text-primary text-xs font-bold
          active:bg-primary active:text-white transition-all"
      >
        <MessageCircle className="w-3.5 h-3.5" />
        번개 참여하기 (DM)
      </button>
    </div>
  );
}
