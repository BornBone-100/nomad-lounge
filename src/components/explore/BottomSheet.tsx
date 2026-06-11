"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { cn } from "@/lib/utils";

type SnapPoint = "collapsed" | "half" | "full";

const SNAP = {
  collapsed: 0.12, // 화면 12% — 핸들 + 탭만 노출
  half:      0.52, // 화면 52%
  full:      0.90, // 화면 90%
} as const;

interface BottomSheetProps {
  children: React.ReactNode;
  defaultSnap?: SnapPoint;
}

export function BottomSheet({ children, defaultSnap = "half" }: BottomSheetProps) {
  const [snap, setSnap]         = useState<SnapPoint>(defaultSnap);
  const [dragging, setDragging] = useState(false);
  const [height, setHeight]     = useState(0);
  const sheetRef                = useRef<HTMLDivElement>(null);
  const startY                  = useRef(0);
  const startH                  = useRef(0);

  // 창 높이 기반으로 실제 px 높이 계산
  useEffect(() => {
    const update = () => {
      setHeight(window.innerHeight * SNAP[snap]);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [snap]);

  const snapTo = useCallback((point: SnapPoint) => {
    setSnap(point);
    setHeight(window.innerHeight * SNAP[point]);
  }, []);

  // ── 터치 드래그 ────────────────────────────────────────
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    setDragging(true);
    startY.current = e.touches[0].clientY;
    startH.current = height;
  }, [height]);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!dragging) return;
    const delta = startY.current - e.touches[0].clientY;
    const newH  = Math.max(80, Math.min(window.innerHeight * 0.92, startH.current + delta));
    setHeight(newH);
  }, [dragging]);

  const onTouchEnd = useCallback(() => {
    setDragging(false);
    const ratio = height / window.innerHeight;
    // 가장 가까운 스냅 포인트로 스냅
    const diffs: [SnapPoint, number][] = [
      ["collapsed", Math.abs(ratio - SNAP.collapsed)],
      ["half",      Math.abs(ratio - SNAP.half)],
      ["full",      Math.abs(ratio - SNAP.full)],
    ];
    diffs.sort((a, b) => a[1] - b[1]);
    snapTo(diffs[0][0]);
  }, [height, snapTo]);

  // ── 마우스 드래그 (데스크탑 테스트용) ──────────────────
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    setDragging(true);
    startY.current = e.clientY;
    startH.current = height;
  }, [height]);

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e: MouseEvent) => {
      const delta = startY.current - e.clientY;
      const newH  = Math.max(80, Math.min(window.innerHeight * 0.92, startH.current + delta));
      setHeight(newH);
    };
    const onUp = () => {
      setDragging(false);
      const ratio = height / window.innerHeight;
      const diffs: [SnapPoint, number][] = [
        ["collapsed", Math.abs(ratio - SNAP.collapsed)],
        ["half",      Math.abs(ratio - SNAP.half)],
        ["full",      Math.abs(ratio - SNAP.full)],
      ];
      diffs.sort((a, b) => a[1] - b[1]);
      snapTo(diffs[0][0]);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [dragging, height, snapTo]);

  return (
    <div
      ref={sheetRef}
      className={cn(
        "absolute bottom-0 left-0 right-0 z-30",
        "bg-white rounded-t-3xl shadow-2xl",
        "flex flex-col",
        !dragging && "transition-[height] duration-300 ease-out"
      )}
      style={{ height }}
    >
      {/* ── 드래그 핸들 ── */}
      <div
        className="flex-shrink-0 flex flex-col items-center pt-3 pb-1 cursor-grab active:cursor-grabbing select-none"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onMouseDown={onMouseDown}
      >
        <div className="w-10 h-1 bg-gray-200 rounded-full" />
      </div>

      {/* ── 콘텐츠 ── */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {children}
      </div>
    </div>
  );
}
