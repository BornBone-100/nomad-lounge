"use client";

import { useState } from "react";
import { Loader2, X } from "lucide-react";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { SIGNALS } from "./SignalBadge";
import { createClient } from "@/lib/supabase/client";
import { useUserStore } from "@/store/userStore";
import { cn } from "@/lib/utils";

interface SignalPickerProps {
  isOpen: boolean;
  onClose: () => void;
}

// 시그널 만료 시간 옵션
const EXPIRE_OPTIONS = [
  { label: "1시간", hours: 1 },
  { label: "3시간", hours: 3 },
  { label: "오늘 하루", hours: 24 },
];

export function SignalPicker({ isOpen, onClose }: SignalPickerProps) {
  const supabase = createClient();
  const { profile, updateSignal, clearSignal } = useUserStore();

  const [selectedSignal, setSelectedSignal] = useState<typeof SIGNALS[0] | null>(null);
  const [selectedHours, setSelectedHours] = useState(3);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!selectedSignal || !profile) return;

    setIsSaving(true);
    const expiresAt = new Date(Date.now() + selectedHours * 60 * 60 * 1000).toISOString();

    const { error } = await supabase
      .from("profiles")
      .update({
        status_signal: selectedSignal.label,
        signal_emoji: selectedSignal.emoji,
        signal_expires_at: expiresAt,
      })
      .eq("id", profile.id);

    if (!error) {
      updateSignal(selectedSignal.label, selectedSignal.emoji, expiresAt);
    }

    setIsSaving(false);
    onClose();
  };

  const handleClear = async () => {
    if (!profile) return;
    setIsSaving(true);

    await supabase
      .from("profiles")
      .update({
        status_signal: null,
        signal_emoji: null,
        signal_expires_at: null,
      })
      .eq("id", profile.id);

    clearSignal();
    setIsSaving(false);
    onClose();
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="지금 뭐 하고 싶어요? 🙋">
      <div className="px-5 pb-2">
        {/* 현재 시그널 표시 */}
        {profile?.status_signal && (
          <div className="flex items-center justify-between mb-4 p-3 rounded-2xl bg-gray-50">
            <div className="flex items-center gap-2">
              <span className="text-xl">{profile.signal_emoji}</span>
              <div>
                <p className="text-xs text-gray-500">현재 시그널</p>
                <p className="text-sm font-semibold text-gray-900">{profile.status_signal}</p>
              </div>
            </div>
            <button
              onClick={handleClear}
              disabled={isSaving}
              className="flex items-center gap-1 text-xs text-red-500 font-medium px-2.5 py-1.5 rounded-xl hover:bg-red-50 active:scale-95 transition-all"
            >
              <X className="w-3 h-3" />
              끄기
            </button>
          </div>
        )}

        {/* 시그널 선택 그리드 */}
        <div className="grid grid-cols-2 gap-2 mb-5">
          {SIGNALS.map((signal) => {
            const isSelected = selectedSignal?.type === signal.type;
            return (
              <button
                key={signal.type}
                onClick={() => setSelectedSignal(isSelected ? null : signal)}
                className={cn(
                  "flex items-center gap-3 p-3.5 rounded-2xl border-2 text-left transition-all active:scale-[0.97]",
                  isSelected
                    ? `${signal.color} border-current ${signal.textColor}`
                    : "bg-white border-gray-100 hover:border-gray-200"
                )}
              >
                <span className="text-2xl">{signal.emoji}</span>
                <span className={cn(
                  "text-sm font-semibold leading-tight",
                  isSelected ? signal.textColor : "text-gray-700"
                )}>
                  {signal.labelShort}
                </span>
              </button>
            );
          })}
        </div>

        {/* 만료 시간 선택 */}
        {selectedSignal && (
          <div className="mb-5">
            <p className="text-xs font-semibold text-gray-500 mb-2">얼마나 유지할까요?</p>
            <div className="flex gap-2">
              {EXPIRE_OPTIONS.map((opt) => (
                <button
                  key={opt.hours}
                  onClick={() => setSelectedHours(opt.hours)}
                  className={cn(
                    "flex-1 py-2 rounded-xl text-sm font-semibold transition-all active:scale-95",
                    selectedHours === opt.hours
                      ? "bg-primary text-white shadow-sm shadow-primary/20"
                      : "bg-gray-100 text-gray-600"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 저장 버튼 */}
        <button
          onClick={handleSave}
          disabled={!selectedSignal || isSaving}
          className={cn(
            "w-full py-3.5 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 transition-all",
            selectedSignal && !isSaving
              ? "bg-primary text-white shadow-lg shadow-primary/20 active:scale-[0.98]"
              : "bg-gray-100 text-gray-400 cursor-not-allowed"
          )}
        >
          {isSaving ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> 저장 중...</>
          ) : (
            "시그널 켜기 ✨"
          )}
        </button>
      </div>
    </BottomSheet>
  );
}
