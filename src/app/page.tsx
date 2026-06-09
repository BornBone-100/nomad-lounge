import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

// 루트 경로: 미들웨어가 인증 처리하므로 온보딩으로 바로 리다이렉트
export default function RootPage() {
  redirect("/onboard");
}
