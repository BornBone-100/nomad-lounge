"""
신고/칭찬 API 라우터

POST /api/reports   — 유저 신고
POST /api/praises   — 매너 칭찬
GET  /api/users/{user_id}/trust — 신뢰 요약 조회
"""

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from typing import Optional

from sqlmodel.ext.asyncio.session import AsyncSession

from backend.core.database import get_session
from backend.models.report import ReportReason
from backend.services.trust import submit_report, submit_praise, get_user_trust_summary

router = APIRouter(prefix="/api", tags=["Trust & Safety"])


# ── Schemas ──────────────────────────────────────────────────────────────────

class ReportRequest(BaseModel):
    reporter_id: str = Field(..., description="신고한 유저 ID")
    target_user_id: str = Field(..., description="신고 대상 유저 ID")
    reason: ReportReason = Field(..., description="신고 사유")
    detail: Optional[str] = Field(None, max_length=500, description="상세 사유 (선택)")
    lounge_id: Optional[str] = Field(None, description="발생한 라운지 ID")
    message_id: Optional[str] = Field(None, description="문제 메시지 ID")


class PraiseRequest(BaseModel):
    from_user_id: str = Field(..., description="칭찬 보내는 유저 ID")
    to_user_id: str = Field(..., description="칭찬 받는 유저 ID")


# ── Endpoints ────────────────────────────────────────────────────────────────

@router.post("/reports", status_code=status.HTTP_201_CREATED)
async def create_report(
    body: ReportRequest,
    db: AsyncSession = Depends(get_session),
):
    """
    비매너 유저 신고.

    - manner_temperature 0.5℃ 즉시 차감
    - 누적 3회 이상 OR 온도 30℃ 이하 → 자동 Shadow Ban
    """
    result = await submit_report(
        db=db,
        reporter_id=body.reporter_id,
        target_user_id=body.target_user_id,
        reason=body.reason,
        detail=body.detail,
        lounge_id=body.lounge_id,
        message_id=body.message_id,
    )
    if "error" in result:
        code = result.get("code", "BAD_REQUEST")
        status_code = {
            "SELF_REPORT": status.HTTP_400_BAD_REQUEST,
            "DUPLICATE_REPORT": status.HTTP_409_CONFLICT,
            "USER_NOT_FOUND": status.HTTP_404_NOT_FOUND,
        }.get(code, status.HTTP_400_BAD_REQUEST)
        raise HTTPException(status_code=status_code, detail=result["error"])
    return result


@router.post("/praises", status_code=status.HTTP_200_OK)
async def create_praise(
    body: PraiseRequest,
    db: AsyncSession = Depends(get_session),
):
    """
    번개 모임 후 매너 칭찬 피드백.
    manner_temperature 0.5℃ 상승 (최대 100℃).
    """
    result = await submit_praise(
        db=db,
        from_user_id=body.from_user_id,
        to_user_id=body.to_user_id,
    )
    if "error" in result:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=result["error"])
    return result


@router.get("/users/{user_id}/trust")
async def get_trust_summary(
    user_id: str,
    db: AsyncSession = Depends(get_session),
):
    """유저 신뢰 요약 (온도, 상태, 신고 횟수, 인증 여부)."""
    result = await get_user_trust_summary(db=db, user_id=user_id)
    if "error" in result:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=result["error"])
    return result
