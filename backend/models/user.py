"""
users 테이블 모델
- 소셜 로그인 정보 + 매너 지수(manner_temperature) + 인증 여부 관리
- user_signals, chat_messages와 1:N 관계
"""

from datetime import datetime
from enum import Enum
from typing import Optional, List, TYPE_CHECKING
from sqlmodel import SQLModel, Field, Relationship, Column
from sqlalchemy import ARRAY, String
import uuid

if TYPE_CHECKING:
    from .user_signal import UserSignal
    from .chat_message import ChatMessage


class UserStatus(str, Enum):
    ACTIVE = "active"
    SHADOW_BANNED = "shadow_banned"
    SUSPENDED = "suspended"     # 관리자 강제 정지


class UserBase(SQLModel):
    email: str = Field(max_length=255, unique=True, index=True)
    nickname: str = Field(max_length=50)
    profile_img: Optional[str] = Field(default=None)
    nationality: str = Field(max_length=10)
    manner_temperature: float = Field(default=36.5, ge=0, le=100)
    is_verified: bool = Field(default=False)
    status: UserStatus = Field(default=UserStatus.ACTIVE)


class User(UserBase, table=True):
    """
    실제 DB 테이블 매핑 클래스
    - languages: PostgreSQL ARRAY(VARCHAR) 타입 사용
    - Relationship을 통해 연관 데이터 lazy loading 지원
    """
    __tablename__ = "users"

    id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        primary_key=True,
        index=True,
    )
    # PostgreSQL ARRAY 타입 — SQLModel에서 직접 지원하지 않으므로 sa_column 사용
    languages: List[str] = Field(
        default=[],
        sa_column=Column(ARRAY(String), nullable=False, server_default="{}"),
    )
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships (1:N)
    signals: List["UserSignal"] = Relationship(back_populates="user")
    sent_messages: List["ChatMessage"] = Relationship(
        back_populates="sender",
        sa_relationship_kwargs={"foreign_keys": "[ChatMessage.sender_id]"},
    )
    received_messages: List["ChatMessage"] = Relationship(
        back_populates="receiver",
        sa_relationship_kwargs={"foreign_keys": "[ChatMessage.receiver_id]"},
    )


# API 요청/응답용 Pydantic 스키마
class UserCreate(UserBase):
    languages: List[str] = []


class UserRead(UserBase):
    id: uuid.UUID
    languages: List[str]
    created_at: datetime


class UserUpdate(SQLModel):
    nickname: Optional[str] = None
    profile_img: Optional[str] = None
    nationality: Optional[str] = None
    languages: Optional[List[str]] = None
    manner_temperature: Optional[float] = None
    is_verified: Optional[bool] = None
