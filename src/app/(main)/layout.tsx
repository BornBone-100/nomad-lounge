import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BottomNavBar } from "@/components/layout/BottomNavBar";

export const dynamic = "force-dynamic";

// (main) 그룹: 인증된 유저만 접근 가능한 페이지들
export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // 미인증 접근 시 온보딩으로 리다이렉트
  if (!user) {
    redirect("/onboard");
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* 페이지 콘텐츠 (하단 네비 높이만큼 패딩) */}
      <main className="flex-1 pb-20">
        {children}
      </main>
      <BottomNavBar />
    </div>
  );
}
