"use client";

import { useState } from "react";
import { X, MapPin, Clock, Send, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface MeetupProposalModalProps {
  proposerId: string;
  receiverId: string;
  receiverName: string;
  cityId?: string;
  onClose: () => void;
  onSuccess: () => void;
}

// 오늘 기준 datetime-local input의 min 값
function nowLocalString(): string {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

export function MeetupProposalModal({
  proposerId, receiverId, receiverName, cityId, onClose, onSuccess
}: MeetupProposalModalProps) {
  const supabase = createClient();
  const [place, setPlace] = useState("");
  const [meetAt, setMeetAt] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!place.trim()) { setError("장소를 입력해주세요"); return; }
    if (!meetAt)        { setError("날짜/시간을 선택해주세요"); return; }
    setError("");
    setLoading(true);

    const { error: dbErr } = await supabase.from("meetups").insert({
      proposer_id: proposerId,
      receiver_id: receiverId,
      city_id: cityId ?? null,
      place: place.trim(),
      meet_at: new Date(meetAt).toISOString(),
      message: message.trim() || null,
      status: "pending",
    });

    setLoading(false);
    if (dbErr) { setError("제안 전송에 실패했습니다. 다시 시도해주세요."); return; }
    onSuccess();
    onClose();
  };

  return (
    // 오버레이
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* 모달 시트 */}
      <div className="w-full max-w-lg bg-white rounded-t-3xl px-5 pt-5 pb-8 animate-slide-up">

        {/* 헤더 */}
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-gray-900 text-base">
            📅 {receiverName}에게 약속 제안
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 active:scale-95 transition-all"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="space-y-4">
          {/* 장소 */}
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1.5 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-primary" />
              만날 장소
            </label>
            <input
              type="text"
              placeholder="예) 카오산로드 스타벅스, 숙소 로비..."
              value={place}
              onChange={(e) => setPlace(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-sm
                outline-none focus:border-primary focus:bg-white transition-all placeholder:text-gray-300"
            />
          </div>

          {/* 날짜/시간 */}
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1.5 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-primary" />
              날짜 & 시간
            </label>
            <input
              type="datetime-local"
              min={nowLocalString()}
              value={meetAt}
              onChange={(e) => setMeetAt(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-sm
                outline-none focus:border-primary focus:bg-white transition-all text-gray-700"
            />
          </div>

          {/* 메시지 (선택) */}
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1.5 block">
              한마디 (선택)
            </label>
            <textarea
              placeholder="예) 저도 방콕 처음이에요! 같이 팟타이 먹어요 😊"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={2}
              className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-sm resize-none
                outline-none focus:border-primary focus:bg-white transition-all placeholder:text-gray-300 leading-relaxed"
            />
          </div>

          {/* 에러 */}
          {error && <p className="text-xs text-red-500 font-medium">{error}</p>}

          {/* 제출 버튼 */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl
              bg-primary text-white font-bold text-sm
              disabled:opacity-50 active:scale-[0.98] transition-all shadow-lg shadow-primary/20"
          >
            {loading
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <Send className="w-4 h-4" />
            }
            약속 제안 보내기
          </button>
        </div>
      </div>
    </div>
  );
}
