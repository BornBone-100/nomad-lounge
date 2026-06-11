"use client";

import { useState } from "react";
import { MapPin, Star, Users, ChevronRight, Clock, ShieldCheck, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useUserStore } from "@/store/userStore";
import type { PlaceWithMeetups } from "@/types/database";
import { PLACE_CATEGORY_META } from "@/types/database";
import { cn } from "@/lib/utils";

interface PlaceCardProps {
  place: PlaceWithMeetups;
  onMapFocus?: (lat: number, lng: number) => void;
}

// 가격 표시 ($~$$$$)
function PriceRange({ level }: { level: number }) {
  return (
    <span className="text-xs text-gray-500">
      {"$".repeat(level)}<span className="text-gray-200">{"$".repeat(4 - level)}</span>
    </span>
  );
}

function formatMeetTime(isoStr: string) {
  const d = new Date(isoStr);
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}시`;
}

export function PlaceCard({ place, onMapFocus }: PlaceCardProps) {
  const supabase           = createClient();
  const { profile }        = useUserStore();
  const [joining, setJoin] = useState<string | null>(null);
  const meta               = PLACE_CATEGORY_META[place.category];

  const openMeetups = place.place_meetups?.filter((m) => m.status === "open") ?? [];

  const joinMeetup = async (meetupId: string) => {
    if (!profile) return;
    setJoin(meetupId);
    await supabase.from("place_meetup_members").insert({
      meetup_id: meetupId,
      user_id: profile.id,
    });
    setJoin(null);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden
      active:scale-[0.99] transition-all">

      {/* ── 상단 이미지 / 카테고리 배너 ── */}
      <div className={cn(
        "relative h-24 flex items-center justify-center",
        place.photos?.[0] ? "" : "bg-gradient-to-br from-gray-50 to-gray-100"
      )}>
        {place.photos?.[0]
          ? <img src={place.photos[0]} className="w-full h-full object-cover" alt={place.name} />
          : <span className="text-4xl">{meta.emoji}</span>
        }

        {/* 카테고리 배지 */}
        <div className={cn(
          "absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold",
          meta.color
        )}>
          <span>{meta.emoji}</span>
          <span>{meta.label}</span>
        </div>

        {/* 로컬 인증 배지 */}
        {place.is_verified && (
          <div className="absolute top-2 right-2 flex items-center gap-1
            bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
            <ShieldCheck className="w-2.5 h-2.5" />
            로컬인증
          </div>
        )}
      </div>

      {/* ── 본문 ── */}
      <div className="p-3">
        <div className="flex items-start justify-between gap-2 mb-1">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-gray-900 text-sm leading-tight truncate">
              {place.name_ko ?? place.name}
            </h3>
            {place.name_ko && (
              <p className="text-[10px] text-gray-400">{place.name}</p>
            )}
          </div>
          {/* 지도에서 보기 버튼 */}
          <button
            onClick={() => onMapFocus?.(place.latitude, place.longitude)}
            className="shrink-0 w-7 h-7 flex items-center justify-center
              rounded-xl bg-gray-50 hover:bg-gray-100 active:scale-95 transition-all"
          >
            <MapPin className="w-3.5 h-3.5 text-gray-500" />
          </button>
        </div>

        {/* 평점 + 가격 */}
        <div className="flex items-center gap-2 mb-2">
          <div className="flex items-center gap-0.5">
            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
            <span className="text-xs font-bold text-gray-700">{place.avg_rating.toFixed(1)}</span>
            <span className="text-[10px] text-gray-400">({place.review_count})</span>
          </div>
          <span className="text-gray-200">·</span>
          <PriceRange level={place.price_range} />
          {place.address && (
            <>
              <span className="text-gray-200">·</span>
              <span className="text-[10px] text-gray-400 truncate flex-1">{place.address}</span>
            </>
          )}
        </div>

        {/* 로컬 한줄평 */}
        {place.local_review && (
          <p className="text-xs text-gray-600 bg-amber-50 rounded-xl px-3 py-2 mb-2
            border-l-2 border-amber-300 leading-relaxed italic">
            "{place.local_review}"
          </p>
        )}

        {/* 태그 */}
        {place.tags.length > 0 && (
          <div className="flex gap-1 flex-wrap mb-2">
            {place.tags.slice(0, 4).map((tag) => (
              <span key={tag} className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* ── 밥메이트 모집 섹션 ── */}
        {openMeetups.length > 0 && (
          <div className="mt-2 space-y-1.5">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">
              🍽️ 지금 동행 모집 중
            </p>
            {openMeetups.slice(0, 2).map((m) => (
              <div key={m.id}
                className="flex items-center gap-2 p-2 rounded-xl bg-violet-50 border border-violet-100">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-800 truncate">{m.title}</p>
                  <div className="flex items-center gap-1.5 text-[10px] text-gray-500 mt-0.5">
                    <Clock className="w-3 h-3" />
                    <span>{formatMeetTime(m.meet_at)}</span>
                    <Users className="w-3 h-3 ml-1" />
                    <span>{m.current_members}/{m.max_members}명</span>
                  </div>
                </div>
                <button
                  onClick={() => joinMeetup(m.id)}
                  disabled={joining === m.id || m.status === "full"}
                  className={cn(
                    "shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition-all",
                    m.status === "full"
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-violet-500 text-white active:scale-95"
                  )}
                >
                  {joining === m.id ? "..." : m.status === "full" ? "마감" : (
                    <><Plus className="w-3 h-3" /> 참여</>
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
