"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Settings, LogOut, Edit3, MapPin, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useUserStore } from "@/store/userStore";
import { SignalBadge } from "@/components/signal/SignalBadge";
import { SignalPicker } from "@/components/signal/SignalPicker";
import { isSignalActive, langToLabel } from "@/lib/utils";

const SUPPORTED_LANGS = ["ko", "en", "ja", "zh", "es", "fr", "de", "pt"];

export default function ProfilePage() {
  const router = useRouter();
  const supabase = createClient();
  const { profile, currentCity, preferredLang, setProfile, setPreferredLang, reset } = useUserStore();

  const [isSignalPickerOpen, setIsSignalPickerOpen] = useState(false);
  const [isEditingNickname, setIsEditingNickname] = useState(false);
  const [nickname, setNickname] = useState(profile?.nickname ?? "");
  const [isSavingNickname, setIsSavingNickname] = useState(false);

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    );
  }

  const hasActiveSignal = isSignalActive(profile.signal_expires_at);

  const handleSaveNickname = async () => {
    const trimmed = nickname.trim();
    if (!trimmed || trimmed === profile.nickname) {
      setIsEditingNickname(false);
      return;
    }

    setIsSavingNickname(true);
    const { data, error } = await supabase
      .from("profiles")
      .update({ nickname: trimmed })
      .eq("id", profile.id)
      .select()
      .single();

    if (!error && data) setProfile(data);
    setIsSavingNickname(false);
    setIsEditingNickname(false);
  };

  const handleLangChange = (lang: string) => {
    setPreferredLang(lang);
    // 번역 언어 변경은 로컬 스토어에만 저장 (서버 불필요)
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    reset();
    router.replace("/onboard");
  };

  return (
    <div className="flex flex-col min-h-screen px-4 pt-6 pb-8">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">프로필</h1>
        <button className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 active:scale-95 transition-all">
          <Settings className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      {/* 프로필 카드 */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 mb-4">
        <div className="flex items-start gap-4">
          {/* 아바타 */}
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center text-2xl font-bold text-primary shrink-0">
            {profile.nickname[0].toUpperCase()}
          </div>

          <div className="flex-1 min-w-0">
            {/* 닉네임 편집 */}
            {isEditingNickname ? (
              <div className="flex items-center gap-2">
                <input
                  autoFocus
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSaveNickname()}
                  maxLength={20}
                  className="flex-1 text-lg font-bold border-b-2 border-primary outline-none bg-transparent"
                />
                <button
                  onClick={handleSaveNickname}
                  disabled={isSavingNickname}
                  className="text-xs text-primary font-semibold"
                >
                  {isSavingNickname ? <Loader2 className="w-3 h-3 animate-spin" /> : "저장"}
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-gray-900 truncate">{profile.nickname}</h2>
                <button
                  onClick={() => setIsEditingNickname(true)}
                  className="text-gray-400 hover:text-primary active:scale-95 transition-all"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* 현재 도시 */}
            {currentCity && (
              <div className="flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3 text-gray-400" />
                <span className="text-xs text-gray-500">
                  {currentCity.emoji} {currentCity.name_ko ?? currentCity.name}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* 시그널 영역 */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 font-medium mb-1">현재 시그널</p>
              {hasActiveSignal && profile.status_signal ? (
                <SignalBadge signal={profile.status_signal} emoji={profile.signal_emoji ?? ""} />
              ) : (
                <span className="text-xs text-gray-400">시그널 없음</span>
              )}
            </div>
            <button
              onClick={() => setIsSignalPickerOpen(true)}
              className="text-xs font-semibold text-primary bg-primary-light px-3 py-1.5 rounded-xl active:scale-95 transition-all"
            >
              {hasActiveSignal ? "변경" : "켜기 ✨"}
            </button>
          </div>
        </div>
      </div>

      {/* 번역 언어 설정 */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 mb-4">
        <h3 className="text-sm font-bold text-gray-900 mb-3">🌐 번역 언어</h3>
        <p className="text-xs text-gray-500 mb-3">
          다른 언어 메시지를 이 언어로 번역해 보여드려요
        </p>
        <div className="grid grid-cols-4 gap-2">
          {SUPPORTED_LANGS.map((lang) => (
            <button
              key={lang}
              onClick={() => handleLangChange(lang)}
              className={`py-2 rounded-xl text-xs font-semibold transition-all active:scale-95 ${
                preferredLang === lang
                  ? "bg-primary text-white shadow-sm shadow-primary/20"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {langToLabel(lang)}
            </button>
          ))}
        </div>
      </div>

      {/* 로그아웃 */}
      <button
        onClick={handleLogout}
        className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl text-sm font-semibold text-red-500 bg-red-50 hover:bg-red-100 active:scale-[0.98] transition-all mt-auto"
      >
        <LogOut className="w-4 h-4" />
        로그아웃
      </button>

      {/* 시그널 선택기 */}
      <SignalPicker
        isOpen={isSignalPickerOpen}
        onClose={() => setIsSignalPickerOpen(false)}
      />
    </div>
  );
}
