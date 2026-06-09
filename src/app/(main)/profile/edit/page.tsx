"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Save, Loader2, Plus, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useUserStore } from "@/store/userStore";

// ── 여행 스타일 태그 목록 ──────────────────────────────────────────
const STYLE_TAGS = [
  { id: "foodie",    label: "🍜 맛집탐방" },
  { id: "activity",  label: "🏄 액티비티" },
  { id: "nightlife", label: "🌙 야경/나이트" },
  { id: "culture",   label: "🏛️ 로컬문화" },
  { id: "chill",     label: "☕ 카페/휴식" },
  { id: "nature",    label: "🏔️ 자연/트레킹" },
  { id: "budget",    label: "💸 가성비여행" },
  { id: "luxury",    label: "✨ 럭셔리" },
  { id: "photo",     label: "📸 사진/감성" },
  { id: "solo",      label: "🧳 솔로여행" },
];

// 국가 코드 → 국기 이모지
function flag(code: string) {
  return code.toUpperCase().split("").map((c) =>
    String.fromCodePoint(127397 + c.charCodeAt(0))
  ).join("");
}

// 주요 나라 목록 (간략)
const COUNTRIES = [
  { code: "KR", name: "한국" }, { code: "JP", name: "일본" },
  { code: "TH", name: "태국" }, { code: "ID", name: "인도네시아" },
  { code: "VN", name: "베트남" }, { code: "FR", name: "프랑스" },
  { code: "IT", name: "이탈리아" }, { code: "ES", name: "스페인" },
  { code: "US", name: "미국" }, { code: "GB", name: "영국" },
  { code: "AU", name: "호주" }, { code: "IN", name: "인도" },
  { code: "MX", name: "멕시코" }, { code: "PT", name: "포르투갈" },
  { code: "GR", name: "그리스" }, { code: "MA", name: "모로코" },
  { code: "PE", name: "페루" }, { code: "BR", name: "브라질" },
  { code: "NZ", name: "뉴질랜드" }, { code: "TR", name: "튀르키예" },
];

