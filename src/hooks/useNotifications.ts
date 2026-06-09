"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUserStore } from "@/store/userStore";

export interface AppNotification {
  id: string;
  type: "dm" | "meetup_accepted" | "meetup_declined" | "signal_reaction" | "city_active";
  title: string;
  body: string | null;
  action_url: string | null;
  is_read: boolean;
  created_at: string;
}

const TYPE_ICON: Record<AppNotification["type"], string> = {
  dm:               "💬",
  meetup_accepted:  "🎉",
  meetup_declined:  "😢",
  signal_reaction:  "⚡",
  city_active:      "🌍",
};

export { TYPE_ICON };

export function useNotifications() {
  const supabase = createClient();
  const { profile } = useUserStore();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const refresh = useCallback(async () => {
    if (!profile?.id) return;
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(50);
    if (data) {
      setNotifications(data as AppNotification[]);
      setUnreadCount(data.filter((n) => !n.is_read).length);
    }
  }, [profile?.id]);

  // 초기 로드
  useEffect(() => { refresh(); }, [refresh]);

  // Realtime 구독 — 새 알림 실시간 수신
  useEffect(() => {
    if (!profile?.id) return;
    const channel = supabase
      .channel(`notifications:${profile.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${profile.id}`,
        },
        (payload) => {
          const notif = payload.new as AppNotification;
          setNotifications((prev) => [notif, ...prev]);
          setUnreadCount((prev) => prev + 1);
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [profile?.id]);

  // 단일 읽음 처리
  const markRead = useCallback(async (id: string) => {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    setNotifications((prev) =>
      prev.map((n) => n.id === id ? { ...n, is_read: true } : n)
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }, []);

  // 전체 읽음 처리
  const markAllRead = useCallback(async () => {
    if (!profile?.id) return;
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", profile.id)
      .eq("is_read", false);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
  }, [profile?.id]);

  return { notifications, unreadCount, markRead, markAllRead, refresh };
}
