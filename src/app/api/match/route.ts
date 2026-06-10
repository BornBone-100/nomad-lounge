/**
 * POST /api/match
 *
 * 매칭 점수 산정 기준 (최대 100점):
 * ┌──────────────────────────────────┬──────┐
 * │ 여행 스타일 태그 겹침 (태그당)    │ +18  │  max 54
 * │ 체류 일정 겹침 (일수 비례)        │ +20  │  max 20
 * │ 방문 나라 겹침 (나라당)           │  +5  │  max 15
 * │ 시그널 활성 중                    │ +15  │
 * │ 매너온도 점수 (곡선)              │  0~8 │
 * │ 인증 여행자                       │  +7  │
 * │ 프로필 완성도                     │  +5  │
 * └──────────────────────────────────┴──────┘
 *
 * 제외 필터:
 * - shadow_banned 유저
 * - 이미 DM한 상대 (messages 테이블)
 * - 10분 이상 비활성 유저
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// 매너온도 → 점수 (36.5 기준 곡선, 최대 8점)
function temperatureScore(temp: number): number {
  if (temp >= 40) return 8;
  if (temp >= 38) return 6;
  if (temp >= 36.5) return 4;
  if (temp >= 33) return 2;
  return 0;
}

// 일정 겹치는 일수 계산
function overlapDays(
  aIn: string | null, aOut: string | null,
  bIn: string | null, bOut: string | null
): number {
  if (!aIn || !aOut || !bIn || !bOut) return 0;
  const start = aIn > bIn ? aIn : bIn;
  const end   = aOut < bOut ? aOut : bOut;
  if (start > end) return 0;
  const ms = new Date(end).getTime() - new Date(start).getTime();
  return Math.floor(ms / 86_400_000) + 1;
}

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const body = await req.json();
  const { city_id, user_id } = body as { city_id: string; user_id: string };

  if (!city_id || !user_id) {
    return NextResponse.json({ error: "city_id, user_id 필수" }, { status: 400 });
  }

  // ── 1. 내 프로필 조회 ────────────────────────────────────────────
  const { data: me } = await supabase
    .from("profiles")
    .select(`
      travel_style_tags, visited_countries,
      check_in_date, check_out_date, preferred_lang
    `)
    .eq("id", user_id)
    .single();

  // ── 2. 이미 DM한 상대 목록 ────────────────────────────────────────
  const { data: dmHistory } = await supabase
    .from("messages")
    .select("receiver_id, sender_id")
    .or(`sender_id.eq.${user_id},receiver_id.eq.${user_id}`)
    .not("receiver_id", "is", null);

  const alreadyDmed = new Set<string>(
    (dmHistory ?? []).flatMap((m) => [m.sender_id, m.receiver_id])
  );
  alreadyDmed.delete(user_id);

  // ── 3. 후보 유저 조회 ──────────────────────────────────────────────
  const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();

  const { data: candidates } = await supabase
    .from("profiles")
    .select(`
      id, nickname, home_country, bio,
      travel_style_tags, visited_countries,
      check_in_date, check_out_date,
      status_signal, signal_emoji, signal_expires_at,
      is_verified, manner_temperature, preferred_lang,
      status
    `)
    .eq("current_city_id", city_id)
    .gte("last_seen_at", tenMinAgo)
    .neq("id", user_id)
    .neq("status", "shadow_banned")   // Shadow Ban 제외
    .limit(100);

  if (!candidates) return NextResponse.json({ matches: [] });

  const myTags: string[]     = me?.travel_style_tags ?? [];
  const myCountries: string[] = me?.visited_countries ?? [];

  // ── 4. 점수 계산 ──────────────────────────────────────────────────
  const now = new Date().toISOString();

  const scored = candidates
    .filter((c) => !alreadyDmed.has(c.id))   // 이미 DM한 상대 제외
    .map((c) => {
      let score = 0;
      const reasons: string[] = [];

      // 여행 스타일 태그 겹침
      const tagOverlap = myTags.filter((t) => (c.travel_style_tags ?? []).includes(t));
      if (tagOverlap.length > 0) {
        score += Math.min(tagOverlap.length, 3) * 18;
        reasons.push(`스타일 ${tagOverlap.length}개 일치`);
      }

      // 체류 일정 겹침 (일수에 비례, 최대 20점)
      const days = overlapDays(
        me?.check_in_date, me?.check_out_date,
        c.check_in_date, c.check_out_date
      );
      if (days > 0) {
        score += Math.min(days * 4, 20);
        reasons.push(`일정 ${days}일 겹침`);
      }

      // 방문 나라 겹침 (나라당 5점, 최대 15점)
      const countryOverlap = myCountries.filter((c2) => (c.visited_countries ?? []).includes(c2));
      if (countryOverlap.length > 0) {
        score += Math.min(countryOverlap.length, 3) * 5;
        reasons.push(`여행지 ${countryOverlap.length}개 겹침`);
      }

      // 시그널 활성 중 (지금 당장 만날 수 있음)
      const signalActive = c.signal_expires_at && c.signal_expires_at > now;
      if (signalActive) {
        score += 15;
        reasons.push("지금 만날 수 있음 ⚡");
      }

      // 매너온도 점수
      score += temperatureScore(c.manner_temperature ?? 36.5);

      // 인증 여행자
      if (c.is_verified) {
        score += 7;
        reasons.push("인증 여행자");
      }

      // 프로필 완성도 (자기소개 있으면)
      if (c.bio) score += 5;

      return {
        id:                  c.id,
        nickname:            c.nickname,
        home_country:        c.home_country,
        bio:                 c.bio,
        travel_style_tags:   c.travel_style_tags ?? [],
        visited_countries:   c.visited_countries ?? [],
        check_in_date:       c.check_in_date,
        check_out_date:      c.check_out_date,
        status_signal:       c.status_signal,
        signal_emoji:        c.signal_emoji,
        is_verified:         c.is_verified,
        manner_temperature:  c.manner_temperature,
        signal_active:       !!signalActive,
        score,
        matchReasons: reasons,
      };
    })
    .filter((c) => c.score > 0)
    .sort((a, b) => {
      // 시그널 활성 유저 최상단 고정 후 점수순
      if (a.signal_active !== b.signal_active) return a.signal_active ? -1 : 1;
      return b.score - a.score;
    })
    .slice(0, 6);

  return NextResponse.json({ matches: scored });
}
