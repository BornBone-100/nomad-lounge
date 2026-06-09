"""
user_signals 테이블 모델
- 핵심 기능: "나 지금 우붓인데 커피 마실 사람?" 같은 실시간 즉흥 시그널
- expires_at: 기본 24시간 후 자동 만료 (쿼리 필터링으로 처리)
- users, lounges와 N:1 관계 (ON DELETE CASCADE)
"""

from datetime import datetime, timedelta
from typing import Optional, TYPE_CHECKING
from sqlmodel import SQLModel, Field, Relationship
import uuid

if TYPE_CHECKING:
    from .user import User
    from .lounge import Lounge


def default_expires_at() -> datetime:
    """기본 만료 시간: 생성 후 24시간"""
    return datetime.utcnow() + timedelta(hours=24)


class UserSignalBase(SQLModel):
    status_tag: str = Field(max_length=50)           # 예: #커피환영, #밥메이트
    message: Optional[str] = Field(default=None, max_length=200)
    expires_at: datetime = Field(default_factory=default_expires_at)


class UserSignal(UserSignalBase, table=True):
    """
    실제 DB 테이블 매핑 클래스
    - BigInt PK (Serial): 대용량 시그널 데이터를 위해 BigInt 사용
    - Cascade Delete: 유저/라운지 삭제 시 연관 시그널도 자동 삭제
    """
    __tablename__ = "user_signals"

    id: Optional[int] = Field(default=None, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # Foreign Keys
    user_id: uuid.UUID = Field(foreign_key="users.id", ondelete="CASCADE")
    lounge_id: int = Field(foreign_key="lounges.id", ondelete="CASCADE")

    # Relationships (N:1)
    user: Optional["User"] = Relationship(back_populates="signals")
    lounge: Optional["Lounge"] = Relationship(back_populates="signals")


# API 요청/응답용 Pydantic 스키마
class UserSignalCreate(UserSignalBase):
    user_id: uuid.UUID
    lounge_id: int


class UserSignalRead(UserSignalBase):
    id: int
    user_id: uuid.UUID
    lounge_id: int
    created_at: datetime

    # 응답에 유저 닉네임, 국적 포함 (JOIN 결과)
    class Config:
        from_attributes = True


class UserSignalUpdate(SQLModel):
    status_tag: Optional[str] = None
    message: Optional[str] = None
    expires_at: Optional[datetime] = None
