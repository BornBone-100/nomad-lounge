"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useUserStore } from "@/store/userStore";
import { relativeTime } from "@/lib/utils";

interface Conversation {
  partnerId: string;
  partnerNickname: string;
  partnerCountry: string | null;
  lastMessage: string;
  lastAt: string;
  unread: number;
}

export default function DmListPage() {
  const router = useRouter();
  const supabase = createClient();
  const { profile } = useUserStore();
  const [convs, setConvs] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!profile) return;

    const load = async () => {
      // 내가 보내거나 받은 DM 메시지를 파트너별로 그룹화
      const { data } = await supabase
        .from("messages")
        .select("id, sender_id, receiver_id, content, created_at, profiles!sender_id(nickname, home_country)")
        .or(`sender_id.eq.${profile.id},receiver_id.eq.${profile.id}`)
        .not("receiver_id", "is", null) // DM 메시지만 (lounge_id 없는 것)
        .order("created_at", { ascending: false })
        .limit(200);

      if (!data) { setLoading(false); return; }

      // 파트너별 마지막 메시지 추출
      const map = new Map<string, Conversation>();
      for (const msg of data) {
        const partnerId = msg.sender_id === profile.id ? msg.receiver_id : msg.sender_id;
        if (!partnerId || map.has(partnerId)) continue;
        const p = msg.profiles as any;
        map.set(partnerId, {
          partnerId,
          partnerNickname: p?.nickname ?? "여행자",
          partnerCountry: p?.home_country ?? null,
          lastMessage: msg.content,
          lastAt: msg.created_at,
          unread: 0,
        });
      }

      setConvs(Array.from(map.values()));
      setLoading(false);
    };

    load();
  }, [profile?.id]);

  const filtered = convs.filter((c) =>
    !search || c.partnerNickname.toLowerCase().includes(search.toLowerCase())
  );

  function countryFlag(code: string | null) {
    if (!code) return "🌍";
    return code.toUpperCase().split("").map((c) =>
      String.fromCodePoint(127397 + c.charCodeAt(0))
    ).join("");
  }

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* 헤더 */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 h-14 flex items-center">
        <h2 className="font-bold text-gray-900 text-base flex-1">메시지</h2>
        <span className="text-xs text-gray-400 font-medium">{convs.length}개 대화</span>
      </header>

      {/* 검색 */}
      <div className="px-4 pt-3 pb-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="대화 상대 검색..."
            className="w-full pl-9 pr-4 py-2.5 rounded-2xl bg-gray-50 border border-gray-200 text-sm
              outline-none focus:border-primary focus:bg-white transition-all placeholder:text-gray-300"
          />
        </div>
      </div>

      {/* 대화 목록 */}
      <div className="flex-1">
        {loading ? (
          <div className="space-y-1 px-4 pt-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-2xl animate-pulse">
                <div className="w-12 h-12 rounded-2xl bg-gray-200 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-1/3" />
                  <div className="h-2.5 bg-gray-100 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-gray-400">
            <MessageCircle className="w-12 h-12 mb-3 opacity-20" />
            <p className="text-sm font-semibold">
              {search ? "검색 결과가 없어요" : "아직 대화가 없어요"}
            </p>
            <p className="text-xs mt-1 text-gray-300">
              라운지에서 여행자에게 DM을 보내보세요!
            </p>
            <button
              onClick={() => router.push("/home")}
              className="mt-4 px-4 py-2 rounded-xl bg-primary text-white text-sm font-semibold active:scale-95 transition-all"
            >
              라운지 입장하기
            </button>
          </div>
        ) : (
          <ul className="px-4 pt-1 pb-24 space-y-1">
            {filtered.map((conv) => (
              <li key={conv.partnerId}>
                <button
                  onClick={() => router.push(`/dm/${conv.partnerId}?name=${encodeURIComponent(conv.partnerNickname)}`)}
                  className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-gray-50 active:scale-[0.98] transition-all text-left"
                >
                  {/* 아바타 */}
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-400 to-indigo-500
                    flex items-center justify-center text-lg font-bold text-white shrink-0">
                    {conv.partnerNickname[0].toUpperCase()}
                  </div>

                  {/* 내용 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-gray-900 text-sm">
                        {countryFlag(conv.partnerCountry)} {conv.partnerNickname}
                      </span>
                      <span className="text-[10px] text-gray-400 shrink-0">
                        {relativeTime(conv.lastAt)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 truncate mt-0.5">
                      {conv.lastMessage}
                    </p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
