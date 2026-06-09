"use client";

import { useEffect, useState } from "react";
import { Zap } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { isSignalActive } from "@/lib/utils";
import type { Profile } from "@/types/database";

type SignalUser = Pick<Profile, "id" | "nickname" | "home_country" | "status_signal" | "signal_emoji" | "signal_expires_at">;

interface SignalStoriesProps {
  cityId: string;
  onUserClick?: (userId: string) => void;
}

export function SignalStories({ cityId, onUserClick }: SignalStoriesProps) {
  const supabase = createClient();
  const [users, setUsers] = useState<SignalUser[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
      const { data } = await supabase
        .from("profiles")
        .select("id, nickname, home_country, status_signal, signal_emoji, signal_expires_at")
        .eq("current_city_id", cityId)
        .gte("last_seen_at", tenMinAgo)
        .not("status_signal", "is", null);
      if (data) setUsers(data.filter((u) => isSignalActive(u.signal_expires_at)));
    };
    fetch();
    const interval = setInterval(fetch, 30000);
    return () => clearInterval(interval);
  }, [cityId]);

  if (users.length === 0) return null;

  return (
    <div className="px-4 py-3 border-b border-gray-100 bg-white">
      <div className="flex items-center gap-1.5 mb-2.5">
        <Zap className="w-3.5 h-3.5 text-yellow-500" fill="currentColor" />
        <span className="text-xs font-bold text-gray-900">
          지금 당장 번개 가능! ({users.length}명)
        </span>
      </div>
      <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
        {users.map((user) => (
          <button
            key={user.id}
            onClick={() => onUserClick?.(user.id)}
            className="flex flex-col items-center gap-1 shrink-0 active:scale-95 transition-all"
          >
            {/* 스토리 링 — 시그널 있으면 그라데이션 테두리 */}
            <div className="p-[2px] rounded-full bg-gradient-to-tr from-primary via-violet-500 to-pink-400">
              <div className="p-[2px] bg-white rounded-full">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-lg font-bold text-primary">
                  {user.nickname[0].toUpperCase()}
                </div>
              </div>
            </div>
            {/* 시그널 이모지 뱃지 */}
            <div className="flex flex-col items-center">
              <span className="text-base leading-none">{user.signal_emoji}</span>
              <span className="text-[10px] text-gray-500 font-medium max-w-[52px] truncate">
                {user.nickname}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
