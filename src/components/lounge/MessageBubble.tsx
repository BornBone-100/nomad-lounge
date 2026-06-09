"use client";

import { useState } from "react";
import { Languages, Loader2 } from "lucide-react";
import { relativeTime } from "@/lib/utils";
import { useUserStore } from "@/store/userStore";
import type { MessageWithProfile } from "@/types/database";

interface MessageBubbleProps {
  message: MessageWithProfile;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const { profile, preferredLang } = useUserStore();
  const isMe = message.user_id === profile?.id;

  const [translated, setTranslated] = useState<string | null>(null);
  const [showTranslation, setShowTranslation] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);

  const needsTranslation = message.lang !== preferredLang;

  const handleTranslate = async () => {
    // 이미 번역된 경우 토글
    if (translated) {
      setShowTranslation((prev) => !prev);
      return;
    }

    setIsTranslating(true);
    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messageId: message.id,
          text: message.content,
          sourceLang: message.lang,
          targetLang: preferredLang,
        }),
      });
      const data = await res.json();
      setTranslated(data.translated);
      setShowTranslation(true);
    } catch {
      // 번역 실패 시 조용히 무시
    } finally {
      setIsTranslating(false);
    }
  };

  return (
    <div className={`flex gap-2.5 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
      {/* 아바타 */}
      {!isMe && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0 mt-0.5">
          {message.profiles.nickname[0].toUpperCase()}
        </div>
      )}

      <div className={`flex flex-col gap-1 max-w-[75%] ${isMe ? "items-end" : "items-start"}`}>
        {/* 닉네임 + 국가 (상대방만) */}
        {!isMe && (
          <div className="flex items-center gap-1.5 px-1">
            <span className="text-xs font-semibold text-gray-700">
              {message.profiles.nickname}
            </span>
            {message.profiles.home_country && (
              <span className="text-xs text-gray-400">{message.profiles.home_country}</span>
            )}
            {/* 시그널 배지 */}
            {message.profiles.status_signal && (
              <span className="text-xs bg-primary-light text-primary px-1.5 py-0.5 rounded-full">
                {message.profiles.signal_emoji} {message.profiles.status_signal}
              </span>
            )}
          </div>
        )}

        {/* 말풍선 */}
        <div className={isMe ? "bubble-mine" : "bubble-others"}>
          <p>{showTranslation && translated ? translated : message.content}</p>
        </div>

        {/* 번역 버튼 + 타임스탬프 */}
        <div className={`flex items-center gap-2 px-1 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
          <span className="text-[10px] text-gray-400">
            {relativeTime(message.created_at)}
          </span>
          {needsTranslation && (
            <button
              onClick={handleTranslate}
              disabled={isTranslating}
              className="flex items-center gap-1 text-[10px] text-primary font-medium active:opacity-70"
            >
              {isTranslating ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Languages className="w-3 h-3" />
              )}
              {showTranslation ? "원문 보기" : "번역 보기"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
