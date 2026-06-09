"use client";

import { cn } from "@/lib/utils";

export type SignalType = "dinner" | "coffee" | "tour" | "chat";

export interface Signal {
  type: SignalType;
  emoji: string;
  label: string;
  labelShort: string; // 배지에 표시할 짧은 텍스트
  color: string;      // Tailwind bg 클래스
  textColor: string;  // Tailwind text 클래스
}

export const SIGNALS: Signal[] = [
  {
    type: "dinner",
    emoji: "🍽️",
    label: "저녁 메이트 구함",
    labelShort: "저녁 메이트",
    color: "bg-orange-50",
    textColor: "text-orange-600",
  },
  {
    type: "coffee",
    emoji: "☕",
    label: "커피 한잔 환영",
    labelShort: "커피 환영",
    color: "bg-violet-50",
    textColor: "text-violet-600",
  },
  {
    type: "tour",
    emoji: "🗺️",
    label: "투어 동행 구함",
    labelShort: "투어 동행",
    color: "bg-emerald-50",
    textColor: "text-emerald-600",
  },
  {
    type: "chat",
    emoji: "💬",
    label: "그냥 얘기 환영",
    labelShort: "얘기 환영",
    color: "bg-blue-50",
    textColor: "text-blue-600",
  },
];

interface SignalBadgeProps {
  signal: string;       // 시그널 label
  emoji: string;        // 시그널 emoji
  size?: "sm" | "md";
  className?: string;
}

export function SignalBadge({ signal, emoji, size = "md", className }: SignalBadgeProps) {
  // 시그널 타입에 맞는 컬러 찾기
  const matched = SIGNALS.find((s) => s.label === signal || s.labelShort === signal);
  const color = matched?.color ?? "bg-primary-light";
  const textColor = matched?.textColor ?? "text-primary";

  return (
    <span
      className={cn(
        "signal-badge font-medium",
        color,
        textColor,
        size === "sm" ? "text-[10px] px-2 py-0.5" : "text-xs px-2.5 py-1",
        className
      )}
    >
      {emoji} {signal}
    </span>
  );
}
