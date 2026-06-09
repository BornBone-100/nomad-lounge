import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// 루트 경로: 로그인 여부에 따라 분기
export default async function RootPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    // 미인증 → 온보딩으로
    redirect("/onboard");
  }

  // 인증됨 → 홈(도시 선택)으로
  redirect("/home");
}