export default function ProfileEditPage() {
  const router = useRouter();
  const supabase = createClient();
  const { profile } = useUserStore();

  const [bio, setBio] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [styleTags, setStyleTags] = useState<string[]>([]);
  const [visitedCountries, setVisitedCountries] = useState<string[]>([]);
  const [countryInput, setCountryInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // 기존 프로필 불러오기
  useEffect(() => {
    if (!profile?.id) return;
    supabase.from("profiles").select("bio,travel_style_tags,visited_countries,check_in_date,check_out_date")
      .eq("id", profile.id).single()
      .then(({ data }) => {
        if (!data) return;
        setBio(data.bio ?? "");
        setStyleTags(data.travel_style_tags ?? []);
        setVisitedCountries(data.visited_countries ?? []);
        setCheckIn(data.check_in_date ? data.check_in_date.slice(0, 10) : "");
        setCheckOut(data.check_out_date ? data.check_out_date.slice(0, 10) : "");
      });
  }, [profile?.id]);

  const toggleTag = (id: string) =>
    setStyleTags((prev) => prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]);

  const addCountry = (code: string) => {
    if (!visitedCountries.includes(code))
      setVisitedCountries((prev) => [...prev, code]);
    setCountryInput("");
  };

  const removeCountry = (code: string) =>
    setVisitedCountries((prev) => prev.filter((c) => c !== code));

  const filteredCountries = COUNTRIES.filter(
    (c) => !visitedCountries.includes(c.code) &&
      (c.name.includes(countryInput) || c.code.toLowerCase().includes(countryInput.toLowerCase()))
  );

  const handleSave = async () => {
    if (!profile?.id) return;
    setSaving(true);
    await supabase.from("profiles").update({
      bio: bio.trim() || null,
      travel_style_tags: styleTags,
      visited_countries: visitedCountries,
      check_in_date: checkIn || null,
      check_out_date: checkOut || null,
    }).eq("id", profile.id);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">

      {/* ── TopBar ── */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="flex items-center gap-2 px-4 h-14">
          <button onClick={() => router.back()}
            className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 active:scale-95 transition-all -ml-1">
            <ChevronLeft className="w-5 h-5 text-gray-700" />
          </button>
          <h2 className="flex-1 font-bold text-gray-900 text-base">프로필 편집</h2>
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-1.5 bg-primary text-white text-xs font-bold px-3.5 py-1.5 rounded-xl active:scale-95 disabled:opacity-50 transition-all">
            {saving
              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
              : <Save className="w-3.5 h-3.5" />}
            {saved ? "저장됨 ✓" : "저장"}
          </button>
        </div>
      </header>

      <div className="px-4 py-5 space-y-7 pb-20">

        {/* ── 한줄 소개 ── */}
        <section>
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 block">
            한줄 소개
          </label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="예) 발리에서 한 달 살기 중인 프리랜서 개발자예요 😊"
            maxLength={100}
            rows={2}
            className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-sm resize-none
              outline-none focus:border-primary focus:bg-white transition-all placeholder:text-gray-300 leading-relaxed"
          />
          <p className="text-[10px] text-gray-400 text-right mt-1">{bio.length}/100</p>
        </section>

        {/* ── 여행 일정 ── */}
        <section>
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 block">
            이 도시 체류 기간
          </label>
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <p className="text-[10px] text-gray-400 mb-1">체크인</p>
              <input type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)}
                className="w-full px-3 py-2.5 rounded-2xl bg-gray-50 border border-gray-200 text-sm
                  outline-none focus:border-primary focus:bg-white transition-all text-gray-700" />
            </div>
            <span className="text-gray-300 mt-4">→</span>
            <div className="flex-1">
              <p className="text-[10px] text-gray-400 mb-1">체크아웃</p>
              <input type="date" value={checkOut} onChange={(e) => setCheckOut(e.target.value)}
                min={checkIn}
                className="w-full px-3 py-2.5 rounded-2xl bg-gray-50 border border-gray-200 text-sm
                  outline-none focus:border-primary focus:bg-white transition-all text-gray-700" />
            </div>
          </div>
        </section>

        {/* ── 여행 스타일 ── */}
        <section>
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 block">
            여행 스타일 <span className="font-normal text-gray-400">(최대 3개)</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {STYLE_TAGS.map((tag) => {
              const selected = styleTags.includes(tag.id);
              const disabled = !selected && styleTags.length >= 3;
              return (
                <button
                  key={tag.id}
                  onClick={() => !disabled && toggleTag(tag.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all active:scale-95 ${
                    selected
                      ? "bg-primary text-white border-primary"
                      : disabled
                        ? "bg-gray-50 text-gray-300 border-gray-200 cursor-not-allowed"
                        : "bg-white text-gray-600 border-gray-200 hover:border-primary hover:text-primary"
                  }`}
                >
                  {tag.label}
                </button>
              );
            })}
          </div>
        </section>

        {/* ── 방문한 나라 ── */}
        <section>
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 block">
            방문한 나라
          </label>

          {/* 선택된 나라 뱃지 */}
          {visitedCountries.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {visitedCountries.map((code) => {
                const c = COUNTRIES.find((c) => c.code === code);
                return (
                  <span key={code}
                    className="flex items-center gap-1 bg-primary/10 text-primary text-xs font-semibold px-2.5 py-1 rounded-full">
                    {flag(code)} {c?.name ?? code}
                    <button onClick={() => removeCountry(code)} className="ml-0.5 opacity-60 hover:opacity-100">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                );
              })}
            </div>
          )}

          {/* 검색 추가 */}
          <div className="relative">
            <input
              type="text"
              placeholder="나라 이름 검색..."
              value={countryInput}
              onChange={(e) => setCountryInput(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl bg-gray-50 border border-gray-200 text-sm
                outline-none focus:border-primary focus:bg-white transition-all placeholder:text-gray-300"
            />
            {countryInput && filteredCountries.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-2xl shadow-lg overflow-hidden z-10 max-h-40 overflow-y-auto">
                {filteredCountries.slice(0, 8).map((c) => (
                  <button key={c.code} onClick={() => addCountry(c.code)}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition-colors text-left">
                    <span className="text-base">{flag(c.code)}</span>
                    <span>{c.name}</span>
                    <Plus className="w-3.5 h-3.5 text-primary ml-auto" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>

      </div>
    </div>
  );
}
