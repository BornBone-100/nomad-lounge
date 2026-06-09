"use client";

/**
 * 매칭 추천 훅
 *
 * 점수 산정 기준 (100점 만점):
 *   여행 스타일 태그 겹침   : 태그 1개당 +20 (최대 +60)
 *   체류 일정 겹침           : 하루라도 겹치면 +25
 *   언어 호환               : 상대방 선호 언어 일치 시 +15
 *   인증 유저               : +10
 *   매너온도 38℃ 이상       : +5
 *   자기소개 작성            : +5 (프로필 성의)
 *
 * 필터:
 *   - 동일 유저 제외
 *   - 현재 도시에 있는 유저 (current_city_id 일치)
 *   - 최근 10분 이내 last_seen_at (활성 유저만)
 *   - 점수 0 이하 제외
 *   - 최대 5명까지 반환
 */

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
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
  is_verified: boolean;
  manner_temperature: number;
  score: number;
  matchReasons: string[];  // e.g. ["스타일 3개 일치", "일정 겹침"]
}

function datesOverlap(
  aIn: string | null, aOut: string | null,
  bIn: string | null, bOut: string | null
): boolean {
  if (!aIn || !aOut || !bIn || !bOut) return false;
  return aIn <= bOut && bIn <= aOut;
}

export function useMatchRecommendations(cityId: string) {
  const supabase = createClient();
  const { profile } = useUserStore();
  const [matches, setMatches] = useState<MatchedProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.id || !cityId) return;

    const load = async () => {
      setLoading(true);

      // 내 프로필 상세 조회 (점수 비교 기준)
      const { data: me } = await supabase
        .from("profiles")
        .select("travel_style_tags, check_in_date, check_out_date, preferred_lang, manner_temperature")
        .eq("id", profile.id)
        .single();

      // 같은 도시에 있는 활성 유저 조회 (10분 이내 접속)
      const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
      const { data: candidates } = await supabase
        .from("profiles")
        .select(`
          id, nickname, home_country, bio,
          travel_style_tags, visited_countries,
          check_in_date, check_out_date,
          status_signal, signal_emoji,
          is_verified, manner_temperature, preferred_lang
        `)
        .eq("current_city_id", cityId)
        .gte("last_seen_at", tenMinAgo)
        .neq("id", profile.id)
        .limit(50);

      if (!candidates) { setLoading(false); return; }

      const myTags: string[] = me?.travel_style_tags ?? [];
      const myLang: string = me ? (profile as any).preferred_lang ?? "ko" : "ko";

      const scored = candidates
        .map((c) => {
          let score = 0;
          const reasons: string[] = [];

          // 여행 스타일 태그 겹침
          const tagOverlap = myTags.filter((t) => (c.travel_style_tags ?? []).includes(t));
          if (tagOverlap.length > 0) {
            const pts = Math.min(tagOverlap.length, 3) * 20;
            score += pts;
            reasons.push(`스타일 ${tagOverlap.length}개 일치`);
          }

          // 체류 일정 겹침
          if (datesOverlap(me?.check_in_date, me?.check_out_date, c.check_in_date, c.check_out_date)) {
            score += 25;
            reasons.push("일정 겹침");
          }

          // 언어 호환 (상대방 언어 = 내 언어)
          if (c.preferred_lang && c.preferred_lang !== myLang) {
            // 언어 다를 때 — 번역 기능 덕분에 오히려 글로벌 매칭 포인트
            score += 15;
            reasons.push("글로벌 연결");
          }

          // 인증 유저
          if (c.is_verified) { score += 10; reasons.push("인증 여행자"); }

          // 매너온도 38℃ 이상
          if ((c.manner_temperature ?? 36.5) >= 38) { score += 5; }

          // 자기소개 있음
          if (c.bio) { score += 5; reasons.push("프로필 완성"); }

          return { ...c, score, matchReasons: reasons } as MatchedProfile;
        })
        .filter((c) => c.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);

      setMatches(scored);
      setLoading(false);
    };

    load();
    // 1분마다 갱신 (접속 상태 반영)
    const interval = setInterval(load, 60_000);
    return () => clearInterval(interval);
  }, [cityId, profile?.id]);

  return { matches, loading };
}
