"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export function BottomSheet({ isOpen, onClose, title, children }: BottomSheetProps) {
  // 열릴 때 body 스크롤 잠금
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* 딤 오버레이 */}
      <div
        className="fixed inset-0 bg-black/40 z-50 animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* 시트 본체 */}
      <div
        className={cn(
          "fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-50",
          "bg-white rounded-t-3xl shadow-2xl",
          "animate-in slide-in-from-bottom duration-300"
        )}
        style={{ paddingBottom: "max(24px, env(safe-area-inset-bottom))" }}
      >
        {/* 핸들 바 */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-gray-200" />
        </div>

        {/* 헤더 */}
        {title && (
          <div className="flex items-center justify-between px-5 py-3">
            <h3 className="font-bold text-gray-900 text-base">{title}</h3>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 active:scale-95 transition-all"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        )}

        {children}
      </div>
    </>
  );
}
