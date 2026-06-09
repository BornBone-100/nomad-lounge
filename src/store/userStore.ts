import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Profile, City } from "@/types/database";

interface UserState {
  // 현재 로그인한 유저 프로필
  profile: Profile | null;
  // 현재 선택된 도시
  currentCity: City | null;
  // 유저가 설정한 번역 언어 (UI 언어)
  preferredLang: string;

  // Actions
  setProfile: (profile: Profile) => void;
  setCurrentCity: (city: City) => void;
  setPreferredLang: (lang: string) => void;
  updateSignal: (signal: string, emoji: string, expiresAt: string) => void;
  clearSignal: () => void;
  reset: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      profile: null,
      currentCity: null,
      preferredLang: "ko",

      setProfile: (profile) => set({ profile }),

      setCurrentCity: (city) => set({ currentCity: city }),

      setPreferredLang: (lang) => set({ preferredLang: lang }),

      updateSignal: (signal, emoji, expiresAt) =>
        set((state) => ({
          profile: state.profile
            ? { ...state.profile, status_signal: signal, signal_emoji: emoji, signal_expires_at: expiresAt }
            : null,
        })),

      clearSignal: () =>
        set((state) => ({
          profile: state.profile
            ? { ...state.profile, status_signal: null, signal_emoji: null, signal_expires_at: null }
            : null,
        })),

      reset: () => set({ profile: null, currentCity: null }),
    }),
    {
      name: "nomad-lounge-user", // localStorage key
      partialize: (state) => ({
        preferredLang: state.preferredLang,
        // 프로필은 Supabase 세션으로 복원하므로 persist 제외
      }),
    }
  )
);
