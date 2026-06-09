"""
LoungeConnectionManager — WebSocket 세션 중앙 관리자

설계 원칙:
- lounge_id별로 활성 소켓을 딕셔너리로 분리해 불필요한 브로드캐스트 제거
- user_id를 키로 관리해 특정 유저에게 개인 메시지(DM) 전송 지원
- 끊어진 소켓을 안전하게 제거하는 예외 처리 포함
"""

import asyncio
import logging
from collections import defaultdict
from typing import Dict, Set
from fastapi import WebSocket

logger = logging.getLogger(__name__)


class LoungeConnectionManager:
    def __init__(self):
        # { lounge_id: { user_id: WebSocket } }
        self._lounges: Dict[str, Dict[str, WebSocket]] = defaultdict(dict)
        # DM용: { user_id: WebSocket }
        self._users: Dict[str, WebSocket] = {}

    # ── 연결 ──────────────────────────────────────────────────────
    async def connect(
        self,
        websocket: WebSocket,
        lounge_id: str,
        user_id: str,
    ) -> None:
        await websocket.accept()
        self._lounges[lounge_id][user_id] = websocket
        self._users[user_id] = websocket
        logger.info(f"[WS] 연결: user={user_id} lounge={lounge_id} (현재 {self.count(lounge_id)}명)")

    # ── 연결 해제 ──────────────────────────────────────────────────
    def disconnect(self, lounge_id: str, user_id: str) -> None:
        self._lounges[lounge_id].pop(user_id, None)
        self._users.pop(user_id, None)
        # 빈 라운지 정리
        if not self._lounges[lounge_id]:
            del self._lounges[lounge_id]
        logger.info(f"[WS] 연결 해제: user={user_id} lounge={lounge_id}")

    # ── 라운지 전체 브로드캐스트 ────────────────────────────────────
    async def broadcast(self, lounge_id: str, payload: dict) -> None:
        """
        특정 라운지의 모든 유저에게 메시지 전송
        실패한 소켓은 자동으로 제거
        """
        if lounge_id not in self._lounges:
            return

        dead_users: Set[str] = set()
        tasks = []

        for user_id, ws in self._lounges[lounge_id].items():
            tasks.append((user_id, ws.send_json(payload)))

        results = await asyncio.gather(
            *[task for _, task in tasks],
            return_exceptions=True,
        )

        for (user_id, _), result in zip(tasks, results):
            if isinstance(result, Exception):
                logger.warning(f"[WS] 브로드캐스트 실패: user={user_id} ({result})")
                dead_users.add(user_id)

        # 죽은 소켓 제거
        for user_id in dead_users:
            self.disconnect(lounge_id, user_id)

    # ── 개인 메시지 (DM) ────────────────────────────────────────────
    async def send_to_user(self, user_id: str, payload: dict) -> bool:
        """특정 유저에게 직접 메시지 전송. 성공 여부 반환."""
        ws = self._users.get(user_id)
        if not ws:
            return False
        try:
            await ws.send_json(payload)
            return True
        except Exception as e:
            logger.warning(f"[WS] DM 전송 실패: user={user_id} ({e})")
            self._users.pop(user_id, None)
            return False

    # ── 유틸 ────────────────────────────────────────────────────────
    def count(self, lounge_id: str) -> int:
        """라운지 현재 접속자 수"""
        return len(self._lounges.get(lounge_id, {}))

    def active_lounges(self) -> list[str]:
        """현재 활성화된 라운지 ID 목록"""
        return list(self._lounges.keys())

    def is_online(self, user_id: str) -> bool:
        return user_id in self._users


# 앱 전체에서 싱글톤으로 사용
manager = LoungeConnectionManager()
