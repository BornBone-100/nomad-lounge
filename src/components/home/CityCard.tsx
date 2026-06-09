"use client";

import { Users } from "lucide-react";
import type { City } from "@/types/database";

interface CityCardProps {
  city: City;
  onClick: (city: City) => void;
}

export function CityCard({ city, onClick }: CityCardProps) {
  return (
    <button
      onClick={() => onClick(city)}
      className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white border border-gray-100
        hover:border-primary/30 hover:shadow-md hover:shadow-primary/5
        active:scale-[0.98] transition-all duration-150 text-left"
    >
      {/* 국기 이모지 */}
      <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center text-2xl shrink-0">
        {city.emoji ?? "🌍"}
      </div>

      {/* 도시 정보 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-gray-900 text-sm">{city.name_ko ?? city.name}</span>
          <span className="text-xs text-gray-400">{city.name}</span>
        </div>
        <span className="text-xs text-gray-400">{city.country}</span>
      </div>

      {/* 접속자 수 */}
      <div className="flex items-center gap-1 shrink-0">
        {city.active_count > 0 ? (
          <>
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse-slow" />
            <span className="text-xs font-medium text-green-600">{city.active_count}명</span>
          </>
        ) : (
          <span className="text-xs text-gray-300 flex items-center gap-1">
            <Users className="w-3 h-3" />
            조용함
          </span>
        )}
      </div>
    </button>
  );
}
