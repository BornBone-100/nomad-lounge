"""
PostgreSQL 데이터베이스 연결 설정
- SQLModel + AsyncPG (비동기 드라이버) 사용
- 세션 의존성 주입 패턴 (FastAPI Depends)
"""

import os
from typing import AsyncGenerator
from sqlmodel import SQLModel
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

# .env에서 DATABASE_URL 읽기
# 예: postgresql+asyncpg://user:password@localhost:5432/nomadlounge
DATABASE_URL = os.environ.get(
    "DATABASE_URL",
    "postgresql+asyncpg://postgres:postgres@localhost:5432/nomadlounge",
)

# 비동기 엔진 생성
engine = create_async_engine(
    DATABASE_URL,
    echo=False,        # 프로덕션에서는 False (개발 시 True로 SQL 로그 확인)
    pool_size=10,
    max_overflow=20,
)

# 비동기 세션 팩토리
AsyncSessionLocal = sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def init_db() -> None:
    """
    앱 시작 시 테이블 자동 생성
    (프로덕션에서는 Alembic 마이그레이션 권장)
    """
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    """
    FastAPI 라우터에서 Depends(get_session)으로 주입하는 DB 세션
    요청 완료 후 자동으로 세션 close
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
