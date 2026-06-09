"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUserStore } from "@/store/userStore";

const HEARTBEAT_INTERVAL = 60 * 1000; // 1분마다 갱신

/**
 * 라운지 입장 시 호출 — 아래 두 가지를 자동 처리:
 * 1. profiles.current_city_id 업데이트
 * 2. profiles.last_seen_at 1분마다 heartbeat
 *
 * 컴포넌트 언마운트 시 자동 클리어
 */
export function usePresence(cityId: string | null) {
  const supabase = createClient();
  const { profile } = useUserStore();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!profile || !cityId) return;

    const updatePresence = async () => {
      await supabase
        .from("profiles")
        .update({
          current_city_id: cityId,
          last_seen_at: new Date().toISOString(),
        })
        .eq("id", profile.id);
    };

    // 입장 즉시 1회 실행
    updatePresence();

    // 이후 1분마다 heartbeat
    intervalRef.current = setInterval(updatePresence, HEARTBEAT_INTERVAL);

    // 라운지 이탈 시 클리어
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);

      // 도시 정보 초기화 (선택 사항 — 이탈 후 "어디 없음" 처리)
      supabase
        .from("profiles")
        .update({ current_city_id: null })
        .eq("id", profile.id)
        .then(() => {});
    };
  }, [cityId, profile?.id]);
}
