"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, SlidersHorizontal, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useUserStore } from "@/store/userStore";
import { SignalStories } from "@/components/lounge/SignalStories";
import { SignalFeedCard } from "@/components/lounge/SignalFeedCard";
import { MessageFeed } from "@/components/lounge/MessageFeed";
import { MessageInput } from "@/components/lounge/MessageInput";
import { usePresence } from "@/hooks/usePresence";
import { cn } from "@/lib/utils";
import type { City, MessageWithProfile } from "@/types/database";

type Tab = "feed" | "chat";

export default function LoungePage() {
  const { cityId } = useParams<{ cityId: string }>();
  const router = useRouter();
  const supabase = createClient();
  const { setCurrentCity, profile } = useUserStore();

  const [city, setCity] = useState<City | null>(null);
  const [loungeId, setLoungeId] = useState<string | null>(null);
  const [activeCount, setActiveCount] = useState(0);
  const [tab, setTab] = useState<Tab>("feed");
  const [feedMessages, setFeedMessages] = useState<MessageWithProfile[]>([]);

  usePresence(cityId);

  useEffect(() => {
    const init = async () => {
      const { data: cityData } = await supabase
        .from("cities").select("*").eq("id", cityId).single();
      if (!cityData) return;
      setCity(cityData);
      setCurrentCity(cityData);
      setActiveCount(cityData.active_count);

      let { data: lounge } = await supabase
        .from("lounges").select("id").eq("city_id", cityId).single();
      if (!lounge) {
        const { data: newLounge } = await supabase
          .from("lounges").insert({ city_id: cityId }).select("id").single();
        lounge = newLounge;
      }
      if (lounge) {
        setLoungeId(lounge.id);
        // 피드 메시지 fetch (시그널 있는 유저 메시지만)
        const { data: msgs } = await supabase
          .from("messages")
          .select(`*, profiles(nickname, avatar_url, home_country, status_signal, signal_emoji)`)
          .eq("lounge_id", lounge.id)
          .order("created_at", { ascending: false })
          .limit(30);
        if (msgs) setFeedMessages(msgs as MessageWithProfile[]);
      }
    };
    init();
  }, [cityId]);

  // Realtime: active_count
  useEffect(() => {
    if (!cityId) return;
    const channel = supabase
      .channel(`city-count:${cityId}`)
      .on("postgres_changes",
        { event: "UPDATE", schema: "public", table: "cities", filter: `id=eq.${cityId}` },
        (payload) => setActiveCount((payload.new as City).active_count)
      ).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [cityId]);

  const handleDM = (userId: string, nickname: string) => {
    router.push(`/dm/${userId}?name=${encodeURIComponent(nickname)}`);
  };

  if (!city || !loungeId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-2">
          <div className="text-3xl animate-bounce">🌍</div>
          <p className="text-sm text-gray-400">라운지 입장 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-white">

      {/* ── TopBar ── */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="flex items-center gap-2 px-4 h-14">
          <button
            onClick={() => router.back()}
            className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 active:scale-95 transition-all -ml-1 shrink-0"
          >
            <ChevronLeft className="w-5 h-5 text-gray-700" />
          </button>
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-gray-900 text-base truncate">
              {city.emoji} {city.name_ko ?? city.name} 라운지
            </h2>
          </div>
          {/* 접속자 수 */}
          <div className="flex items-center gap-1.5 bg-green-50 px-2.5 py-1 rounded-full shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <Users className="w-3 h-3 text-green-600" />
            <span className="text-xs font-semibold text-green-700">{activeCount}</span>
          </div>
          <button className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 active:scale-95 transition-all shrink-0">
            <SlidersHorizontal className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* ── 탭 바 ── */}
        <div className="flex px-4 gap-4 border-t border-gray-100">
          {(["feed", "chat"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "py-2.5 text-sm font-semibold border-b-2 transition-all",
                tab === t
                  ? "text-primary border-primary"
                  : "text-gray-400 border-transparent"
              )}
            >
              {t === "feed" ? "⚡ 실시간 번개 피드" : "💬 글로벌 채팅"}
            </button>
          ))}
        </div>
      </header>

      {/* ── 시그널 스토리 (항상 노출) ── */}
      <SignalStories cityId={cityId} onUserClick={(id) => handleDM(id, "")} />

      {/* ── 탭 콘텐츠 ── */}
      {tab === "feed" ? (
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 pb-6">
          {feedMessages.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-4xl mb-3">⚡</p>
              <p className="text-sm font-semibold text-gray-700">아직 번개 피드가 없어요!</p>
              <p className="text-xs text-gray-400 mt-1">
                채팅 탭에서 첫 메시지를 남기고 번개를 켜보세요
              </p>
            </div>
          ) : (
            feedMessages.map((msg) => (
              <SignalFeedCard key={msg.id} message={msg} onDM={handleDM} />
            ))
          )}
        </div>
      ) : (
        <>
          <MessageFeed loungeId={loungeId} />
          <MessageInput loungeId={loungeId} />
        </>
      )}
    </div>
  );
}
