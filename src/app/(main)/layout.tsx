"use client";

export const dynamic = "force-dynamic";

import { usePathname } from "next/navigation";
import { BottomNavBar } from "@/components/layout/BottomNavBar";
import { useProfileInitializer } from "@/hooks/useProfileInitializer";

// explore는 풀스크린 맵 — BottomNavBar 숨김
const HIDE_NAVBAR_PATHS = ["/explore"];

export default function MainLayout({ children }: { children: React.ReactNode }) {
  useProfileInitializer(); // 새로고침 시 프로필 자동 복원

  const pathname = usePathname();
  const hideNav = HIDE_NAVBAR_PATHS.some((p) => pathname.startsWith(p));

  return (
    <div className="flex flex-col min-h-screen">
      <main className={hideNav ? "flex-1" : "flex-1 pb-20"}>{children}</main>
      {!hideNav && <BottomNavBar />}
    </div>
  );
}
