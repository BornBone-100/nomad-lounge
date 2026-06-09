"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, MessageCircle, User } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/home", icon: Home, label: "홈" },
  { href: "/lounge", icon: MessageCircle, label: "라운지" },
  { href: "/profile", icon: User, label: "프로필" },
] as const;

export function BottomNavBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white/80 backdrop-blur-md border-t border-gray-100 z-50">
      <div
        className="flex items-center justify-around px-2 pb-[env(safe-area-inset-bottom)]"
        style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}
      >
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const isActive = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-1 py-3 px-5 rounded-2xl transition-all",
                isActive
                  ? "text-primary"
                  : "text-gray-400 active:text-gray-600"
              )}
            >
              <Icon
                className={cn(
                  "w-5 h-5 transition-all",
                  isActive && "stroke-[2.5px]"
                )}
              />
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
