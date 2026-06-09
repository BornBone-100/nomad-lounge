import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

// 클라이언트 컴포넌트에서 사용하는 Supabase 싱글톤
// 빌드 타임 크래시 방지를 위해 폴백 값 사용
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://placeholder.supabase.co",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "placeholder-key"
  );
}
