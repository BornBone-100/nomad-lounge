"use client";

/**
 * 매칭 추천 훅 — /api/match 서버 라우트 호출
 *
 * 서버에서 처리하는 것:
 *  - Shadow Ban 필터링
 *  - 이미 DM한 상대 제외
 *  - 점수 계산 (태그/일정/나라/시그널/온도/인증)
 *  - 시그널 활성 유저 최상단 고정
 */

import { useEffect, useState, useCallback } from "react";
import { useUserStore } from "@/store/userStore";

export interface MatchedProfile {
  id: string;
  nickname: string;
  home_country: string | null;
  bio: string | null;
  travel_style_tags: string[];
  visited_countries: string[];
  check_in_date: string | null;
  check_out_date: string | null;
  status_signal: string | null;
  signal_emoji: string | null;
  signal_active: boolean;
  is_verified: boolean;
  manner_temperature: number;
  score: number;
  matchReasons: string[];
}

export function useMatchRecommendations(cityId: string) {
  const { profile } = useUserStore();
  const [matches, setMatches] = useState<MatchedProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMatches = useCallback(async () => {
    if (!profile?.id || !cityId) return;
    setLoading(true);
    try {
      const res = await fetch("/api/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ city_id: cityId, user_id: profile.id }),
      });
      const data = await res.json();
      setMatches(data.matches ?? []);
    } catch {
      setMatches([]);
    } finally {
      setLoading(false);
    }
  }, [cityId, profile?.id]);

  useEffect(() => {
    fetchMatches();
    const interval = setInterval(fetchMatches, 60_000);
    return () => clearInterval(interval);
  }, [fetchMatches]);

  return { matches, loading, refresh: fetchMatches };
}
