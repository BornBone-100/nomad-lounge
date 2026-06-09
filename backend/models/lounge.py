"""
lounges 테이블 모델
- 전 세계 여행 도시별 가상 공간 정의
- user_signals, chat_messages와 1:N 관계
- active_users_count: 실시간 접속자 수 (Supabase Realtime으로 갱신)
"""

from datetime import datetime
from typing import Optional, List, TYPE_CHECKING
from sqlmodel import SQLModel, Field, Relationship

if TYPE_CHECKING:
    from .user_signal import UserSignal
    from .chat_message import ChatMessage


class LoungeBase(SQLModel):
    country_code: str = Field(max_length=10)
    city_name_en: str = Field(max_length=100, unique=True, index=True)
    city_name_ko: str = Field(max_length=100)
    active_users_count: int = Field(default=0, ge=0)


class Lounge(LoungeBase, table=True):
    """
    실제 DB 테이블 매핑 클래스
    - city_name_en을 UNIQUE 키로 사용해 중복 도시 방지
    """
    __tablename__ = "lounges"

    id: Optional[int] = Field(default=None, primary_key=True)

    # Relationships (1:N)
    signals: List["UserSignal"] = Relationship(back_populates="lounge")
    messages: List["ChatMessage"] = Relationship(back_populates="lounge")


# API 요청/응답용 Pydantic 스키마
class LoungeCreate(LoungeBase):
    pass


class LoungeRead(LoungeBase):
    id: int


class LoungeUpdate(SQLModel):
    active_users_count: Optional[int] = None
    city_name_ko: Optional[str] = None
