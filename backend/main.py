"""
NomadLounge FastAPI 메인 애플리케이션
- 시작 시 DB 테이블 자동 초기화
- CORS 설정 (Next.js 프론트엔드 연동)
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from core.database import init_db

# 모든 모델을 import해야 SQLModel이 테이블 생성 시 인식
from models import User, Lounge, UserSignal, ChatMessage  # noqa: F401
from models.report import Report  # noqa: F401

# 라우터
from routers.websocket import router as ws_router
from routers.reports import router as reports_router
from routers.admin import router as admin_router
from routers.explore import router as explore_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """앱 시작 시 DB 초기화, 종료 시 클리업"""
    await init_db()
    yield


app = FastAPI(
    title="NomadLounge API",
    description="전 세계 솔로 여행자 실시간 커뮤니티 플랫폼",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS — Next.js 개발 서버 + Vercel 프로덕션 허용
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://*.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 라우터 등록
app.include_router(ws_router)       # WebSocket: /ws/lounge/{lounge_id}
app.include_router(reports_router)  # REST: /api/reports, /api/praises, /api/users/{id}/trust
app.include_router(admin_router)    # Admin: /api/admin/terminate/{user_id}
app.include_router(explore_router)  # Explore: /api/nearby-signals, /api/signals


@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "NomadLounge API"}
