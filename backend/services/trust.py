"""
Trust & Safety 서비스 레이어

비즈니스 로직:
- 신고 접수 → manner_temperature 0.5℃ 차감
- 누적 신고 3회 이상 OR 온도 30℃ 이하 → SHADOW_BANNED 자동 전환
- 칭찬(매너 피드백) → manner_temperature 0.5℃ 상승 (최대 100℃)
- 모든 DB 조작은 비동기 트랜잭션으로 처리
"""

import logging
from datetime import datetime, timezone

from sqlmodel import select, func
from sqlmodel.ext.asyncio.session import AsyncSession

from backend.models.report import Report, ReportReason
from backend.models.user import User, UserStatus

logger = logging.getLogger(__name__)

TEMP_DECREASE_PER_REPORT = 0.5      # 신고 1건당 온도 차감량
TEMP_INCREASE_PER_PRAISE = 0.5      # 칭찬 1건당 온도 상승량
SHADOW_BAN_TEMP_THRESHOLD = 30.0    # 이 온도 이하면 Shadow Ban
SHADOW_BAN_REPORT_THRESHOLD = 3     # 누적 신고 횟수 기준
MAX_TEMP = 100.0
MIN_TEMP = 0.0


async def submit_report(
    *,
    db: AsyncSession,
    reporter_id: str,
    target_user_id: str,
    reason: ReportReason,
    detail: str | None = None,
    lounge_id: str | None = None,
    message_id: str | None = None,
) -> dict:
    """
    신고 접수 + 매너 온도 차감 + Shadow Ban 자동 처리

    반환: {
      "report_id": "...",
      "new_temperature": 35.5,
      "shadow_banned": False,
      "message": "신고가 접수되었습니다."
    }
    """
    # ── 1. 자기 자신 신고 방지 ──────────────────────────────────────
    if reporter_id == target_user_id:
        return {"error": "자신을 신고할 수 없습니다.", "code": "SELF_REPORT"}

    # ── 2. 중복 신고 방지 (같은 사유로 24시간 내 재신고 불가) ──────────
    from datetime import timedelta
    cutoff = datetime.now(timezone.utc) - timedelta(hours=24)
    existing = await db.exec(
        select(Report).where(
            Report.reporter_id == reporter_id,
            Report.target_user_id == target_user_id,
            Report.reason == reason,
            Report.created_at >= cutoff,
        )
    )
    if existing.first():
        return {"error": "24시간 내 동일 사유로 중복 신고할 수 없습니다.", "code": "DUPLICATE_REPORT"}

    async with db.begin():
        # ── 3. 신고 레코드 저장 ──────────────────────────────────────
        report = Report(
            reporter_id=reporter_id,
            target_user_id=target_user_id,
            reason=reason,
            detail=detail,
            lounge_id=lounge_id,
            message_id=message_id,
        )
        db.add(report)

        # ── 4. 대상 유저 조회 ────────────────────────────────────────
        user_result = await db.exec(select(User).where(User.id == target_user_id))
        target_user: User | None = user_result.first()

        if not target_user:
            return {"error": "대상 유저를 찾을 수 없습니다.", "code": "USER_NOT_FOUND"}

        # ── 5. 매너 온도 차감 ────────────────────────────────────────
        new_temp = max(MIN_TEMP, target_user.manner_temperature - TEMP_DECREASE_PER_REPORT)
        target_user.manner_temperature = round(new_temp, 1)

        # ── 6. 누적 신고 횟수 조회 ──────────────────────────────────
        count_result = await db.exec(
            select(func.count(Report.id)).where(Report.target_user_id == target_user_id)
        )
        report_count = count_result.one() + 1  # 방금 추가된 건 포함

        # ── 7. Shadow Ban 자동 전환 ──────────────────────────────────
        shadow_banned = False
        if (
            target_user.status != UserStatus.SHADOW_BANNED
            and (
                report_count >= SHADOW_BAN_REPORT_THRESHOLD
                or new_temp <= SHADOW_BAN_TEMP_THRESHOLD
            )
        ):
            target_user.status = UserStatus.SHADOW_BANNED
            shadow_banned = True
            logger.warning(
                f"[Shadow Ban] 자동 전환: user={target_user_id} "
                f"temp={new_temp} reports={report_count}"
            )

        db.add(target_user)

    await db.commit()
    await db.refresh(target_user)

    return {
        "report_id": report.id,
        "new_temperature": target_user.manner_temperature,
        "shadow_banned": shadow_banned,
        "report_count": report_count,
        "message": "신고가 접수되었습니다." + (" 해당 유저가 Shadow Ban 처리되었습니다." if shadow_banned else ""),
    }


async def submit_praise(
    *,
    db: AsyncSession,
    from_user_id: str,
    to_user_id: str,
) -> dict:
    """
    칭찬 피드백 → 매너 온도 상승

    반환: { "new_temperature": 37.0, "message": "칭찬이 전달되었습니다." }
    """
    if from_user_id == to_user_id:
        return {"error": "자신에게 칭찬할 수 없습니다.", "code": "SELF_PRAISE"}

    async with db.begin():
        user_result = await db.exec(select(User).where(User.id == to_user_id))
        target_user: User | None = user_result.first()

        if not target_user:
            return {"error": "대상 유저를 찾을 수 없습니다.", "code": "USER_NOT_FOUND"}

        new_temp = min(MAX_TEMP, target_user.manner_temperature + TEMP_INCREASE_PER_PRAISE)
        target_user.manner_temperature = round(new_temp, 1)

        # Shadow Ban 상태에서 온도가 회복되면 자동 복원 (선택적 정책)
        if target_user.status == UserStatus.SHADOW_BANNED and new_temp > SHADOW_BAN_TEMP_THRESHOLD:
            target_user.status = UserStatus.ACTIVE
            logger.info(f"[Shadow Ban 해제] user={to_user_id} temp={new_temp}")

        db.add(target_user)

    await db.commit()
    await db.refresh(target_user)

    return {
        "new_temperature": target_user.manner_temperature,
        "message": "칭찬이 전달되었습니다.",
    }


async def get_user_trust_summary(*, db: AsyncSession, user_id: str) -> dict:
    """유저 신뢰 요약: 온도, 신고 횟수, 상태"""
    user_result = await db.exec(select(User).where(User.id == user_id))
    user: User | None = user_result.first()
    if not user:
        return {"error": "유저를 찾을 수 없습니다."}

    count_result = await db.exec(
        select(func.count(Report.id)).where(Report.target_user_id == user_id)
    )
    report_count = count_result.one()

    return {
        "user_id": user_id,
        "manner_temperature": user.manner_temperature,
        "status": user.status,
        "report_count": report_count,
        "is_verified": user.is_verified,
    }
