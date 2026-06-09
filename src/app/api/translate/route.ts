import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const { messageId, text, sourceLang, targetLang } = await req.json();

  if (!text || !targetLang) {
    return NextResponse.json({ error: "Missing params" }, { status: 400 });
  }

  const supabase = await createClient();

  // 1. 캐시 확인 — 이미 번역된 경우 DB에서 반환
  if (messageId) {
    const { data: cached } = await supabase
      .from("message_translations")
      .select("content")
      .eq("message_id", messageId)
      .eq("target_lang", targetLang)
      .single();

    if (cached) {
      return NextResponse.json({ translated: cached.content, cached: true });
    }
  }

  // 2. DeepL API 호출
  const apiKey = process.env.DEEPL_API_KEY;
  if (!apiKey) {
    // DeepL 키 없을 때 임시 처리 (개발용)
    return NextResponse.json({ translated: `[번역 미설정] ${text}` });
  }

  const deeplRes = await fetch("https://api-free.deepl.com/v2/translate", {
    method: "POST",
    headers: {
      Authorization: `DeepL-Auth-Key ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text: [text],
      source_lang: sourceLang?.toUpperCase(),
      target_lang: targetLang.toUpperCase() === "KO" ? "KO" : targetLang.toUpperCase(),
    }),
  });

  if (!deeplRes.ok) {
    return NextResponse.json({ error: "Translation failed" }, { status: 500 });
  }

  const deeplData = await deeplRes.json();
  const translated: string = deeplData.translations[0].text;

  // 3. 번역 결과 캐시 저장
  if (messageId) {
    await supabase.from("message_translations").insert({
      message_id: messageId,
      target_lang: targetLang,
      content: translated,
    });
  }

  return NextResponse.json({ translated });
}
