"use client";

import { useState } from "react";
import { Users, MessageCircle, ChevronRight, Zap } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useUserStore } from "@/store/userStore";
import { useRouter } from "next/navigation";
import type { SquadWithMembership } from "@/types/database";
import { cn } from "@/lib/utils";

interface SquadCardProps {
  squad: SquadWithMembership;
  onJoined?: (squadId: string) => void;
}

const HOBBY_COLORS: Record<string, string> = {
  surfing:      "from-blue-400   to-cyan-400",
  yoga:         "from-purple-400 to-pink-400",
  street_food:  "from-orange-400 to-red-400",
  temple:       "from-amber-400  to-yellow-300",
  museum:       "from-indigo-400 to-violet-400",
  wine_tasting: "from-rose-400   to-red-400",
  ramen_tour:   "from-red-400    to-orange-400",
  anime:        "from-pink-400   to-fuchsia-400",
  hiking:       "from-green-400  to-emerald-400",
  nightlife:    "from-purple-500 to-indigo-500",
  photography:  "from-gray-500   to-slate-500",
  default:      "from-violet-400 to-indigo-400",
};

export function SquadCard({ squad, onJoined }: SquadCardProps) {
  const supabase        = createClient();
  const { profile }     = useUserStore();
  const router          = useRouter();
  const [loading, setL] = useState(false);
  const [joined, setJoined] = useState(squad.is_member ?? false);

  const gradient = HOBBY_COLORS[squad.hobby_tag] ?? HOBBY_COLORS.default;

  const handleJoin = async () => {
    if (!profile || loading) return;
    setL(true);
    const { error } = await supabase.from("squad_members").insert({
      squad_id: squad.id,
      user_id:  profile.id,
    });
    if (!error) {
      setJoined(true);
      onJoined?.(squad.id);
    }
    setL(false);
  };

  const handleLeave = async () => {
    if (!profile || loading) return;
    setL(true);
    await supabase.from("squad_members")
      .delete()
      .eq("squad_id", squad.id)
      .eq("user_id", profile.id);
    setJoined(false);
    setL(false);
  };

  const goToSquadChat = () => {
    if (squad.lounge_id) {
      router.push(`/lounge/${squad.city_id}?loungeId=${squad.lounge_id}`);
    }
  };

  return (
    <div className={cn(
      "relative rounded-2xl overflow-hidden",
      "border border-gray-100 shadow-sm",
      joined && "ring-2 ring-violet-400 ring-offset-1"
    )}>
      {/* 그라디언트 헤더 */}
      <div className={cn(
        "bg-gradient-to-r h-16 flex items-center justify-between px-4",
        gradient
      )}>
        <div className="flex items-center gap-2">
          <span className="text-3xl">{squad.emoji}</span>
          <div>
            <h3 className="font-bold text-white text-sm leading-tight">{squad.name}</h3>
            <div className="flex items-center gap-1 text-white/80 text-[10px]">
              <Users className="w-3 h-3" />
              <span>{squad.member_count}명 참여 중</span>
            </div>
          </div>
        </div>
        {/* 활성도 뱃지 */}
        {squad.member_count >= 5 && (
          <div className="flex items-center gap-1 bg-white/20 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
            <Zap className="w-2.5 h-2.5" />
            HOT
          </div>
        )}
      </div>

      {/* 본문 */}
      <div className="bg-white p-3">
        {squad.description && (
          <p className="text-xs text-gray-500 mb-3 leading-relaxed">{squad.description}</p>
        )}

        <div className="flex gap-2">
          {/* 채팅 참여 버튼 (가입된 경우) */}
          {joined && squad.lounge_id && (
            <button
              onClick={goToSquadChat}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl
                bg-gray-100 text-gray-700 text-xs font-semibold active:scale-95 transition-all"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              채팅 참여
            </button>
          )}

          {/* 가입 / 탈퇴 버튼 */}
          <button
            onClick={joined ? handleLeave : handleJoin}
            disabled={loading}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl",
              "text-xs font-bold active:scale-95 transition-all",
              joined
                ? "bg-gray-100 text-gray-500"
                : `bg-gradient-to-r ${gradient} text-white shadow-md`
            )}
          >
            {loading ? "..." : joined ? "탈퇴하기" : (
              <><span>+</span> 스쿼드 참여</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
