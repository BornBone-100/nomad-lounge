"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { MessageBubble } from "./MessageBubble";
import type { MessageWithProfile } from "@/types/database";

interface MessageFeedProps {
  loungeId: string;
}

export function MessageFeed({ loungeId }: MessageFeedProps) {
  const supabase = createClient();
  const [messages, setMessages] = useState<MessageWithProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  // 기존 메시지 fetch
  useEffect(() => {
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from("messages")
        .select(`
          *,
          profiles (
            nickname,
            avatar_url,
            home_country,
            status_signal,
            signal_emoji
          )
        `)
        .eq("lounge_id", loungeId)
        .order("created_at", { ascending: true })
        .limit(100);

      if (!error && data) {
        setMessages(data as MessageWithProfile[]);
      }
      setIsLoading(false);
    };

    fetchMessages();
  }, [loungeId]);

  // Supabase Realtime 구독 — 새 메시지 실시간 수신
  useEffect(() => {
    const channel = supabase
      .channel(`lounge:${loungeId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `lounge_id=eq.${loungeId}`,
        },
        async (payload) => {
          // 새 메시지의 프로필 정보를 join해서 추가
          const { data } = await supabase
            .from("messages")
            .select(`
              *,
              profiles (
                nickname,
                avatar_url,
                home_country,
                status_signal,
                signal_emoji
              )
            `)
            .eq("id", payload.new.id)
            .single();

          if (data) {
            setMessages((prev) => [...prev, data as MessageWithProfile]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loungeId]);

  // 새 메시지 도착 시 자동 스크롤
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="text-3xl">💬</div>
          <p className="text-sm text-gray-400">메시지 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="text-center space-y-2">
          <div className="text-4xl">👋</div>
          <p className="text-sm font-semibold text-gray-700">첫 번째 메시지를 남겨보세요!</p>
          <p className="text-xs text-gray-400">이 도시의 여행자들이 기다리고 있어요</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
      {messages.map((msg) => (
        <MessageBubble key={msg.id} message={msg} />
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
