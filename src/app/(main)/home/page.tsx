"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Globe, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useUserStore } from "@/store/userStore";
import { CitySearchBar } from "@/components/home/CitySearchBar";
import { CityCard } from "@/components/home/CityCard";
import type { City } from "@/types/database";

export default function HomePage() {
  const router = useRouter();
  const supabase = createClient();
  const { profile, setCurrentCity } = useUserStore();

  const [cities, setCities] = useState<City[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // 도시 목록 fetch
  useEffect(() => {
    const fetchCities = async () => {
      const { data, error } = await supabase
        .from("cities")
        .select("*")
        .order("active_count", { ascending: false });

      if (!error && data) setCities(data);
      setIsLoading(false);
    };

    fetchCities();
  }, []);

  // 검색 필터 (한글 이름 + 영문 이름 모두 검색)
  const filteredCities = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return cities;
    return cities.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.name_ko ?? "").includes(q) ||
        c.country.toLowerCase().includes(q)
    );
  }, [cities, search]);

  const handleCitySelect = async (city: City) => {
    setCurrentCity(city);

    // 라운지가 없으면 자동 생성
    const { data: lounge } = await supabase
      .from("lounges")
      .select("id")
      .eq("city_id", city.id)
      .single();

    if (!lounge) {
      await supabase.from("lounges").insert({ city_id: city.id });
    }

    router.push(`/lounge/${city.id}`);
  };

  return (
    <div className="flex flex-col min-h-screen px-4 pt-6">
      {/* 헤더 */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Globe className="w-5 h-5 text-primary" />
          <span className="text-xs font-medium text-primary">NomadLounge</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">
          어디 계세요,{" "}
          <span className="text-primary">{profile?.nickname ?? "여행자"}</span>
          님? 👋
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          도시를 선택하면 지금 그곳의 여행자들과 연결돼요
        </p>
      </div>

      {/* 검색 */}
      <div className="mb-4">
        <CitySearchBar value={search} onChange={setSearch} />
      </div>

      {/* 도시 목록 */}
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
        </div>
      ) : filteredCities.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-2 text-center">
          <span className="text-4xl">🔍</span>
          <p className="text-sm text-gray-500">
            &quot;{search}&quot;에 해당하는 도시가 없어요
          </p>
        </div>
      ) : (
        <div className="space-y-2 pb-6">
          {/* 활성 도시 섹션 */}
          {filteredCities.some((c) => c.active_count > 0) && (
            <>
              <p className="text-xs font-semibold text-gray-400 px-1 pb-1">
                🔥 지금 활성화된 라운지
              </p>
              {filteredCities
                .filter((c) => c.active_count > 0)
                .map((city) => (
                  <CityCard key={city.id} city={city} onClick={handleCitySelect} />
                ))}
              <p className="text-xs font-semibold text-gray-400 px-1 pb-1 pt-3">
                🌍 전체 도시
              </p>
            </>
          )}
          {filteredCities
            .filter((c) => c.active_count === 0)
            .map((city) => (
              <CityCard key={city.id} city={city} onClick={handleCitySelect} />
            ))}
        </div>
      )}
    </div>
  );
}
