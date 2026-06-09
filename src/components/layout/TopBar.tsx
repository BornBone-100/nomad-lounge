"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft, Users } from "lucide-react";

interface TopBarProps {
  title: string;
  subtitle?: string;
  activeCount?: number;
  showBack?: boolean;
}

export function TopBar({ title, subtitle, activeCount, showBack = false }: TopBarProps) {
  const router = useRouter();

  return (
    <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="flex items-center gap-3 px-4 h-14">
        {showBack && (
          <button
            onClick={() => router.back()}
            className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 active:scale-95 transition-all -ml-1"
          >
            <ChevronLeft className="w-5 h-5 text-gray-700" />
          </button>
        )}

        <div className="flex-1 min-w-0">
          <h2 className="font-bold text-gray-900 text-base leading-tight truncate">{title}</h2>
          {subtitle && (
            <p className="text-xs text-gray-400 truncate">{subtitle}</p>
          )}
        </div>

        {activeCount !== undefined && (
          <div className="flex items-center gap-1.5 bg-green-50 px-2.5 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse-slow" />
            <span className="text-xs font-medium text-green-700">
              <Users className="w-3 h-3 inline mr-0.5" />
              {activeCount}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
