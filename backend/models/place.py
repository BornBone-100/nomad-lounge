"""
places 테이블 모델
- 도시 라운지에 속한 로컬 맛집/명소
- Google Places API 연동용 google_place_id 포함
- local_tip: 로컬 추천 코멘트 (킬러 포인트)
- is_solo_friendly: 혼밥/혼술 가능 여부
"""

from typing import Optional, TYPE_CHECKING
from sqlmodel import SQLModel, Field, Relationship

if TYPE_CHECKING:
    from .lounge import Lounge


class PlaceBase(SQLModel):
    lounge_id: int = Field(foreign_key="lounges.id", ondelete="CASCADE", nullable=False)
    google_place_id: str = Field(max_length=255, unique=True, index=True)
    name: str = Field(max_length=100)
    category: str = Field(max_length=50)  # 'cafe' | 'restaurant' | 'bar' | 'activity'
    latitude: float
    longitude: float
    local_tip: str  # 로컬 추천 코멘트
    is_solo_friendly: bool = Field(default=True)


class Place(PlaceBase, table=True):
    __tablename__ = "places"

    id: Optional[int] = Field(default=None, primary_key=True)

    # Lounge와 N:1 관계
    lounge: Optional["Lounge"] = Relationship(back_populates="places")


# API 요청/응답용 Pydantic 스키마
class PlaceCreate(PlaceBase):
    pass


class PlaceRead(PlaceBase):
    id: int


class PlaceUpdate(SQLModel):
    name: Optional[str] = None
    category: Optional[str] = None
    local_tip: Optional[str] = None
    is_solo_friendly: Optional[bool] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
