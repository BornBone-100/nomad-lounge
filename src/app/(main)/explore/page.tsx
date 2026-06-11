"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MapPin, Navigation, Filter, Search } from "lucide-react";
import { GoogleMap, MarkerF, InfoWindowF } from "@react-google-maps/api";
import { createClient } from "@/lib/supabase/client";
import { useUserStore } from "@/store/userStore";
import { MapProvider } from "@/components/map/MapProvider";
import { BottomSheet } from "@/components/explore/BottomSheet";
import { UserSignalCard } from "@/components/explore/UserSignalCard";
import { PlaceCard } from "@/components/explore/PlaceCard";
import { SquadCard } from "@/components/explore/SquadCard";
import { cn } from "@/lib/utils";
import type {
  UserSignalWithProfile,
  PlaceWithMeetups,
  SquadWithMembership,
  PlaceCategory,
  City,
} from "@/types/database";
import { PLACE_CATEGORY_META } from "@/types/database";

type BottomTab = "places" | "squads" | "travelers";

const CATEGORY_FILTERS: { key: PlaceCategory | "all"; label: string; emoji: string }[] = [
  { key: "all",        label: "전체",    emoji: "🗺️" },
  { key: "restaurant", label: "맛집",    emoji: "🍜" },
  { key: "cafe",       label: "카페",    emoji: "☕" },
  { key: "bar",        label: "바/펍",   emoji: "🍺" },
  { key: "activity",   label: "액티비티", emoji: "🏄" },
  { key: "attraction", label: "명소",    emoji: "📸" },
];

const MAP_OPTIONS: google.maps.MapOptions = {
  disableDefaultUI: true,
  zoomControl: false,
  gestureHandling: "greedy",
  styles: [
    { featureType: "poi",     elementType: "labels", stylers: [{ visibility: "off" }] },
    { featureType: "transit", elementType: "labels", stylers: [{ visibility: "off" }] },
  ],
};

