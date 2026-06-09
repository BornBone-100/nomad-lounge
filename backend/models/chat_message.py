"""
chat_messages 테이블 모델
- 라운지 전체 채팅 (lounge_id 있음) + 1:1 DM (receiver_id 있음) 모두 처리
- translated_json: JSONB 타입으로 다국어 번역 결과 저장
  예: {"en": "Hello", "ko": "안녕", "ja": "こんにちは"}
- source_lang: AI 번역 파이프라인에서 원본 언어 판별에 사용
"""

from datetime import datetime
from typing import Optional, Dict, Any, TYPE_CHECKING
from sqlmodel import SQLModel, Field, Relationship, Column
from sqlalchemy.dialects.postgresql import JSONB
import uuid

if TYPE_CHECKING:
    from .user import User
    from .lounge import Lounge


class ChatMessageBase(SQLModel):
    original_text: str
    source_lang: str = Field(max_length=10)   # 예: "ko", "en", "ja"


class ChatMessage(ChatMessageBase, table=True):
    """
    실제 DB 테이블 매핑 클래스
    - translated_json: PostgreSQL JSONB 타입 (빠른 조회 + 유연한 구조)
    - lounge_id 또는 receiver_id 중 하나는 반드시 있어야 함
      (라운지 채팅 vs DM 구분)
    - BigInt PK: 대용량 메시지 처리를 위해 BigInt 사용
    """
    __tablename__ = "chat_messages"

    id: Optional[int] = Field(default=None, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # JSONB 타입 — SQLModel에서 직접 지원하지 않으므로 sa_column 사용
    # 예: {"en": "Hello", "ko": "안녕", "ja": "こんにちは"}
    translated_json: Optional[Dict[str, Any]] = Field(
        default=None,
        sa_column=Column(JSONB, nullable=True),
    )

    # Foreign Keys
    sender_id: uuid.UUID = Field(foreign_key="users.id")
    receiver_id: Optional[uuid.UUID] = Field(
        default=None,
        foreign_key="users.id",
        nullable=True,
    )
    lounge_id: Optional[int] = Field(
        default=None,
        foreign_key="lounges.id",
        nullable=True,
    )

    # Relationships (N:1)
    sender: Optional["User"] = Relationship(
        back_populates="sent_messages",
        sa_relationship_kwargs={"foreign_keys": "[ChatMessage.sender_id]"},
    )
    receiver: Optional["User"] = Relationship(
        back_populates="received_messages",
        sa_relationship_kwargs={"foreign_keys": "[ChatMessage.receiver_id]"},
    )
    lounge: Optional["Lounge"] = Relationship(back_populates="messages")


# API 요청/응답용 Pydantic 스키마
class ChatMessageCreate(ChatMessageBase):
    sender_id: uuid.UUID
    lounge_id: Optional[int] = None      # 라운지 채팅
    receiver_id: Optional[uuid.UUID] = None  # 1:1 DM


class ChatMessageRead(ChatMessageBase):
    id: int
    sender_id: uuid.UUID
    lounge_id: Optional[int]
    receiver_id: Optional[uuid.UUID]
    translated_json: Optional[Dict[str, Any]]
    created_at: datetime

    class Config:
        from_attributes = True
