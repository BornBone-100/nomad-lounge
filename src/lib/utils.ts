import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// Tailwind 클래스 병합 유틸 (shadcn/ui 패턴)
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// 언어 코드 → 표시 이름
export function langToLabel(lang: string): string {
  const labels: Record<string, string> = {
    ko: "한국어",
    en: "English",
    ja: "日本語",
    zh: "中文",
    es: "Español",
    fr: "Français",
    de: "Deutsch",
    pt: "Português",
  };
  return labels[lang] ?? lang.toUpperCase();
}

// 시그널 만료 여부 체크
export function isSignalActive(expiresAt: string | null): boolean {
  if (!expiresAt) return false;
  return new Date(expiresAt) > new Date();
}

// 상대 시간 포맷 (예: "방금 전", "3분 전")
export function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "방금 전";
  if (mins < 60) return `${mins}분 전`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}시간 전`;
  return `${Math.floor(hours / 24)}일 전`;
}
