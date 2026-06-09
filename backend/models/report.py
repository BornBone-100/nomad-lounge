"""
신고(Report) 모델

- reporter_id: 신고한 유저
- target_user_id: 신고 대상 유저
- reason: 신고 사유 (enum)
- lounge_id: 발생한 라운지 (nullable — DM 신고도 포함)
- message_id: 신고된 메시지 ID (nullable)
"""

from datetime import datetime, timezone
from enum import Enum
from typing import Optional
import uuid

from sqlmodel import Field, SQLModel


class ReportReason(str, Enum):
    HARASSMENT = "harassment"          # 괴롭힘/욕설
    SEXUAL = "sexual"                  # 성희롱
    SCAM = "scam"                      # 사기/스캠
    SPAM = "spam"                      # 스팸
    IMPERSONATION = "impersonation"    # 사칭
    OTHER = "other"                    # 기타


class Report(SQLModel, table=True):
    __tablename__ = "reports"

    id: str = Field(
        default_factory=lambda: str(uuid.uuid4()),
        primary_key=True,
    )
    reporter_id: str = Field(index=True, nullable=False)
    target_user_id: str = Field(index=True, nullable=False)
    reason: ReportReason = Field(nullable=False)
    detail: Optional[str] = Field(default=None, max_length=500)
    lounge_id: Optional[str] = Field(default=None, nullable=True)
    message_id: Optional[str] = Field(default=None, nullable=True)
    is_reviewed: bool = Field(default=False)
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
