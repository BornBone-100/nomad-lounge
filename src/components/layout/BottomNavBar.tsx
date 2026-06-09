"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, MessageCircle, Bell, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNotifications } from "@/hooks/useNotifications";

export function BottomNavBar() {
  const pathname = usePathname();
  const { unreadCount } = useNotifications();

  const NAV_ITEMS = [
    { href: "/home",          icon: Home,          label: "홈",    badge: 0 },
    { href: "/lounge",        icon: MessageCircle, label: "라운지", badge: 0 },
    { href: "/notifications", icon: Bell,          label: "알림",   badge: unreadCount },
    { href: "/profile",       icon: User,          label: "프로필", badge: 0 },
  ];

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white/80 backdrop-blur-md border-t border-gray-100 z-50">
      <div
        className="flex items-center justify-around px-2"
        style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}
      >
        {NAV_ITEMS.map(({ href, icon: Icon, label, badge }) => {
          const isActive = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-1 py-3 px-5 rounded-2xl transition-all",
                isActive ? "text-primary" : "text-gray-400 active:text-gray-600"
              )}
            >
              {/* 아이콘 + 배지 */}
              <div className="relative">
                <Icon className={cn("w-5 h-5 transition-all", isActive && "stroke-[2.5px]")} />
                {badge > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1
                    flex items-center justify-center
                    bg-red-500 text-white text-[9px] font-bold rounded-full leading-none">
                    {badge > 99 ? "99+" : badge}
                  </span>
                )}
              </div>
              <span className={cn("text-[10px] font-medium", isActive && "font-semibold")}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
