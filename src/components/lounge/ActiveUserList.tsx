"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { SignalBadge } from "@/components/signal/SignalBadge";
import { isSignalActive } from "@/lib/utils";
import type { Profile } from "@/types/database";

interface ActiveUserListProps {
  cityId: string;
}

type ActiveUser = Pick<Profile, "id" | "nickname" | "home_country" | "status_signal" | "signal_emoji" | "signal_expires_at">;

export function ActiveUserList({ cityId }: ActiveUserListProps) {
  const supabase = createClient();
  const [users, setUsers] = useState<ActiveUser[]>([]);

  useEffect(() => {
    const fetchUsers = async () => {
      // 최근 10분 이내에 last_seen_at이 업데이트된 유저
      const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
      const { data } = await supabase
        .from("profiles")
        .select("id, nickname, home_country, status_signal, signal_emoji, signal_expires_at")
        .eq("current_city_id", cityId)
        .gte("last_seen_at", tenMinAgo)
        .limit(20);

      if (data) setUsers(data);
    };

    fetchUsers();

    // 30초마다 갱신
    const interval = setInterval(fetchUsers, 30000);
    return () => clearInterval(interval);
  }, [cityId]);

  if (users.length === 0) return null;

  return (
    <div className="px-4 py-3 border-b border-gray-100">
      <p className="text-xs text-gray-400 font-medium mb-2">지금 여기 있어요 👀</p>
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        {users.map((user) => (
          <div key={user.id} className="flex flex-col items-center gap-1 shrink-0">
            {/* 아바타 */}
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                {user.nickname[0].toUpperCase()}
              </div>
              {/* 온라인 점 */}
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-400 border-2 border-white" />
            </div>
            {/* 닉네임 */}
            <span className="text-[10px] text-gray-600 font-medium max-w-[48px] truncate">
              {user.nickname}
            </span>
            {/* 시그널 배지 */}
            {user.status_signal && isSignalActive(user.signal_expires_at) && (
              <SignalBadge
                signal={user.status_signal}
                emoji={user.signal_emoji ?? ""}
                size="sm"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
