"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/store/userStore";

// /lounge 접근 시 — 현재 도시가 있으면 해당 라운지로, 없으면 홈으로 이동
export default function LoungeIndexPage() {
  const router = useRouter();
  const { currentCity } = useUserStore();

  useEffect(() => {
    if (currentCity?.id) {
      router.replace(`/lounge/${currentCity.id}`);
    } else {
      router.replace("/home");
    }
  }, [currentCity, router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center space-y-2">
        <div className="text-3xl animate-bounce">🌍</div>
        <p className="text-sm text-gray-400">라운지로 이동 중...</p>
      </div>
    </div>
  );
}
