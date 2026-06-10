"use client";

import { useState, useRef, useCallback } from "react";
import { GoogleMap, MarkerF } from "@react-google-maps/api";
import { StandaloneSearchBox } from "@react-google-maps/api";
import { MapPin, Search } from "lucide-react";

interface LatLng { lat: number; lng: number; }

interface MeetupLocationPickerProps {
  initialLat?: number;
  initialLng?: number;
  onSelect: (place: string, lat: number, lng: number) => void;
}

const MAP_OPTIONS: google.maps.MapOptions = {
  disableDefaultUI: true,
  zoomControl: true,
  gestureHandling: "greedy",
  styles: [{ featureType: "poi", stylers: [{ visibility: "off" }] }],
};

export function MeetupLocationPicker({
  initialLat = 13.7563,
  initialLng = 100.5018,
  onSelect,
}: MeetupLocationPickerProps) {
  const [center, setCenter] = useState<LatLng>({ lat: initialLat, lng: initialLng });
  const [marker, setMarker] = useState<LatLng | null>(null);
  const [placeName, setPlaceName] = useState("");
  const searchBoxRef = useRef<google.maps.places.SearchBox | null>(null);

  // 지도 클릭 → 핀 이동
  const handleMapClick = useCallback((e: google.maps.MapMouseEvent) => {
    if (!e.latLng) return;
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
    setMarker({ lat, lng });

    // 역지오코딩으로 장소명 자동 입력
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === "OK" && results?.[0]) {
        const name = results[0].formatted_address;
        setPlaceName(name);
        onSelect(name, lat, lng);
      }
    });
  }, [onSelect]);

  // 검색 결과 선택
  const handlePlacesChanged = useCallback(() => {
    const places = searchBoxRef.current?.getPlaces();
    if (!places || places.length === 0) return;
    const place = places[0];
    const loc = place.geometry?.location;
    if (!loc) return;
    const lat = loc.lat();
    const lng = loc.lng();
    const name = place.name ?? place.formatted_address ?? "";
    setCenter({ lat, lng });
    setMarker({ lat, lng });
    setPlaceName(name);
    onSelect(name, lat, lng);
  }, [onSelect]);

  return (
    <div className="space-y-2">
      {/* 장소 검색 인풋 */}
      <StandaloneSearchBox
        onLoad={(ref) => { searchBoxRef.current = ref; }}
        onPlacesChanged={handlePlacesChanged}
      >
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="장소 검색 (예: 스타벅스 카오산점)"
            className="w-full pl-9 pr-4 py-2.5 rounded-2xl bg-gray-50 border border-gray-200 text-sm
              outline-none focus:border-primary focus:bg-white transition-all placeholder:text-gray-300"
            value={placeName}
            onChange={(e) => setPlaceName(e.target.value)}
          />
        </div>
      </StandaloneSearchBox>

      {/* 지도 */}
      <div className="rounded-2xl overflow-hidden border border-gray-200">
        <GoogleMap
          mapContainerStyle={{ width: "100%", height: "200px" }}
          center={center}
          zoom={15}
          options={MAP_OPTIONS}
          onClick={handleMapClick}
        >
          {marker && (
            <MarkerF
              position={marker}
              icon={{
                path: google.maps.SymbolPath.CIRCLE,
                scale: 10,
                fillColor: "#6366F1",
                fillOpacity: 1,
                strokeColor: "#FFFFFF",
                strokeWeight: 2,
              }}
            />
          )}
        </GoogleMap>
      </div>

      {/* 선택된 장소 표시 */}
      {marker && (
        <div className="flex items-center gap-2 text-xs text-primary font-medium px-1">
          <MapPin className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">{placeName || "지도를 클릭해 장소를 선택하세요"}</span>
        </div>
      )}
      {!marker && (
        <p className="text-xs text-gray-400 text-center">
          지도를 클릭하거나 위에서 검색하세요
        </p>
      )}
    </div>
  );
}
