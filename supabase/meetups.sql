-- ════════════════════════════════════════════════════════
--  [1] profiles 테이블 — 컬럼 추가
-- ════════════════════════════════════════════════════════
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS bio               TEXT,
  ADD COLUMN IF NOT EXISTS travel_style_tags TEXT[]  DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS visited_countries TEXT[]  DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS check_in_date     DATE,
  ADD COLUMN IF NOT EXISTS check_out_date    DATE;


-- ════════════════════════════════════════════════════════
--  [2] meetups 테이블 — 약속 잡기 기능
-- ════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS meetups (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposer_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  city_id         TEXT,                         -- 어느 도시에서 만날지
  place           TEXT NOT NULL,                -- 장소명 (e.g. "스타벅스 카오산점")
  meet_at         TIMESTAMPTZ NOT NULL,         -- 약속 날짜/시간
  message         TEXT,                         -- 제안 메시지 (선택)
  status          TEXT NOT NULL DEFAULT 'pending'  -- pending | accepted | declined | cancelled
                  CHECK (status IN ('pending','accepted','declined','cancelled')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS meetups_proposer_idx  ON meetups(proposer_id);
CREATE INDEX IF NOT EXISTS meetups_receiver_idx  ON meetups(receiver_id);
CREATE INDEX IF NOT EXISTS meetups_meet_at_idx   ON meetups(meet_at);

-- updated_at 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_meetup_timestamp()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_meetup_updated_at ON meetups;
CREATE TRIGGER set_meetup_updated_at
  BEFORE UPDATE ON meetups
  FOR EACH ROW EXECUTE FUNCTION update_meetup_timestamp();


-- ════════════════════════════════════════════════════════
--  [3] RLS 설정
-- ════════════════════════════════════════════════════════
ALTER TABLE meetups ENABLE ROW LEVEL SECURITY;

-- 제안자 또는 수신자만 조회 가능
CREATE POLICY "meetups_select" ON meetups
  FOR SELECT USING (
    auth.uid() = proposer_id OR auth.uid() = receiver_id
  );

-- 제안은 본인만 생성
CREATE POLICY "meetups_insert" ON meetups
  FOR INSERT WITH CHECK (auth.uid() = proposer_id);

-- 상태 변경: 제안자(취소) 또는 수신자(수락/거절)
CREATE POLICY "meetups_update" ON meetups
  FOR UPDATE USING (
    auth.uid() = proposer_id OR auth.uid() = receiver_id
  );


-- ════════════════════════════════════════════════════════
--  [4] Realtime 활성화
-- ════════════════════════════════════════════════════════
ALTER PUBLICATION supabase_realtime ADD TABLE meetups;
