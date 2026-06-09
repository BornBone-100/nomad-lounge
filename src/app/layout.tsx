import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NomadLounge — 지금 이 도시의 여행자들과",
  description: "앱 설치 없이 도시를 선택하면 즉시 전 세계 여행자들과 연결되는 실시간 라운지",
  openGraph: {
    title: "NomadLounge",
    description: "지금 이 도시의 여행자들과 실시간으로 어울리세요",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,        // 모바일 더블탭 줌 방지
  userScalable: false,
  themeColor: "#6366F1",  // 브라우저 상단 바 컬러 (Android)
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>
        <div className="mobile-container">
          {children}
        </div>
      </body>
    </html>
  );
}
