"use client";

import { useState, useEffect } from "react";

// layout.tsx에서 Google Maps 스크립트를 전역으로 로드함
// 여기서는 window.google이 준비될 때까지 대기만 함
export function MapProvider({ children }: { children: React.ReactNode }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

    if (!apiKey) {
      setError(true);
      return;
    }

    // 이미 로드된 경우
    if (typeof window !== "undefined" && (window as any).google?.maps) {
      setIsLoaded(true);
      return;
    }

    // 스크립트 로드 대기 (최대 10초)
    let elapsed = 0;
    const interval = setInterval(() => {
      if ((window as any).google?.maps) {
        setIsLoaded(true);
        clearInterval(interval);
      }
      elapsed += 200;
      if (elapsed >= 10000) {
        setError(true);
        clearInterval(interval);
      }
    }, 200);

    return () => clearInterval(interval);
  }, []);

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <p className="text-4xl mb-3">🗺️</p>
          <p className="text-sm font-semibold text-gray-700">지도를 불러올 수 없어요</p>
          <p className="text-xs text-gray-400 mt-1">Google Maps API 키를 확인해주세요</p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="text-3xl animate-pulse">🗺️</div>
          <p className="text-sm text-gray-400">지도 로딩 중...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
