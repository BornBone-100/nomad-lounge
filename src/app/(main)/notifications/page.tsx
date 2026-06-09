"use client";

export const dynamic = "force-dynamic";

import { useRouter } from "next/navigation";
import { CheckCheck, Bell } from "lucide-react";
import { useNotifications, TYPE_ICON } from "@/hooks/useNotifications";
import { relativeTime } from "@/lib/utils";
import { cn } from "@/lib/utils";

export default function NotificationsPage() {
  const router = useRouter();
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();

  const handleClick = async (notif: (typeof notifications)[number]) => {
    if (!notif.is_read) await markRead(notif.id);
    if (notif.action_url) router.push(notif.action_url);
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">

      {/* ── TopBar ── */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="flex items-center justify-between px-4 h-14">
          <h2 className="font-bold text-gray-900 text-base">알림</h2>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="flex items-center gap-1.5 text-xs text-primary font-semibold active:opacity-70"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              모두 읽음
            </button>
          )}
        </div>
      </header>

      {/* ── 목록 ── */}
      <div className="flex-1">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-gray-400">
            <Bell className="w-12 h-12 mb-3 opacity-20" />
            <p className="text-sm font-medium">아직 알림이 없어요</p>
            <p className="text-xs mt-1 text-gray-300">
              누군가 내 시그널에 반응하면 여기에 알림이 와요
            </p>
          </div>
        ) : (
          <ul>
            {notifications.map((n, i) => (
              <li key={n.id}>
                <button
                  onClick={() => handleClick(n)}
                  className={cn(
                    "w-full flex items-start gap-3 px-4 py-4 text-left transition-colors active:bg-gray-50",
                    !n.is_read ? "bg-primary/5" : "bg-white"
                  )}
                >
                  {/* 아이콘 */}
                  <div className={cn(
                    "w-10 h-10 rounded-2xl flex items-center justify-center text-xl shrink-0 mt-0.5",
                    !n.is_read ? "bg-primary/10" : "bg-gray-100"
                  )}>
                    {TYPE_ICON[n.type] ?? "🔔"}
                  </div>

                  {/* 내용 */}
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      "text-sm leading-snug",
                      !n.is_read ? "font-bold text-gray-900" : "font-medium text-gray-700"
                    )}>
                      {n.title}
                    </p>
                    {n.body && (
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2 leading-relaxed">
                        {n.body}
                      </p>
                    )}
                    <p className="text-[10px] text-gray-400 mt-1">
                      {relativeTime(n.created_at)}
                    </p>
                  </div>

                  {/* 읽지 않음 점 */}
                  {!n.is_read && (
                    <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-2" />
                  )}
                </button>

                {/* 구분선 */}
                {i < notifications.length - 1 && (
                  <div className="h-px bg-gray-100 mx-4" />
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
