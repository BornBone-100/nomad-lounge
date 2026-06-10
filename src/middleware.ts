import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://placeholder.supabase.co";
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "placeholder-key";

  // 환경변수 미설정 시 미들웨어 건너뜀 (빌드 타임 안전장치)
  if (supabaseUrl === "https://placeholder.supabase.co") {
    return supabaseResponse;
  }

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  const { data: { user } } = await supabase.auth.getUser();
  const { pathname } = request.nextUrl;

  // /banned 페이지는 항상 접근 허용
  if (pathname === "/banned") return supabaseResponse;

  // 미인증 상태에서 보호 경로 접근 시 → /onboard
  if (!user) {
    const protectedPaths = ["/home", "/lounge", "/profile", "/dm", "/notifications"];
    if (protectedPaths.some((p) => pathname.startsWith(p))) {
      return NextResponse.redirect(new URL("/onboard", request.url));
    }
    return supabaseResponse;
  }

  // 인증 상태에서 /onboard 접근 시 → /home
  if (pathname === "/onboard") {
    return NextResponse.redirect(new URL("/home", request.url));
  }

  // ── 탈퇴 유저 차단 ─────────────────────────────────────────────
  // 보호 경로 접근 시에만 DB 조회 (모든 요청에서 하면 느려짐)
  const protectedPaths = ["/home", "/lounge", "/profile", "/dm", "/notifications"];
  if (protectedPaths.some((p) => pathname.startsWith(p))) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("status")
      .eq("id", user.id)
      .single();

    if (profile?.status === "terminated") {
      // 세션 삭제 후 차단 화면으로
      await supabase.auth.signOut();
      return NextResponse.redirect(new URL("/banned", request.url));
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
