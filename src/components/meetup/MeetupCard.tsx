"use client";

import { useState } from "react";
import { MapPin, Clock, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export interface Meetup {
  id: string;
  proposer_id: string;
  receiver_id: string;
  place: string;
  meet_at: string;
  message?: string;
  status: "pending" | "accepted" | "declined" | "cancelled";
}

interface MeetupCardProps {
  meetup: Meetup;
  myUserId: string;
  partnerName: string;
  onStatusChange?: (id: string, status: Meetup["status"]) => void;
}

const STATUS_LABEL: Record<Meetup["status"], { text: string; className: string }> = {
  pending:   { text: "답변 대기 중",  className: "bg-yellow-50 text-yellow-700 border-yellow-200" },
  accepted:  { text: "✅ 약속 확정!", className: "bg-green-50 text-green-700 border-green-200" },
  declined:  { text: "거절됨",        className: "bg-gray-50 text-gray-500 border-gray-200" },
  cancelled: { text: "취소됨",        className: "bg-gray-50 text-gray-400 border-gray-200" },
};

function formatMeetAt(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("ko-KR", {
    month: "short", day: "numeric",
    weekday: "short",
    hour: "2-digit", minute: "2-digit",
  });
}

export function MeetupCard({ meetup, myUserId, partnerName, onStatusChange }: MeetupCardProps) {
  const supabase = createClient();
  const [loading, setLoading] = useState<"accept" | "decline" | null>(null);
  const isReceiver = meetup.receiver_id === myUserId;
  const isProposer = meetup.proposer_id === myUserId;
  const statusMeta = STATUS_LABEL[meetup.status];

  const respond = async (status: "accepted" | "declined" | "cancelled") => {
    setLoading(status === "accepted" ? "accept" : "decline");
    await supabase.from("meetups").update({ status }).eq("id", meetup.id);
    onStatusChange?.(meetup.id, status);
    setLoading(null);
  };

  return (
    <div className={cn(
      "rounded-2xl border p-4 my-2 max-w-[85%]",
      "bg-white shadow-sm",
      isProposer ? "ml-auto border-primary/30" : "mr-auto border-gray-200"
    )}>
      {/* 헤더 */}
      <div className="flex items-center gap-1.5 mb-3">
        <span className="text-base">📅</span>
        <span className="text-xs font-bold text-gray-900">
          {isProposer ? `${partnerName}에게 약속 제안` : `${partnerName}의 약속 제안`}
        </span>
      </div>

      {/* 약속 정보 */}
      <div className="space-y-1.5 mb-3">
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
          <span className="font-medium">{meetup.place}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <Clock className="w-3.5 h-3.5 text-primary shrink-0" />
          <span>{formatMeetAt(meetup.meet_at)}</span>
        </div>
        {meetup.message && (
          <p className="text-xs text-gray-500 pl-5 leading-relaxed">"{meetup.message}"</p>
        )}
      </div>

      {/* 상태 뱃지 or 액션 버튼 */}
      {meetup.status !== "pending" ? (
        <span className={cn("text-xs font-semibold px-2.5 py-1 rounded-full border", statusMeta.className)}>
          {statusMeta.text}
        </span>
      ) : isReceiver ? (
        /* 수신자: 수락/거절 버튼 */
        <div className="flex gap-2">
          <button
            onClick={() => respond("accepted")}
            disabled={!!loading}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl
              bg-primary text-white text-xs font-bold active:opacity-80 disabled:opacity-50 transition-all"
          >
            {loading === "accept"
              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
              : <CheckCircle className="w-3.5 h-3.5" />
            }
            수락하기
          </button>
          <button
            onClick={() => respond("declined")}
            disabled={!!loading}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl
              bg-gray-100 text-gray-600 text-xs font-bold active:opacity-80 disabled:opacity-50 transition-all"
          >
            {loading === "decline"
              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
              : <XCircle className="w-3.5 h-3.5" />
            }
            거절하기
          </button>
        </div>
      ) : (
        /* 제안자: 취소 버튼 */
        <button
          onClick={() => respond("cancelled")}
          disabled={!!loading}
          className="text-xs text-gray-400 underline underline-offset-2 active:opacity-70"
        >
          {loading ? <Loader2 className="w-3 h-3 animate-spin inline" /> : "제안 취소"}
        </button>
      )}
    </div>
  );
}
