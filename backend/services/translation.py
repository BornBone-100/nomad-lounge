"""
Translation Pipeline — DeepL 우선, OpenAI 폴백

설계 원칙:
- DB 캐시 우선 조회로 동일 텍스트 반복 번역 비용 제거
- DeepL API → 실패 시 OpenAI gpt-4o-mini 폴백
- 언어 자동 감지는 DeepL에 위임, OpenAI 폴백 시 source_lang 명시
"""

import hashlib
import json
import logging
import os
from typing import Optional

import httpx
from openai import AsyncOpenAI
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlmodel import select

from backend.models.chat_message import MessageTranslation

logger = logging.getLogger(__name__)

DEEPL_API_KEY = os.getenv("DEEPL_API_KEY", "")
DEEPL_API_URL = "https://api-free.deepl.com/v2/translate"  # Free tier; Pro는 api.deepl.com

_openai = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY", ""))

# 지원 언어 코드 → DeepL target_lang 매핑
LANG_MAP: dict[str, str] = {
    "ko": "KO",
    "en": "EN-US",
    "ja": "JA",
    "zh": "ZH",
    "es": "ES",
    "fr": "FR",
    "de": "DE",
    "pt": "PT-BR",
    "ru": "RU",
    "ar": "AR",
    "it": "IT",
    "id": "ID",
    "th": "ID",  # DeepL은 태국어 미지원 → OpenAI 폴백 유도
}


def _cache_key(text: str, source_lang: str, target_lang: str) -> str:
    raw = f"{source_lang}:{target_lang}:{text}"
    return hashlib.sha256(raw.encode()).hexdigest()


async def _translate_deepl(text: str, target_lang: str, source_lang: Optional[str] = None) -> Optional[str]:
    """DeepL API 호출. 실패 시 None 반환."""
    if not DEEPL_API_KEY:
        return None
    mapped_target = LANG_MAP.get(target_lang, target_lang.upper())
    payload: dict = {"text": [text], "target_lang": mapped_target}
    if source_lang:
        payload["source_lang"] = LANG_MAP.get(source_lang, source_lang.upper()).split("-")[0]
    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            res = await client.post(
                DEEPL_API_URL,
                headers={"Authorization": f"DeepL-Auth-Key {DEEPL_API_KEY}"},
                json=payload,
            )
            res.raise_for_status()
            return res.json()["translations"][0]["text"]
    except Exception as e:
        logger.warning(f"[DeepL] 번역 실패: {e}")
        return None


async def _translate_openai(text: str, target_lang: str, source_lang: Optional[str] = None) -> Optional[str]:
    """OpenAI gpt-4o-mini 번역 폴백."""
    source_hint = f"from {source_lang}" if source_lang else ""
    system_prompt = (
        f"You are a professional translator. Translate the user's text {source_hint} into {target_lang}. "
        "Return ONLY the translated text, no explanation, no quotes."
    )
    try:
        resp = await _openai.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": text},
            ],
            max_tokens=500,
            temperature=0.2,
        )
        return resp.choices[0].message.content.strip()
    except Exception as e:
        logger.error(f"[OpenAI] 번역 실패: {e}")
        return None


async def translate_message(
    *,
    text: str,
    source_lang: str,
    target_lang: str,
    message_id: Optional[str] = None,
    db: Optional[AsyncSession] = None,
) -> dict[str, str]:
    """
    번역 실행 (캐시 → DeepL → OpenAI).
    반환값: { "translated": "...", "source_lang": "ko", "target_lang": "en", "provider": "deepl" }
    """
    if source_lang == target_lang:
        return {"translated": text, "source_lang": source_lang, "target_lang": target_lang, "provider": "none"}

    cache_key = _cache_key(text, source_lang, target_lang)

    # 1) DB 캐시 확인
    if db and message_id:
        cached = await db.exec(
            select(MessageTranslation)
            .where(
                MessageTranslation.message_id == message_id,
                MessageTranslation.target_lang == target_lang,
            )
        )
        row = cached.first()
        if row:
            logger.debug(f"[번역 캐시] hit: {cache_key[:8]}")
            return {
                "translated": row.translated_text,
                "source_lang": source_lang,
                "target_lang": target_lang,
                "provider": "cache",
            }

    # 2) DeepL 시도
    translated = await _translate_deepl(text, target_lang, source_lang)
    provider = "deepl"

    # 3) OpenAI 폴백
    if not translated:
        translated = await _translate_openai(text, target_lang, source_lang)
        provider = "openai"

    if not translated:
        logger.error(f"[번역 실패] text='{text[:30]}...' source={source_lang} target={target_lang}")
        return {"translated": text, "source_lang": source_lang, "target_lang": target_lang, "provider": "error"}

    # 4) DB 캐시 저장
    if db and message_id:
        try:
            db.add(MessageTranslation(
                message_id=message_id,
                target_lang=target_lang,
                translated_text=translated,
                provider=provider,
            ))
            await db.commit()
        except Exception as e:
            await db.rollback()
            logger.warning(f"[번역 캐시 저장 실패]: {e}")

    return {"translated": translated, "source_lang": source_lang, "target_lang": target_lang, "provider": provider}


async def translate_to_all_langs(
    *,
    text: str,
    source_lang: str,
    target_langs: list[str],
    message_id: Optional[str] = None,
    db: Optional[AsyncSession] = None,
) -> dict[str, str]:
    """
    여러 타겟 언어로 동시에 번역.
    반환값: { "ko": "...", "en": "...", ... }
    """
    import asyncio

    tasks = {
        lang: translate_message(
            text=text,
            source_lang=source_lang,
            target_lang=lang,
            message_id=message_id,
            db=db,
        )
        for lang in target_langs
        if lang != source_lang
    }

    results = await asyncio.gather(*tasks.values(), return_exceptions=True)
    translated_map: dict[str, str] = {source_lang: text}  # 원본 포함

    for lang, result in zip(tasks.keys(), results):
        if isinstance(result, dict):
            translated_map[lang] = result["translated"]
        else:
            translated_map[lang] = text  # 실패 시 원본으로 대체

    return translated_map
