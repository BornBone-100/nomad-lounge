"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useUserStore } from "@/store/userStore";
import { TopBar } from "@/components/layout/TopBar";
import { MessageFeed } from "@/components/lounge/MessageFeed";
import { MessageInput } from "@/components/lounge/MessageInput";
import { ActiveUserList } from "@/components/lounge/ActiveUserList";
import { usePresence } from "@/hooks/usePresence";
import type { City } from "@/types/database";

export default function LoungePage() {
  const { cityId } = useParams<{ cityId: string }>();
  const supabase = createClient();
  const { setCurrentCity } = useUserStore();

  const [city, setCity] = useState<City | null>(null);
  const [loungeId, setLoungeId] = useState<string | null>(null);
  const [activeCount, setActiveCount] = useState(0);

  // 입장 시 presence 자동 등록 + 1분 heartbeat
  usePresence(cityId);

  useEffect(() => {
    const init = async () => {
      // 도시 정보 fetch
      const { data: cityData } = await supabase
        .from("cities")
        .select("*")
        .eq("id", cityId)
        .single();

      if (!cityData) return;
      setCity(cityData);
      setCurrentCity(cityData);
      setActiveCount(cityData.active_count);

      // 라운지 fetch (없으면 생성)
      let { data: lounge } = await supabase
        .from("lounges")
        .select("id")
        .eq("city_id", cityId)
        .single();

      if (!lounge) {
        const { data: newLounge } = await supabase
          .from("lounges")
          .insert({ city_id: cityId })
          .select("id")
          .single();
        lounge = newLounge;
      }

      if (lounge) setLoungeId(lounge.id);
    };

    init();
  }, [cityId]);

  // Realtime: active_count 변화 구독
  useEffect(() => {
    if (!cityId) return;

    const channel = supabase
      .channel(`city-count:${cityId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "cities", filter: `id=eq.${cityId}` },
        (payload) => {
          setActiveCount((payload.new as City).active_count);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [cityId]);

  if (!city || !loungeId) {
    return (
      <div className="flex flex-col min-h-screen">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-2">
            <div className="text-3xl animate-bounce">🌍</div>
            <p className="text-sm text-gray-400">라운지 입장 중...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      <TopBar
        title={`${city.emoji ?? ""} ${city.name_ko ?? city.name}`}
        subtitle={`${city.name} · ${city.country}`}
        activeCount={activeCount}
        showBack
      />

      {/* 접속자 목록 */}
      <ActiveUserList cityId={cityId} />

      {/* 메시지 피드 */}
      <MessageFeed loungeId={loungeId} />

      {/* 메시지 입력창 */}
      <MessageInput loungeId={loungeId} />
    </div>
  );
}
