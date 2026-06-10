"use client";

import { useState, useEffect } from "react";
import { GoogleMap, MarkerF, InfoWindowF } from "@react-google-maps/api";
import { Users, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface CityPin {
  id: string;
  name: string;
  name_ko: string | null;
  emoji: string | null;
  latitude: number;
  longitude: number;
  active_count: number;
}

const MAP_OPTIONS: google.maps.MapOptions = {
  disableDefaultUI: true,
  zoomControl: true,
  gestureHandling: "greedy",
  styles: [
    { featureType: "poi", stylers: [{ visibility: "off" }] },
    { featureType: "administrative", elementType: "labels", stylers: [{ visibility: "simplified" }] },
    { featureType: "water", stylers: [{ color: "#e8f4fd" }] },
    { featureType: "landscape", stylers: [{ color: "#f5f5f5" }] },
    { featureType: "road", stylers: [{ color: "#ffffff" }] },
  ],
};

export function CitySelectMap() {
  const router = useRouter();
  const supabase = createClient();
  const [cities, setCities] = useState<CityPin[]>([]);
  const [selected, setSelected] = useState<CityPin | null>(null);

  useEffect(() => {
    supabase
      .from("cities")
      .select("id, name, name_ko, emoji, latitude, longitude, active_count")
      .not("latitude", "is", null)
      .order("active_count", { ascending: false })
      .then(({ data }) => { if (data) setCities(data as CityPin[]); });
  }, []);

  // 접속자 수에 따른 마커 크기
  const markerIcon = (city: CityPin): google.maps.Symbol => {
    const scale = city.active_count >= 10 ? 14 :
                  city.active_count >= 5  ? 11 : 8;
    return {
      path: google.maps.SymbolPath.CIRCLE,
      scale,
      fillColor: city.active_count >= 5 ? "#6366F1" : "#A5B4FC",
      fillOpacity: 0.9,
      strokeColor: "#FFFFFF",
      strokeWeight: 2,
    };
  };

  return (
    <div className="w-full h-[320px] rounded-3xl overflow-hidden relative">
      <GoogleMap
        mapContainerClassName="w-full h-full"
        center={{ lat: 20, lng: 15 }}
        zoom={2}
        options={MAP_OPTIONS}
        onClick={() => setSelected(null)}
      >
        {cities.map((city) => (
          <MarkerF
            key={city.id}
            position={{ lat: city.latitude, lng: city.longitude }}
            icon={markerIcon(city)}
            onClick={() => setSelected(city)}
          />
        ))}

        {selected && (
          <InfoWindowF
            position={{ lat: selected.latitude, lng: selected.longitude }}
            onCloseClick={() => setSelected(null)}
            options={{ pixelOffset: new google.maps.Size(0, -14) }}
          >
            <div className="p-1 min-w-[160px]">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">{selected.emoji}</span>
                <div>
                  <p className="text-sm font-bold text-gray-900">
                    {selected.name_ko ?? selected.name}
                  </p>
                  <div className="flex items-center gap-1 text-xs text-green-600 font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
                    <Users className="w-3 h-3" />
                    <span>{selected.active_count}명 접속 중</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => router.push(`/lounge/${selected.id}`)}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg
                  bg-violet-600 text-white text-xs font-bold"
              >
                라운지 입장
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </InfoWindowF>
        )}
      </GoogleMap>

      {/* 도움말 */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-sm
        rounded-full px-3 py-1 text-[11px] text-gray-500 font-medium shadow-sm whitespace-nowrap">
        도시 핀을 클릭해서 라운지에 입장하세요
      </div>
    </div>
  );
}
