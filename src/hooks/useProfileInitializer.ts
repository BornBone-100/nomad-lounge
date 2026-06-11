"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUserStore } from "@/store/userStore";

/**
 * 앱 마운트 시 Supabase 세션에서 프로필을 자동 복원합니다.
 * Zustand store는 preferredLang만 persist하므로,
 * 새로고침 시 profile이 null이 되는 문제를 방지합니다.
 */
export function useProfileInitializer() {
  const supabase = createClient();
  const { profile, setProfile } = useUserStore();
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current || profile) return;
    initialized.current = true;

    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (data) setProfile(data);
    };

    init();

    // 세션 변경 시에도 프로필 동기화 (탭 간 이동 등)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_IN" && session?.user) {
          const { data } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", session.user.id)
            .single();
          if (data) setProfile(data);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);
}
