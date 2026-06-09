"use client";

import { useState, useRef } from "react";
import { Send, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useUserStore } from "@/store/userStore";

interface MessageInputProps {
  loungeId: string;
}

// 브라우저 언어 → BCP 47 코드 감지
function detectLang(): string {
  if (typeof window === "undefined") return "ko";
  return navigator.language.split("-")[0] || "ko";
}

export function MessageInput({ loungeId }: MessageInputProps) {
  const supabase = createClient();
  const { profile, preferredLang } = useUserStore();

  const [text, setText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || isSending || !profile) return;

    setIsSending(true);
    setText("");
    // textarea 높이 초기화
    if (textareaRef.current) textareaRef.current.style.height = "auto";

    const { error } = await supabase.from("messages").insert({
      lounge_id: loungeId,
      user_id: profile.id,
      content: trimmed,
      lang: preferredLang || detectLang(),
    });

    if (error) {
      // 실패 시 입력 복원
      setText(trimmed);
    }

    setIsSending(false);
    textareaRef.current?.focus();
  };

  // textarea 자동 높이 조절 (최대 5줄)
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Enter 전송, Shift+Enter 줄바꿈
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="sticky bottom-0 bg-white/80 backdrop-blur-md border-t border-gray-100 px-4 py-3"
      style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}
    >
      <div className="flex items-end gap-2">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder="메시지를 입력하세요..."
          rows={1}
          className="flex-1 resize-none px-4 py-2.5 rounded-2xl bg-gray-50 border border-gray-200 text-sm
            outline-none focus:border-primary focus:bg-white transition-all
            placeholder:text-gray-300 leading-relaxed"
          style={{ maxHeight: "120px" }}
        />
        <button
          onClick={handleSend}
          disabled={!text.trim() || isSending}
          className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center shrink-0
            disabled:opacity-30 disabled:cursor-not-allowed
            active:scale-95 transition-all shadow-md shadow-primary/20"
        >
          {isSending ? (
            <Loader2 className="w-4 h-4 text-white animate-spin" />
          ) : (
            <Send className="w-4 h-4 text-white" />
          )}
        </button>
      </div>
    </div>
  );
}
