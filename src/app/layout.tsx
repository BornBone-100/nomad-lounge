import type { Metadata, Viewport } from "next";
import Script from "next/script";
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
  maximumScale: 1,
  userScalable: false,
  themeColor: "#6366F1",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const mapsKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

  return (
    <html lang="ko">
      <body>
        {/* Google Maps 스크립트 — 앱 전체에서 한 번만 로드 */}
        {mapsKey && (
          <Script
            src={`https://maps.googleapis.com/maps/api/js?key=${mapsKey}&libraries=places,geometry&language=ko`}
            strategy="beforeInteractive"
          />
        )}
        <div className="mobile-container">
          {children}
        </div>
      </body>
    </html>
  );
}
