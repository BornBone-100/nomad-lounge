"use client";

export const dynamic = "force-dynamic";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, Send, Loader2, Languages, Flame } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useUserStore } from "@/store/userStore";
import { relativeTime } from "@/lib/utils";

interface DmMessage {
  id: string;
  sender_id: string;
  content: string;
  lang: string;
  created_at: string;
  translated?: string;
  isTranslating?: boolean;
}

function countryToFlag(code: string | null): string {
  if (!code) return "";
  return code.toUpperCase().split("").map((c) =>
    String.fromCodePoint(127397 + c.charCodeAt(0))
  ).join("");
}

export default function DmPage() {
  const { userId } = useParams<{ userId: string }>();
  const searchParams = useSearchParams();
  const partnerName = searchParams.get("name") ?? "여행자";
  const router = useRouter();
  const supabase = createClient();
  const { profile, preferredLang } = useUserStore();

  const [messages, setMessages] = useState<DmMessage[]>([]);
  const [text, setText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [partnerCountry, setPartnerCountry] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 상대방 프로필 fetch
  useEffect(() => {
    supabase.from("profiles").select("home_country").eq("id", userId).single()
      .then(({ data }) => { if (data) setPartnerCountry(data.home_country); });
  }, [userId]);

  // DM 메시지 fetch (lounge_id IS NULL + 특정 sender/receiver 쌍)
  useEffect(() => {
    if (!profile) return;
    supabase
      .from("messages")
      .select("*")
      .or(`and(sender_id.eq.${profile.id},receiver_id.eq.${userId}),and(sender_id.eq.${userId},receiver_id.eq.${profile.id})`)
      .order("created_at", { ascending: true })
      .limit(100)
      .then(({ data }) => { if (data) setMessages(data as DmMessage[]); });
  }, [userId, profile?.id]);

  // Realtime 구독
  useEffect(() => {
    if (!profile) return;
    const channel = supabase
      .channel(`dm:${[profile.id, userId].sort().join("-")}`)
      .on("postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        async (payload) => {
          const msg = payload.new as DmMessage;
          const isDm =
            (msg.sender_id === profile.id && (payload.new as any).receiver_id === userId) ||
            (msg.sender_id === userId && (payload.new as any).receiver_id === profile.id);
          if (isDm) setMessages((prev) => [...prev, msg]);
        }
      ).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId, profile?.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || isSending || !profile) return;
    setIsSending(true);
    setText("");
    await supabase.from("messages").insert({
      lounge_id: null,
      user_id: profile.id,
      sender_id: profile.id,
      receiver_id: userId,
      content: trimmed,
      lang: preferredLang || "ko",
    } as any);
    setIsSending(false);
    textareaRef.current?.focus();
  };

  const handleTranslate = async (msgId: string, content: string, lang: string) => {
    setMessages((prev) =>
      prev.map((m) => m.id === msgId ? { ...m, isTranslating: true } : m)
    );
    const res = await fetch("/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messageId: msgId, text: content, sourceLang: lang, targetLang: preferredLang }),
    });
    const data = await res.json();
    setMessages((prev) =>
      prev.map((m) => m.id === msgId
        ? { ...m, translated: data.translated, isTranslating: false }
        : m
      )
    );
  };

  const isMe = (senderId: string) => senderId === profile?.id;

  return (
    <div className="flex flex-col h-screen bg-white">

      {/* ── TopBar ── */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="flex items-center gap-3 px-4 h-14">
          <button
            onClick={() => router.back()}
            className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 active:scale-95 transition-all -ml-1 shrink-0"
          >
            <ChevronLeft className="w-5 h-5 text-gray-700" />
          </button>
          {/* 상대방 아바타 */}
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-sm font-bold text-primary shrink-0">
            {partnerName[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-gray-900 text-sm">{partnerName}</span>
              <span>{countryToFlag(partnerCountry)}</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-orange-500 font-semibold">
              <Flame className="w-3 h-3" />
              <span>매너온도 36.5℃</span>
            </div>
          </div>
        </div>
      </header>

      {/* ── 메시지 목록 ── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <p className="text-3xl mb-2">👋</p>
            <p className="text-sm">첫 메시지를 보내보세요!</p>
          </div>
        )}
        {messages.map((msg) => {
          const mine = isMe(msg.sender_id);
          const needsTranslation = msg.lang !== preferredLang;
          return (
            <div key={msg.id} className={`flex gap-2.5 ${mine ? "flex-row-reverse" : "flex-row"}`}>
              {!mine && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-xs font-bold text-primary shrink-0 mt-0.5">
                  {partnerName[0]?.toUpperCase()}
                </div>
              )}
              <div className={`flex flex-col gap-1 max-w-[75%] ${mine ? "items-end" : "items-start"}`}>
                {/* 원본 말풍선 */}
                <div className={mine ? "bubble-mine" : "bubble-others"}>
                  <p>{msg.content}</p>
                </div>
                {/* 번역 말풍선 */}
                {msg.translated && (
                  <div className={`text-xs px-3 py-2 rounded-2xl max-w-full ${mine ? "bg-primary/10 text-primary rounded-br-sm" : "bg-gray-50 text-gray-500 rounded-bl-sm"}`}>
                    <span className="text-[10px] font-medium opacity-60 block mb-0.5">
                      {mine ? `${partnerName}에게 번역되어 전송됨` : "자동번역됨"}
                    </span>
                    {msg.translated}
                  </div>
                )}
                {/* 번역 버튼 + 시간 */}
                <div className={`flex items-center gap-2 px-1 ${mine ? "flex-row-reverse" : "flex-row"}`}>
                  <span className="text-[10px] text-gray-400">{relativeTime(msg.created_at)}</span>
                  {needsTranslation && !msg.translated && (
                    <button
                      onClick={() => handleTranslate(msg.id, msg.content, msg.lang)}
                      disabled={msg.isTranslating}
                      className="flex items-center gap-1 text-[10px] text-primary font-medium active:opacity-70"
                    >
                      {msg.isTranslating
                        ? <Loader2 className="w-3 h-3 animate-spin" />
                        : <Languages className="w-3 h-3" />
                      }
                      번역 보기
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* ── 입력창 ── */}
      <div
        className="sticky bottom-0 bg-white/80 backdrop-blur-md border-t border-gray-100 px-4 py-3"
        style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}
      >
        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
            }}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder="메시지를 입력하세요..."
            rows={1}
            className="flex-1 resize-none px-4 py-2.5 rounded-2xl bg-gray-50 border border-gray-200 text-sm
              outline-none focus:border-primary focus:bg-white transition-all placeholder:text-gray-300 leading-relaxed"
            style={{ maxHeight: "120px" }}
          />
          <button
            onClick={handleSend}
            disabled={!text.trim() || isSending}
            className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center shrink-0
              disabled:opacity-30 active:scale-95 transition-all shadow-md shadow-primary/20"
          >
            {isSending
              ? <Loader2 className="w-4 h-4 text-white animate-spin" />
              : <Send className="w-4 h-4 text-white" />
            }
          </button>
        </div>
      </div>
    </div>
  );
}