export default function ExplorePage() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const supabase     = createClient();
  const { profile, currentCity } = useUserStore();

  const cityId = searchParams.get("cityId") ?? currentCity?.id ?? "";

  const [city, setCity]           = useState<City | null>(currentCity);
  const [mapCenter, setCenter]    = useState({ lat: 13.7563, lng: 100.5018 }); // Bangkok default
  const [mapRef, setMapRef]       = useState<google.maps.Map | null>(null);
  const [userPos, setUserPos]     = useState<{ lat: number; lng: number } | null>(null);

  const [signals, setSignals]       = useState<UserSignalWithProfile[]>([]);
  const [places, setPlaces]         = useState<PlaceWithMeetups[]>([]);
  const [squads, setSquads]         = useState<SquadWithMembership[]>([]);
  const [selectedSignal, setSelectedSignal] = useState<UserSignalWithProfile | null>(null);
  const [selectedPlace,  setSelectedPlace]  = useState<PlaceWithMeetups | null>(null);

  const [tab, setTab]                   = useState<BottomTab>("places");
  const [categoryFilter, setCategory]   = useState<PlaceCategory | "all">("all");
  const [searchQuery, setSearch]        = useState("");

  // ── 도시 데이터 로드 ──────────────────────────────────
  useEffect(() => {
    if (!cityId) return;
    supabase.from("cities").select("*").eq("id", cityId).single()
      .then(({ data }) => {
        if (data) {
          setCity(data);
          if (data.latitude && data.longitude) {
            setCenter({ lat: data.latitude, lng: data.longitude });
          }
        }
      });
  }, [cityId]);

  // ── 유저 위치 가져오기 ────────────────────────────────
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserPos(loc);
        setCenter(loc); // 내 위치로 지도 중심 이동
      },
      () => { /* 위치 권한 거부 — 도시 중심 유지 */ }
    );
  }, []);

  // ── 시그널 로드 (만료 안 된 것만) ─────────────────────
  const fetchSignals = useCallback(async () => {
    if (!cityId) return;
    const { data } = await supabase
      .from("user_signals")
      .select(`*, profiles(nickname, avatar_url, home_country, hobbies, manner_temperature, is_verified), places_db(name, name_ko, category)`)
      .eq("city_id", cityId)
      .gt("expires_at", new Date().toISOString())
      .not("latitude", "is", null);
    if (data) setSignals(data as UserSignalWithProfile[]);
  }, [cityId]);

  // ── 맛집/명소 로드 ────────────────────────────────────
  const fetchPlaces = useCallback(async () => {
    if (!cityId) return;
    const query = supabase
      .from("places_db")
      .select(`*, place_meetups(id, title, meet_at, max_members, current_members, status)`)
      .eq("city_id", cityId)
      .order("is_verified", { ascending: false })
      .order("avg_rating", { ascending: false })
      .limit(30);
    const { data } = await query;
    if (data) setPlaces(data as PlaceWithMeetups[]);
  }, [cityId]);

  // ── 스쿼드 로드 ──────────────────────────────────────
  const fetchSquads = useCallback(async () => {
    if (!cityId || !profile) return;
    const { data: squadsData } = await supabase
      .from("squads").select("*").eq("city_id", cityId).order("member_count", { ascending: false });
    if (!squadsData) return;

    const { data: myMemberships } = await supabase
      .from("squad_members").select("squad_id").eq("user_id", profile.id);

    const myIds = new Set((myMemberships ?? []).map((m) => m.squad_id));
    setSquads(squadsData.map((s) => ({ ...s, is_member: myIds.has(s.id) })));
  }, [cityId, profile]);

  useEffect(() => { fetchSignals(); fetchPlaces(); fetchSquads(); }, [fetchSignals, fetchPlaces, fetchSquads]);

  // 30초마다 시그널 갱신
  useEffect(() => {
    const interval = setInterval(fetchSignals, 30_000);
    return () => clearInterval(interval);
  }, [fetchSignals]);

  // ── 필터링된 맛집 리스트 ──────────────────────────────
  const filteredPlaces = places.filter((p) => {
    const matchCat = categoryFilter === "all" || p.category === categoryFilter;
    const q = searchQuery.toLowerCase();
    const matchQ = !q || p.name.toLowerCase().includes(q) || (p.name_ko ?? "").includes(q)
      || p.tags.some((t) => t.includes(q));
    return matchCat && matchQ;
  });

  // ── 지도 포커스 ──────────────────────────────────────
  const focusMap = useCallback((lat: number, lng: number) => {
    mapRef?.panTo({ lat, lng });
    mapRef?.setZoom(17);
  }, [mapRef]);

  // ── 마커: 시그널 이모지 오버레이 ─────────────────────
  const signalIcon = (emoji: string, isSelected: boolean): google.maps.Symbol => ({
    path: google.maps.SymbolPath.CIRCLE,
    scale: isSelected ? 22 : 16,
    fillColor: "#6366F1",
    fillOpacity: 0.15,
    strokeColor: "#6366F1",
    strokeWeight: isSelected ? 3 : 2,
  });

  const placeIcon = (category: PlaceCategory, isSelected: boolean): google.maps.Symbol => ({
    path: google.maps.SymbolPath.CIRCLE,
    scale: isSelected ? 14 : 10,
    fillColor: category === "restaurant" ? "#F97316"
              : category === "cafe"      ? "#F59E0B"
              : category === "bar"       ? "#3B82F6"
              : category === "activity"  ? "#22C55E"
              : "#8B5CF6",
    fillOpacity: 0.9,
    strokeColor: "#FFFFFF",
    strokeWeight: 2,
  });

  return (
    <MapProvider>
      <div className="relative w-full h-screen overflow-hidden">

        {/* ── 구글 맵 (전체화면 배경) ── */}
        <GoogleMap
          mapContainerClassName="w-full h-full"
          center={mapCenter}
          zoom={15}
          options={MAP_OPTIONS}
          onLoad={(m) => setMapRef(m)}
          onClick={() => { setSelectedSignal(null); setSelectedPlace(null); }}
        >
          {/* 내 위치 마커 */}
          {userPos && (
            <MarkerF
              position={userPos}
              icon={{
                path: google.maps.SymbolPath.CIRCLE,
                scale: 10,
                fillColor: "#3B82F6",
                fillOpacity: 1,
                strokeColor: "#FFFFFF",
                strokeWeight: 3,
              }}
              zIndex={100}
            />
          )}

          {/* 시그널 마커 */}
          {signals.map((s) => s.latitude && s.longitude ? (
            <MarkerF
              key={s.id}
              position={{ lat: s.latitude, lng: s.longitude }}
              icon={signalIcon(s.emoji, selectedSignal?.id === s.id)}
              onClick={() => { setSelectedSignal(s); setSelectedPlace(null); }}
              zIndex={50}
            />
          ) : null)}

          {/* 맛집 마커 */}
          {places.map((p) => (
            <MarkerF
              key={p.id}
              position={{ lat: p.latitude, lng: p.longitude }}
              icon={placeIcon(p.category, selectedPlace?.id === p.id)}
              onClick={() => { setSelectedPlace(p); setSelectedSignal(null); focusMap(p.latitude, p.longitude); }}
              zIndex={40}
            />
          ))}
        </GoogleMap>

        {/* ── 상단 오버레이 버튼 ── */}
        <div className="absolute top-4 left-4 right-4 z-20 flex items-center gap-2 pointer-events-auto">
          {/* 뒤로가기 + 도시명 */}
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 bg-white/95 backdrop-blur-sm rounded-2xl px-3 py-2 shadow-md border border-gray-100"
          >
            <MapPin className="w-4 h-4 text-violet-500" />
            <span className="text-sm font-bold text-gray-900">
              {city ? (city.emoji ?? "") + " " + (city.name_ko ?? city.name) : "탐색"}
            </span>
          </button>

          <div className="flex-1" />

          {/* 내 위치로 */}
          {userPos && (
            <button
              onClick={() => { setCenter(userPos); mapRef?.setZoom(16); }}
              className="w-9 h-9 bg-white/95 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-md border border-gray-100 active:scale-95 transition-all"
            >
              <Navigation className="w-4 h-4 text-violet-500" />
            </button>
          )}
        </div>

        {/* ── 선택된 시그널 카드 ── */}
        {selectedSignal && (
          <UserSignalCard
            signal={selectedSignal}
            onClose={() => setSelectedSignal(null)}
          />
        )}

        {/* ── BottomSheet ── */}
        <BottomSheet defaultSnap="half">
          {/* 탭 바 */}
          <div className="flex px-4 gap-1 border-b border-gray-100 shrink-0 pb-1">
            {([
              { key: "places",    label: "🍜 맛집/명소" },
              { key: "squads",    label: "🏄 스쿼드"   },
              { key: "travelers", label: "👥 여행자"    },
            ] as { key: BottomTab; label: string }[]).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={cn(
                  "flex-1 py-2 text-xs font-bold rounded-xl transition-all",
                  tab === key
                    ? "bg-violet-500 text-white shadow-sm"
                    : "text-gray-400 hover:text-gray-600"
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {/* ── 맛집/명소 탭 ── */}
          {tab === "places" && (
            <div className="flex-1 overflow-y-auto">
              {/* 카테고리 필터 */}
              <div className="flex gap-2 px-4 py-2 overflow-x-auto scrollbar-hide shrink-0">
                {CATEGORY_FILTERS.map(({ key, label, emoji }) => (
                  <button
                    key={key}
                    onClick={() => setCategory(key)}
                    className={cn(
                      "shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition-all",
                      categoryFilter === key
                        ? "bg-violet-500 text-white shadow-sm"
                        : "bg-gray-100 text-gray-600"
                    )}
                  >
                    <span>{emoji}</span>
                    <span>{label}</span>
                  </button>
                ))}
              </div>

              {/* 검색 */}
              <div className="relative px-4 mb-3">
                <Search className="absolute left-7 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="맛집 검색..."
                  className="w-full pl-8 pr-4 py-2 rounded-xl bg-gray-50 text-xs border border-gray-200
                    outline-none focus:border-violet-400 focus:bg-white transition-all"
                />
              </div>

              {/* 맛집 카드 리스트 */}
              <div className="px-4 pb-24 space-y-3">
                {filteredPlaces.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-3xl mb-2">🍽️</p>
                    <p className="text-sm text-gray-500">아직 등록된 맛집이 없어요</p>
                    <p className="text-xs text-gray-400 mt-1">첫 번째 로컬 맛집을 추가해보세요!</p>
                  </div>
                ) : (
                  filteredPlaces.map((place) => (
                    <PlaceCard
                      key={place.id}
                      place={place}
                      onMapFocus={focusMap}
                    />
                  ))
                )}
              </div>
            </div>
          )}

          {/* ── 스쿼드 탭 ── */}
          {tab === "squads" && (
            <div className="flex-1 overflow-y-auto px-4 py-3 pb-24 space-y-3">
              {squads.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-3xl mb-2">🏄</p>
                  <p className="text-sm text-gray-500">아직 스쿼드가 없어요</p>
                  <p className="text-xs text-gray-400 mt-1">취미 스쿼드를 만들어보세요!</p>
                </div>
              ) : (
                squads.map((squad) => (
                  <SquadCard
                    key={squad.id}
                    squad={squad}
                    onJoined={fetchSquads}
                  />
                ))
              )}
            </div>
          )}

          {/* ── 여행자 탭 ── */}
          {tab === "travelers" && (
            <div className="flex-1 overflow-y-auto px-4 py-3 pb-24 space-y-2">
              {signals.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-3xl mb-2">👥</p>
                  <p className="text-sm text-gray-500">주변에 활성 시그널이 없어요</p>
                  <p className="text-xs text-gray-400 mt-1">시그널을 켜서 여행자들과 만나보세요!</p>
                </div>
              ) : (
                signals.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      setSelectedSignal(s);
                      if (s.latitude && s.longitude) focusMap(s.latitude, s.longitude);
                    }}
                    className="w-full flex items-center gap-3 p-3 bg-white rounded-2xl border border-gray-100 shadow-sm hover:border-violet-200 active:scale-[0.98] transition-all text-left"
                  >
                    <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center font-bold text-violet-600 shrink-0">
                      {s.profiles.nickname[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900">{s.profiles.nickname}</p>
                      <p className="text-xs text-gray-500 truncate">{s.emoji} {s.content}</p>
                    </div>
                    <div className="text-xs text-violet-500 font-bold shrink-0">DM →</div>
                  </button>
                ))
              )}
            </div>
          )}
        </BottomSheet>
      </div>
    </MapProvider>
  );
}
