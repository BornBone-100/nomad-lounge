"""
관리자 전용 API
모든 엔드포인트는 X-Admin-Key 헤더 인증 필요
"""

import os
from fastapi import APIRouter, Depends, HTTPException, Header, status
from pydantic import BaseModel
from sqlmodel.ext.asyncio.session import AsyncSession

from backend.core.database import get_session
from backend.services.termination import terminate_user, check_terminated
from backend.services.trust import get_user_trust_summary

router = APIRouter(prefix="/api/admin", tags=["Admin"])

ADMIN_KEY = os.getenv("ADMIN_SECRET_KEY", "")


def verify_admin(x_admin_key: str = Header(...)):
    if not ADMIN_KEY or x_admin_key != ADMIN_KEY:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="관리자 권한이 없습니다."
        )


class TerminateRequest(BaseModel):
    admin_id: str
    reason: str = "admin"
    detail: str


@router.post("/terminate/{user_id}")
async def force_terminate(
    user_id: str,
    body: TerminateRequest,
    db: AsyncSession = Depends(get_session),
    _: None = Depends(verify_admin),
):
    """수동 강제 탈퇴"""
    success = await terminate_user(
        db=db,
        user_id=user_id,
        reason=body.reason,
        detail=body.detail,
        admin_id=body.admin_id,
    )
    if not success:
        raise HTTPException(status_code=404, detail="유저를 찾을 수 없습니다.")
    return {"success": True, "message": f"{user_id} 강제 탈퇴 완료"}


@router.get("/users/{user_id}/status")
async def get_user_status(
    user_id: str,
    db: AsyncSession = Depends(get_session),
    _: None = Depends(verify_admin),
):
    """유저 신뢰/상태 요약 조회"""
    result = await get_user_trust_summary(db=db, user_id=user_id)
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    return result
