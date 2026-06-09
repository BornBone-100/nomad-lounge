"""
WebSocket 엔드포인트 — /ws/lounge/{lounge_id}

메시지 흐름:
  클라이언트 → JSON 수신 → Shadow Ban 체크 → AI 번역 → 전체 브로드캐스트
  └ SHADOW_BANNED 유저: 브로드캐스트 생략, 본인에게만 에코 응답 (본인 인지 불가)

클라이언트가 보내는 JSON 구조:
{
  "user_id": "uuid",
  "nickname": "닉",
  "home_country": "KR",
  "source_lang": "ko",
  "content": "안녕하세요"
}
"""

import json
import logging
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from sqlmodel.ext.asyncio.session import AsyncSession

from backend.core.database import get_session
from backend.services.connection_manager import manager
from backend.services.translation import translate_to_all_langs
from backend.models.user import UserStatus

logger = logging.getLogger(__name__)

router = APIRouter()

# 라운지에서 사용하는 주요 언어 목록 (나중에 DB/Config로 이동 가능)
LOUNGE_LANGUAGES = ["ko", "en", "ja", "zh", "es", "fr"]


@router.websocket("/ws/lounge/{lounge_id}")
async def lounge_websocket(
    websocket: WebSocket,
    lounge_id: str,
    db: AsyncSession = Depends(get_session),
):
    """
    라운지 WebSocket 핵심 엔드포인트

    연결 후 최초로 identity 메시지를 기다리고,
    이후부터는 채팅 메시지를 처리한다.
    """
    user_id: str | None = None
    user_nickname: str = "익명"

    try:
        # ── 1. 핸드셰이크: 첫 메시지에서 identity 확인 ──────────────────
        await websocket.accept()
        raw = await websocket.receive_text()
        try:
            identity = json.loads(raw)
            user_id = identity.get("user_id") or str(uuid.uuid4())
            user_nickname = identity.get("nickname", "익명")
            source_lang = identity.get("source_lang", "ko")
            home_country = identity.get("home_country", "")
        except json.JSONDecodeError:
            await websocket.close(code=4000)
            return

        # ── 2. ConnectionManager에 등록 ──────────────────────────────────
        # accept()를 위에서 이미 했으므로 manager.connect는 accept 없이 등록만 하도록
        # (이 패턴에서는 직접 딕셔너리에 넣는 _connect_internal 메서드를 사용하거나,
        #  accept 호출을 manager.connect로 이전시키는 구조 모두 가능)
        manager._lounges[lounge_id][user_id] = websocket
        manager._users[user_id] = websocket
        logger.info(f"[WS] 입장: user={user_nickname}({user_id}) lounge={lounge_id} ({manager.count(lounge_id)}명)")

        # 입장 시스템 메시지 브로드캐스트
        await manager.broadcast(lounge_id, {
            "type": "system",
            "content": f"{user_nickname}님이 라운지에 입장했습니다.",
            "active_count": manager.count(lounge_id),
            "timestamp": datetime.now(timezone.utc).isoformat(),
        })

        # ── 3. 메인 루프 ──────────────────────────────────────────────────
        while True:
            raw = await websocket.receive_text()
            try:
                data = json.loads(raw)
            except json.JSONDecodeError:
                await websocket.send_json({"type": "error", "message": "JSON 파싱 실패"})
                continue

            content: str = data.get("content", "").strip()
            if not content:
                continue

            msg_source_lang: str = data.get("source_lang", source_lang)
            message_id = str(uuid.uuid4())

            # ── 3-1. Shadow Ban 체크 ──────────────────────────────────────
            is_shadow_banned = await _is_shadow_banned(user_id, db)
            if is_shadow_banned:
                # 본인에게만 에코 (정상처럼 보임)
                await websocket.send_json({
                    "type": "message",
                    "id": message_id,
                    "user_id": user_id,
                    "nickname": user_nickname,
                    "home_country": home_country,
                    "source_lang": msg_source_lang,
                    "content": content,
                    "translated": {msg_source_lang: content},
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                })
                logger.info(f"[Shadow Ban] 필터링: user={user_id}")
                continue

            # ── 3-2. OpenAI Moderation 체크 ──────────────────────────────
            flagged, flag_reason = await _moderate_content(content)
            if flagged:
                await websocket.send_json({
                    "type": "error",
                    "message": f"메시지가 커뮤니티 가이드라인에 위반됩니다. ({flag_reason})",
                })
                logger.warning(f"[Moderation] 차단: user={user_id} reason={flag_reason}")
                continue

            # ── 3-3. 다국어 번역 ──────────────────────────────────────────
            translated_map = await translate_to_all_langs(
                text=content,
                source_lang=msg_source_lang,
                target_langs=LOUNGE_LANGUAGES,
                message_id=message_id,
                db=db,
            )

            # ── 3-4. 전체 브로드캐스트 ────────────────────────────────────
            broadcast_payload = {
                "type": "message",
                "id": message_id,
                "user_id": user_id,
                "nickname": user_nickname,
                "home_country": home_country,
                "source_lang": msg_source_lang,
                "content": content,
                "translated": translated_map,
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }
            await manager.broadcast(lounge_id, broadcast_payload)

    except WebSocketDisconnect:
        pass
    except Exception as e:
        logger.error(f"[WS] 예외: user={user_id} error={e}", exc_info=True)
    finally:
        if user_id:
            manager.disconnect(lounge_id, user_id)
            await manager.broadcast(lounge_id, {
                "type": "system",
                "content": f"{user_nickname}님이 라운지를 떠났습니다.",
                "active_count": manager.count(lounge_id),
                "timestamp": datetime.now(timezone.utc).isoformat(),
            })


# ── 헬퍼 함수 ──────────────────────────────────────────────────────────────

async def _is_shadow_banned(user_id: str, db: AsyncSession) -> bool:
    """유저의 Shadow Ban 여부 확인."""
    from sqlmodel import select
    from backend.models.user import User

    try:
        result = await db.exec(select(User.status).where(User.id == user_id))
        status = result.first()
        return status == UserStatus.SHADOW_BANNED
    except Exception as e:
        logger.error(f"[Shadow Ban 조회 실패]: {e}")
        return False


async def _moderate_content(text: str) -> tuple[bool, str]:
    """
    OpenAI Moderation API로 텍스트 필터링.
    반환: (is_flagged, reason)
    """
    import os
    from openai import AsyncOpenAI

    api_key = os.getenv("OPENAI_API_KEY", "")
    if not api_key:
        return False, ""

    try:
        client = AsyncOpenAI(api_key=api_key)
        response = await client.moderations.create(input=text)
        result = response.results[0]
        if result.flagged:
            # 어떤 카테고리인지 추출
            cats = result.categories.model_dump()
            flagged_cats = [k for k, v in cats.items() if v]
            return True, ", ".join(flagged_cats)
        return False, ""
    except Exception as e:
        logger.warning(f"[Moderation API 실패]: {e}")
        return False, ""
