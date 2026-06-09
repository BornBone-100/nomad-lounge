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

  // 미인증 상태에서 /home, /lounge, /profile 접근 시 → /onboard
  if (!user && pathname.startsWith("/(main)") === false) {
    const protectedPaths = ["/home", "/lounge", "/profile"];
    if (protectedPaths.some((p) => pathname.startsWith(p))) {
      return NextResponse.redirect(new URL("/onboard", request.url));
    }
  }

  // 인증 상태에서 /onboard 접근 시 → /home
  if (user && pathname === "/onboard") {
    return NextResponse.redirect(new URL("/home", request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
