"use client";

import { useRouter } from "next/navigation";
import { MessageCircle, ShieldCheck, X, MapPin, Star, Clock } from "lucide-react";
import type { UserSignalWithProfile } from "@/types/database";
import { cn } from "@/lib/utils";

interface UserSignalCardProps {
  signal: UserSignalWithProfile;
  onClose: () => void;
}

function TempBar({ temp }: { temp: number }) {
  const pct  = Math.min(100, Math.max(0, ((temp - 20) / 60) * 100));
  const color = temp >= 50 ? "bg-orange-400" : temp >= 36 ? "bg-green-400" : "bg-blue-400";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[10px] font-bold text-gray-500">{temp.toFixed(1)}℃</span>
    </div>
  );
}

export function UserSignalCard({ signal, onClose }: UserSignalCardProps) {
  const router = useRouter();
  const { profiles: p, places_db: place } = signal;

  const expiresIn = Math.max(0, Math.round(
    (new Date(signal.expires_at).getTime() - Date.now()) / 60000
  ));

  return (
    <div
      className="absolute bottom-[52%] left-4 right-4 z-40 pointer-events-auto"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="bg-white rounded-3xl shadow-2xl shadow-black/15 overflow-hidden border border-gray-100">

        {/* ── 헤더 ── */}
        <div className="relative p-4 pb-3">
          {/* 닫기 버튼 */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center
              rounded-full bg-gray-100 hover:bg-gray-200 active:scale-95 transition-all"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>

          {/* 아바타 + 이름 */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-400 to-indigo-500
                flex items-center justify-center text-xl font-bold text-white shadow-md">
                {p.avatar_url
                  ? <img src={p.avatar_url} className="w-full h-full rounded-2xl object-cover" alt="" />
                  : p.nickname[0].toUpperCase()}
              </div>
              {/* 시그널 이모지 배지 */}
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-white
                flex items-center justify-center text-sm shadow-sm border border-gray-100">
                {signal.emoji}
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-gray-900 text-base">{p.nickname}</span>
                {p.is_verified && (
                  <ShieldCheck className="w-4 h-4 text-green-500 shrink-0" />
                )}
              </div>
              <p className="text-xs text-gray-400">
                {p.home_country ? `🌍 ${p.home_country}` : "어딘가에서 온"}
              </p>
              <TempBar temp={p.manner_temperature ?? 36.5} />
            </div>
          </div>
        </div>

        {/* ── 시그널 콘텐츠 ── */}
        <div className="mx-4 mb-3 px-4 py-3 bg-gradient-to-r from-violet-50 to-indigo-50
          rounded-2xl border border-violet-100">
          <p className="text-sm font-semibold text-gray-800 leading-relaxed">
            {signal.emoji} {signal.content}
          </p>
          {/* 연결된 맛집 */}
          {place && (
            <div className="flex items-center gap-1.5 mt-2 text-xs text-violet-600 font-medium">
              <MapPin className="w-3 h-3 shrink-0" />
              <span>{place.name_ko ?? place.name}</span>
            </div>
          )}
          {/* 만료 시간 */}
          <div className="flex items-center gap-1 mt-1.5 text-[10px] text-gray-400">
            <Clock className="w-3 h-3" />
            {expiresIn > 60
              ? `${Math.floor(expiresIn / 60)}시간 후 만료`
              : `${expiresIn}분 후 만료`}
          </div>
        </div>

        {/* ── 취미 태그 ── */}
        {p.hobbies && p.hobbies.length > 0 && (
          <div className="flex gap-1.5 flex-wrap px-4 mb-3">
            {p.hobbies.slice(0, 4).map((h) => (
              <span key={h} className="text-[10px] font-semibold px-2 py-0.5
                bg-gray-100 text-gray-600 rounded-full">
                {h}
              </span>
            ))}
          </div>
        )}

        {/* ── DM 버튼 ── */}
        <div className="px-4 pb-4">
          <button
            onClick={() => {
              onClose();
              router.push(`/dm/${signal.user_id}?name=${encodeURIComponent(p.nickname)}`);
            }}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl
              bg-gradient-to-r from-violet-500 to-indigo-500
              text-white font-bold text-sm
              active:scale-[0.98] transition-all shadow-lg shadow-violet-200"
          >
            <MessageCircle className="w-4 h-4" />
            지금 DM 보내기
          </button>
        </div>
      </div>
    </div>
  );
}
