"""
강제 탈퇴 서비스

자동 탈퇴 조건:
  1. 매너온도 20℃ 이하    → Supabase 트리거가 처리
  2. 신고 5회 이상         → Supabase 트리거가 처리
  3. AI 모데레이션 3회 이상 → 이 파이프라인이 처리 (WebSocket 메시지 필터 후 기록)

수동 탈퇴: POST /api/admin/terminate/{user_id}
"""

import logging
from datetime import datetime, timezone

from sqlmodel import select, func
from sqlmodel.ext.asyncio.session import AsyncSession

from backend.models.user import User, UserStatus

logger = logging.getLogger(__name__)

MODERATION_TERMINATION_THRESHOLD = 3   # AI 위반 3회 → 자동 탈퇴


async def record_moderation_violation(
    *,
    db: AsyncSession,
    user_id: str,
    message: str,
    categories: list[str],
    lounge_id: str | None = None,
) -> dict:
    """
    AI 모데레이션 위반 기록 + 임계치 초과 시 자동 탈퇴

    반환: { "violation_count": 2, "terminated": False }
    """
    from backend.models.report import Report  # 순환 임포트 방지

    # 위반 기록 저장 (별도 모델 없이 Report 테이블 활용 or 직접 SQL)
    # 간단하게 SQLModel raw로 처리
    from sqlalchemy import text
    await db.exec(
        text("""
            INSERT INTO moderation_violations(user_id, message, categories, lounge_id)
            VALUES (:uid, :msg, :cats, :lid)
        """),
        {"uid": user_id, "msg": message[:500], "cats": categories, "lid": lounge_id}
    )
    await db.commit()

    # 누적 위반 횟수 조회
    count_result = await db.exec(
        text("SELECT COUNT(*) FROM moderation_violations WHERE user_id = :uid"),
        {"uid": user_id}
    )
    violation_count = count_result.scalar() or 0

    if violation_count < MODERATION_TERMINATION_THRESHOLD:
        return {"violation_count": violation_count, "terminated": False}

    # 임계치 초과 → 강제 탈퇴
    terminated = await terminate_user(
        db=db,
        user_id=user_id,
        reason="moderation",
        detail=f"AI 모데레이션 {violation_count}회 위반 ({', '.join(categories)})",
    )
    return {"violation_count": violation_count, "terminated": terminated}


async def terminate_user(
    *,
    db: AsyncSession,
    user_id: str,
    reason: str,
    detail: str,
    admin_id: str | None = None,
) -> bool:
    """
    유저 강제 탈퇴 처리

    1. status → TERMINATED
    2. terminated_users 기록 저장
    3. 시그널 즉시 제거
    4. 열린 WebSocket 세션 강제 종료 (ConnectionManager)
    """
    user_result = await db.exec(select(User).where(User.id == user_id))
    user: User | None = user_result.first()

    if not user:
        logger.error(f"[탈퇴] 유저 없음: {user_id}")
        return False

    if user.status == UserStatus.TERMINATED:
        logger.info(f"[탈퇴] 이미 탈퇴 처리됨: {user_id}")
        return True

    async with db.begin():
        # 1) 상태 변경
        user.status = UserStatus.TERMINATED
        db.add(user)

        # 2) 탈퇴 기록
        from sqlalchemy import text
        await db.exec(
            text("""
                INSERT INTO terminated_users(user_id, email, nickname, reason, detail,
                  manner_temp_at_termination)
                VALUES (:uid, :email, :nick, :reason, :detail, :temp)
            """),
            {
                "uid": str(user_id),
                "email": getattr(user, "email", None),
                "nick": user.nickname,
                "reason": reason,
                "detail": detail,
                "temp": user.manner_temperature,
            }
        )

        # 3) 시그널 즉시 만료
        await db.exec(
            text("UPDATE user_signals SET expires_at = NOW() WHERE user_id = :uid AND expires_at > NOW()"),
            {"uid": user_id}
        )

    await db.commit()

    # 4) 열린 WebSocket 세션 강제 종료
    try:
        from backend.services.connection_manager import manager
        ws = manager._users.get(str(user_id))
        if ws:
            await ws.close(code=4403, reason="계정이 영구 정지되었습니다.")
            manager._users.pop(str(user_id), None)
    except Exception as e:
        logger.warning(f"[탈퇴] WebSocket 강제 종료 실패: {e}")

    logger.warning(f"[강제 탈퇴] user={user_id} reason={reason} by={admin_id or 'system'}")
    return True


async def check_terminated(*, db: AsyncSession, user_id: str) -> bool:
    """접속 시 탈퇴 여부 확인"""
    result = await db.exec(
        select(User.status).where(User.id == user_id)
    )
    status = result.first()
    return status == UserStatus.TERMINATED
