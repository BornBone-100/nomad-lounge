"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Search, Globe, User, X, TrendingUp } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useUserStore } from "@/store/userStore";
import type { City } from "@/types/database";

export default function HomePage() {
  const router = useRouter();
  const supabase = createClient();
  const { profile, setCurrentCity } = useUserStore();

  const [cities, setCities] = useState<City[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("cities")
      .select("*")
      .order("active_count", { ascending: false })
      .then(({ data }) => {
        if (data) setCities(data);
        setIsLoading(false);
      });
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return cities;
    return cities.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.name_ko ?? "").includes(q) ||
        c.country.toLowerCase().includes(q)
    );
  }, [cities, search]);

  const hotCities = cities.filter((c) => c.active_count > 0).slice(0, 6);
  const allCities = filtered;

  const handleSelect = async (city: City) => {
    setCurrentCity(city);
    const { data: lounge } = await supabase
      .from("lounges").select("id").eq("city_id", city.id).single();
    if (!lounge) {
      await supabase.from("lounges").insert({ city_id: city.id });
    }
    router.push(`/lounge/${city.id}`);
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">

      {/* ── TopBar ── */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100 px-5 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center">
            <Globe className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-gray-900 tracking-tight">NomadLounge</span>
        </div>
        <button
          onClick={() => router.push("/profile")}
          className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center active:scale-95 transition-all"
        >
          {profile?.nickname ? (
            <span className="text-sm font-bold text-primary">
              {profile.nickname[0].toUpperCase()}
            </span>
          ) : (
            <User className="w-4 h-4 text-gray-500" />
          )}
        </button>
      </header>

      <div className="flex-1 px-5 pt-6 pb-28">

        {/* ── Hero ── */}
        <div className="mb-6">
          <h1 className="text-[26px] font-extrabold text-gray-900 leading-tight tracking-tight">
            Travel Solo,<br />
            <span className="text-primary">Never Alone.</span>
          </h1>
          <p className="text-sm text-gray-400 mt-1.5">
            지금 있는 도시를 선택하면 여행자들과 즉시 연결돼요
          </p>
        </div>

        {/* ── 검색창 ── */}
        <div className="relative mb-7">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="어디로 여행 중이신가요? (ex. 우붓)"
            className="w-full pl-11 pr-10 py-3.5 rounded-2xl bg-gray-50 border border-gray-200 text-sm
              outline-none focus:border-primary focus:bg-white focus:shadow-sm focus:shadow-primary/10
              transition-all placeholder:text-gray-300"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* ── 검색 중이 아닐 때: 핫 라운지 ── */}
        {!search && (
          <>
            <div className="flex items-center gap-1.5 mb-3">
              <TrendingUp className="w-4 h-4 text-orange-500" />
              <span className="text-sm font-bold text-gray-900">지금 가장 핫한 라운지</span>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-2 gap-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-24 rounded-2xl bg-gray-100 animate-pulse" />
                ))}
              </div>
            ) : hotCities.length > 0 ? (
              <div className="grid grid-cols-2 gap-3 mb-8">
                {hotCities.map((city) => (
                  <HotCityCard key={city.id} city={city} onClick={handleSelect} />
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-400 text-sm mb-8">
                아직 활성 라운지가 없어요 — 첫 번째 여행자가 되어보세요! 🌏
              </div>
            )}

            {/* 전체 도시 */}
            <div className="flex items-center gap-1.5 mb-3">
              <Globe className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-bold text-gray-900">전체 도시</span>
            </div>
            <div className="space-y-2">
              {cities.map((city) => (
                <AllCityRow key={city.id} city={city} onClick={handleSelect} />
              ))}
            </div>
          </>
        )}

        {/* ── 검색 결과 ── */}
        {search && (
          <div className="space-y-2">
            {allCities.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-4xl mb-2">🔍</p>
                <p className="text-sm text-gray-500">
                  &quot;{search}&quot;에 해당하는 도시가 없어요
                </p>
              </div>
            ) : (
              allCities.map((city) => (
                <AllCityRow key={city.id} city={city} onClick={handleSelect} />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── 핫 도시 카드 (2열 그리드) ── */
function HotCityCard({ city, onClick }: { city: City; onClick: (c: City) => void }) {
  return (
    <button
      onClick={() => onClick(city)}
      className="flex flex-col justify-between p-4 rounded-2xl bg-white border border-gray-100
        shadow-sm hover:shadow-md hover:border-primary/20 active:scale-[0.97] transition-all text-left"
    >
      <span className="text-2xl mb-2">{city.emoji ?? "🌍"}</span>
      <div>
        <p className="font-bold text-gray-900 text-sm leading-tight">
          {city.name_ko ?? city.name}
        </p>
        <p className="text-xs text-gray-400">{city.name}</p>
        <div className="flex items-center gap-1 mt-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          <span className="text-xs font-semibold text-green-600">
            {city.active_count}명 접속 중
          </span>
        </div>
      </div>
    </button>
  );
}

/* ── 전체 도시 한 줄 (리스트) ── */
function AllCityRow({ city, onClick }: { city: City; onClick: (c: City) => void }) {
  return (
    <button
      onClick={() => onClick(city)}
      className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-white border border-gray-100
        hover:border-primary/20 hover:shadow-sm active:scale-[0.98] transition-all text-left"
    >
      <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-xl shrink-0">
        {city.emoji ?? "🌍"}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 text-sm">
          {city.name_ko ?? city.name}
          <span className="text-gray-400 font-normal ml-1.5 text-xs">{city.name}</span>
        </p>
        <p className="text-xs text-gray-400">{city.country}</p>
      </div>
      {city.active_count > 0 ? (
        <div className="flex items-center gap-1 shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          <span className="text-xs font-semibold text-green-600">{city.active_count}</span>
        </div>
      ) : (
        <span className="text-xs text-gray-300">조용함</span>
      )}
    </button>
  );
}
