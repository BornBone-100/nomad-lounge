import { BottomNavBar } from "@/components/layout/BottomNavBar";

export const dynamic = "force-dynamic";

// 인증 체크는 middleware.ts에서 처리
export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1 pb-20">{children}</main>
      <BottomNavBar />
    </div>
  );
}
