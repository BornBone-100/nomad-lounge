"use client";

import { LoadScript } from "@react-google-maps/api";

const LIBRARIES: ("places" | "geometry")[] = ["places", "geometry"];

export function MapProvider({ children }: { children: React.ReactNode }) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
  if (!apiKey) return <>{children}</>;

  return (
    <LoadScript googleMapsApiKey={apiKey} libraries={LIBRARIES} language="ko">
      {children}
    </LoadScript>
  );
}
