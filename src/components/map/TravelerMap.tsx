"use client";

import { useState, useCallback, useEffect } from "react";
import {
  GoogleMap,
  MarkerF,
  InfoWindowF,
} from "@react-google-maps/api";
import { MessageCircle, ShieldCheck, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface TravelerPin {
  id: string;
  nickname: string;
  home_country: string | null;
  bio: string | null;
  status_signal: string | null;
  signal_emoji: string | null;
  is_verified: boolean;
  manner_temperature: number;
  latitude: number;
  longitude: number;
}

interface TravelerMapProps {
  cityId: string;
  cityLat: number;
  cityLng: number;
}

const MAP_STYLES = [
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "transit", stylers: [{ visibility: "simplified" }] },
];

const MAP_OPTIONS: google.maps.MapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  mapTypeControl: false,
  streetViewControl: false,
  fullscreenControl: false,
  styles: MAP_STYLES,
};

function countryToFlag(code: string | null): string {
  if (!code) return "🌍";
  return code.toUpperCase().split("").map((c) =>
    String.fromCodePoint(127397 + c.charCodeAt(0))
  ).join("");
}

export function TravelerMap({ cityId, cityLat, cityLng }: TravelerMapProps) {
  const router = useRouter();
  const supabase = createClient();
  const [travelers, setTravelers] = useState<TravelerPin[]>([]);
  const [selected, setSelected] = useState<TravelerPin | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);

  // 10분 이내 접속 + 위치 있는 여행자 fetch
  useEffect(() => {
    const fetch = async () => {
      const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
      const { data } = await supabase
        .from("profiles")
        .select("id, nickname, home_country, bio, status_signal, signal_emoji, is_verified, manner_temperature, latitude, longitude")
        .eq("current_city_id", cityId)
        .gte("last_seen_at", tenMinAgo)
        .not("latitude", "is", null)
        .neq("status", "terminated")
        .neq("status", "shadow_banned");
      if (data) setTravelers(data as TravelerPin[]);
    };
    fetch();
    const interval = setInterval(fetch, 30_000);
    return () => clearInterval(interval);
  }, [cityId]);

  const onLoad = useCallback((m: google.maps.Map) => setMap(m), []);

  // 핀 아이콘 — 시그널 활성 여부에 따라 색상 다름
  const pinIcon = (hasSignal: boolean): google.maps.Symbol => ({
    path: google.maps.SymbolPath.CIRCLE,
    scale: hasSignal ? 10 : 8,
    fillColor: hasSignal ? "#F59E0B" : "#6366F1",
    fillOpacity: 1,
    strokeColor: "#FFFFFF",
    strokeWeight: 2,
  });

  return (
    <div className="flex-1 relative">
      <GoogleMap
        mapContainerClassName="w-full h-full"
        center={{ lat: cityLat, lng: cityLng }}
        zoom={14}
        options={MAP_OPTIONS}
        onLoad={onLoad}
        onClick={() => setSelected(null)}
      >
        {travelers.map((t) => (
          <MarkerF
            key={t.id}
            position={{ lat: t.latitude, lng: t.longitude }}
            icon={pinIcon(!!t.status_signal)}
            onClick={() => setSelected(t)}
            animation={t.status_signal ? google.maps.Animation.BOUNCE : undefined}
          />
        ))}

        {/* 선택된 여행자 InfoWindow */}
        {selected && (
          <InfoWindowF
            position={{ lat: selected.latitude, lng: selected.longitude }}
            onCloseClick={() => setSelected(null)}
            options={{ pixelOffset: new google.maps.Size(0, -16) }}
          >
            <div className="p-1 min-w-[180px]">
              {/* 닫기 */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center text-sm font-bold text-violet-600">
                    {selected.nickname[0].toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-bold text-gray-900">{selected.nickname}</span>
                      {selected.is_verified && <ShieldCheck className="w-3 h-3 text-green-500" />}
                    </div>
                    <span className="text-xs text-gray-500">
                      {countryToFlag(selected.home_country)} {selected.manner_temperature?.toFixed(1)}℃
                    </span>
                  </div>
                </div>
              </div>

              {/* 시그널 */}
              {selected.status_signal && (
                <div className="text-xs bg-yellow-50 text-yellow-700 font-semibold px-2 py-1 rounded-lg mb-2">
                  {selected.signal_emoji} {selected.status_signal}
                </div>
              )}

              {/* 자기소개 */}
              {selected.bio && (
                <p className="text-xs text-gray-500 mb-2 leading-relaxed line-clamp-2">
                  "{selected.bio}"
                </p>
              )}

              {/* DM 버튼 */}
              <button
                onClick={() => router.push(`/dm/${selected.id}?name=${encodeURIComponent(selected.nickname)}`)}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg
                  bg-violet-600 text-white text-xs font-bold"
              >
                <MessageCircle className="w-3 h-3" />
                대화 시작하기
              </button>
            </div>
          </InfoWindowF>
        )}
      </GoogleMap>

      {/* 여행자 수 오버레이 */}
      <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm rounded-xl px-3 py-1.5 shadow-sm">
        <span className="text-xs font-bold text-gray-700">
          📍 {travelers.length}명 이 도시에 있음
        </span>
      </div>

      {/* 범례 */}
      <div className="absolute bottom-4 left-3 bg-white/90 backdrop-blur-sm rounded-xl px-3 py-2 shadow-sm space-y-1">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-yellow-400 border-2 border-white shadow-sm" />
          <span className="text-[10px] text-gray-600">지금 만날 수 있음</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-violet-500 border-2 border-white shadow-sm" />
          <span className="text-[10px] text-gray-600">라운지 접속 중</span>
        </div>
      </div>
    </div>
  );
}
