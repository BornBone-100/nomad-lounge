"""
Explore 라우터 — 지도 기반 근처 시그널 / 맛집 / 스쿼드 API
"""
from __future__ import annotations

import math
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Query, HTTPException
from pydantic import BaseModel
from supabase import create_client
import os

router = APIRouter(prefix="/api", tags=["explore"])

# Supabase 클라이언트 (서비스 롤 키 사용 — RLS 우회 가능)
supabase = create_client(
    os.getenv("SUPABASE_URL", ""),
    os.getenv("SUPABASE_SERVICE_ROLE_KEY", os.getenv("SUPABASE_ANON_KEY", "")),
)


# ── Haversine 거리 계산 (km) ──────────────────────────────
def haversine(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    R = 6371.0  # 지구 반경 (km)
    φ1, φ2 = math.radians(lat1), math.radians(lat2)
    Δφ = math.radians(lat2 - lat1)
    Δλ = math.radians(lng2 - lng1)
    a = math.sin(Δφ / 2) ** 2 + math.cos(φ1) * math.cos(φ2) * math.sin(Δλ / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


# ── Response 모델 ─────────────────────────────────────────
class NearbySignal(BaseModel):
    id: str
    user_id: str
    nickname: str
    avatar_url: Optional[str]
    home_country: Optional[str]
    manner_temperature: float
    is_verified: bool
    content: str
    emoji: str
    latitude: float
    longitude: float
    distance_km: float
    place_name: Optional[str]
    expires_at: str

class NearbyPlace(BaseModel):
    id: str
    name: str
    name_ko: Optional[str]
    category: str
    latitude: float
    longitude: float
    avg_rating: float
    is_verified: bool
    local_review: Optional[str]
    tags: List[str]
    price_range: int
    distance_km: float
    open_meetup_count: int

class NearbyResponse(BaseModel):
    signals: List[NearbySignal]
    places: List[NearbyPlace]
    total_signals: int
    total_places: int


# ── GET /api/nearby-signals ───────────────────────────────
@router.get("/nearby-signals", response_model=NearbyResponse)
async def get_nearby(
    lat:       float = Query(...,  description="사용자 현재 위도"),
    lng:       float = Query(...,  description="사용자 현재 경도"),
    city_id:   str   = Query(...,  description="도시 UUID"),
    radius_km: float = Query(2.0,  description="검색 반경 (km), 기본 2km"),
    limit:     int   = Query(20,   description="최대 결과 수"),
):
    """
    반경 radius_km 이내 활성 시그널 + 맛집을 반환합니다.

    - Haversine 공식으로 클라이언트-사이드 거리 계산
    - 만료된 시그널 자동 필터링
    - 거리순 정렬
    """
    now_iso = datetime.now(timezone.utc).isoformat()

    # ── 1. 활성 시그널 조회 ─────────────────────────────
    signals_resp = (
        supabase.table("user_signals")
        .select(
            "id, user_id, content, emoji, latitude, longitude, expires_at, place_id,"
            "profiles!inner(nickname, avatar_url, home_country, manner_temperature, is_verified),"
            "places_db(name, name_ko)"
        )
        .eq("city_id", city_id)
        .gt("expires_at", now_iso)
        .not_("latitude", "is", "null")
        .execute()
    )

    nearby_signals: List[NearbySignal] = []
    for row in (signals_resp.data or []):
        sig_lat = row.get("latitude")
        sig_lng = row.get("longitude")
        if sig_lat is None or sig_lng is None:
            continue
        dist = haversine(lat, lng, sig_lat, sig_lng)
        if dist > radius_km:
            continue

        p = row.get("profiles") or {}
        nearby_signals.append(NearbySignal(
            id                  = row["id"],
            user_id             = row["user_id"],
            nickname            = p.get("nickname", "?"),
            avatar_url          = p.get("avatar_url"),
            home_country        = p.get("home_country"),
            manner_temperature  = p.get("manner_temperature", 36.5),
            is_verified         = p.get("is_verified", False),
            content             = row["content"],
            emoji               = row.get("emoji", "⚡"),
            latitude            = sig_lat,
            longitude           = sig_lng,
            distance_km         = round(dist, 3),
            place_name          = (row.get("places_db") or {}).get("name_ko") or (row.get("places_db") or {}).get("name"),
            expires_at          = row["expires_at"],
        ))

    # 거리순 정렬 + limit
    nearby_signals.sort(key=lambda x: x.distance_km)
    nearby_signals = nearby_signals[:limit]

    # ── 2. 근처 맛집/명소 조회 ──────────────────────────
    places_resp = (
        supabase.table("places_db")
        .select("id, name, name_ko, category, latitude, longitude, avg_rating, is_verified, local_review, tags, price_range, place_meetups(id, status)")
        .eq("city_id", city_id)
        .execute()
    )

    nearby_places: List[NearbyPlace] = []
    for row in (places_resp.data or []):
        p_lat = row.get("latitude")
        p_lng = row.get("longitude")
        if p_lat is None or p_lng is None:
            continue
        dist = haversine(lat, lng, p_lat, p_lng)
        if dist > radius_km * 3:  # 맛집은 3배 반경 (도시 전체 노출)
            continue

        open_meetups = sum(
            1 for m in (row.get("place_meetups") or []) if m.get("status") == "open"
        )
        nearby_places.append(NearbyPlace(
            id               = row["id"],
            name             = row["name"],
            name_ko          = row.get("name_ko"),
            category         = row["category"],
            latitude         = p_lat,
            longitude        = p_lng,
            avg_rating       = row.get("avg_rating", 0),
            is_verified      = row.get("is_verified", False),
            local_review     = row.get("local_review"),
            tags             = row.get("tags") or [],
            price_range      = row.get("price_range", 2),
            distance_km      = round(dist, 3),
            open_meetup_count = open_meetups,
        ))

    # 로컬인증 → 밥메이트 있음 → 별점 순 정렬
    nearby_places.sort(key=lambda x: (
        -int(x.is_verified),
        -x.open_meetup_count,
        -x.avg_rating,
        x.distance_km,
    ))
    nearby_places = nearby_places[:limit]

    return NearbyResponse(
        signals=nearby_signals,
        places=nearby_places,
        total_signals=len(nearby_signals),
        total_places=len(nearby_places),
    )


# ── POST /api/signals (시그널 생성) ──────────────────────
class CreateSignalRequest(BaseModel):
    user_id:   str
    city_id:   str
    content:   str
    emoji:     str = "⚡"
    latitude:  Optional[float] = None
    longitude: Optional[float] = None
    place_id:  Optional[str]   = None
    hours:     int = 4  # 만료 시간 (1~12시간)

@router.post("/signals", status_code=201)
async def create_signal(req: CreateSignalRequest):
    from datetime import timedelta
    hours = max(1, min(12, req.hours))
    expires_at = (datetime.now(timezone.utc) + timedelta(hours=hours)).isoformat()

    # 기존 활성 시그널 삭제 (1인 1시그널)
    supabase.table("user_signals").delete().eq("user_id", req.user_id).execute()

    result = supabase.table("user_signals").insert({
        "user_id":    req.user_id,
        "city_id":    req.city_id,
        "content":    req.content,
        "emoji":      req.emoji,
        "latitude":   req.latitude,
        "longitude":  req.longitude,
        "place_id":   req.place_id,
        "expires_at": expires_at,
    }).execute()

    if not result.data:
        raise HTTPException(status_code=500, detail="시그널 생성에 실패했습니다")

    return {"id": result.data[0]["id"], "expires_at": expires_at}


# ── DELETE /api/signals/{user_id} (시그널 끄기) ─────────
@router.delete("/signals/{user_id}", status_code=204)
async def delete_signal(user_id: str):
    supabase.table("user_signals").delete().eq("user_id", user_id).execute()
