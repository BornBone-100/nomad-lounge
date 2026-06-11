-- ════════════════════════════════════════════════════════
--  NomadLounge Explore 기능 DB 확장
--  3대 킬러기능: 지도 시그널 / 로컬 맛집 / 취미 스쿼드
-- ════════════════════════════════════════════════════════

-- ── [0] profiles 컬럼 확장 ──────────────────────────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS hobbies       TEXT[]           DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS signal_lat    DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS signal_lng    DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS signal_place_id UUID;          -- places_db 참조 (나중에 FK 추가)


-- ── [1] places_db (로컬 맛집/명소) ──────────────────────
CREATE TABLE IF NOT EXISTS places_db (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city_id         UUID REFERENCES cities(id) ON DELETE CASCADE,
  name            TEXT            NOT NULL,
  name_ko         TEXT,
  category        TEXT            NOT NULL DEFAULT 'restaurant',
  -- category: 'restaurant' | 'cafe' | 'bar' | 'activity' | 'attraction'
  latitude        DOUBLE PRECISION NOT NULL,
  longitude       DOUBLE PRECISION NOT NULL,
  address         TEXT,
  local_review    TEXT,           -- 로컬 한줄평
  tags            TEXT[]          DEFAULT '{}',
  price_range     INT             DEFAULT 2,  -- 1~4 ($~$$$$)
  avg_rating      FLOAT           DEFAULT 0,
  review_count    INT             DEFAULT 0,
  is_verified     BOOLEAN         DEFAULT FALSE,
  verified_by     UUID            REFERENCES profiles(id),
  photos          TEXT[]          DEFAULT '{}',
  google_place_id TEXT,
  created_at      TIMESTAMPTZ     DEFAULT NOW()
);

-- 위치 기반 쿼리 인덱스
CREATE INDEX IF NOT EXISTS places_db_location_idx
  ON places_db(latitude, longitude)
  WHERE latitude IS NOT NULL;

CREATE INDEX IF NOT EXISTS places_db_city_idx
  ON places_db(city_id);

-- profiles의 signal_place_id FK
ALTER TABLE profiles
  ADD CONSTRAINT fk_signal_place
  FOREIGN KEY (signal_place_id) REFERENCES places_db(id)
  ON DELETE SET NULL
  DEFERRABLE INITIALLY DEFERRED;


-- ── [2] user_signals (위치 기반 시그널 전용 테이블) ────────
CREATE TABLE IF NOT EXISTS user_signals (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID         NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  city_id     UUID         REFERENCES cities(id),
  content     TEXT         NOT NULL,
  emoji       TEXT         NOT NULL DEFAULT '⚡',
  latitude    DOUBLE PRECISION,
  longitude   DOUBLE PRECISION,
  place_id    UUID         REFERENCES places_db(id) ON DELETE SET NULL,
  expires_at  TIMESTAMPTZ  NOT NULL DEFAULT (NOW() + INTERVAL '4 hours'),
  created_at  TIMESTAMPTZ  DEFAULT NOW()
);

-- 만료된 시그널 필터링용 인덱스 (NOW()는 IMMUTABLE 아니므로 WHERE절 제거)
CREATE INDEX IF NOT EXISTS user_signals_active_idx
  ON user_signals(expires_at);

CREATE INDEX IF NOT EXISTS user_signals_location_idx
  ON user_signals(latitude, longitude)
  WHERE latitude IS NOT NULL;

-- RLS
ALTER TABLE user_signals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "signals_read_all"   ON user_signals FOR SELECT USING (true);
CREATE POLICY "signals_insert_own" ON user_signals FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "signals_delete_own" ON user_signals FOR DELETE
  USING (auth.uid() = user_id);
CREATE POLICY "signals_update_own" ON user_signals FOR UPDATE
  USING (auth.uid() = user_id);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE user_signals;


-- ── [3] squads (취미/액티비티 그룹) ─────────────────────
CREATE TABLE IF NOT EXISTS squads (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city_id      UUID         REFERENCES cities(id) ON DELETE CASCADE,
  name         TEXT         NOT NULL,
  hobby_tag    TEXT         NOT NULL,
  emoji        TEXT         DEFAULT '🏄',
  description  TEXT,
  member_count INT          DEFAULT 0,
  lounge_id    UUID         REFERENCES lounges(id),
  created_at   TIMESTAMPTZ  DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS squads_city_idx ON squads(city_id);

ALTER TABLE squads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "squads_read_all"  ON squads FOR SELECT USING (true);
CREATE POLICY "squads_insert_auth" ON squads FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);


-- ── [4] squad_members ────────────────────────────────────
CREATE TABLE IF NOT EXISTS squad_members (
  squad_id  UUID REFERENCES squads(id) ON DELETE CASCADE,
  user_id   UUID REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (squad_id, user_id)
);

ALTER TABLE squad_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "squad_members_read_all"  ON squad_members FOR SELECT USING (true);
CREATE POLICY "squad_members_join"      ON squad_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "squad_members_leave"     ON squad_members FOR DELETE
  USING (auth.uid() = user_id);

-- member_count 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_squad_member_count()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE squads SET member_count = member_count + 1 WHERE id = NEW.squad_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE squads SET member_count = GREATEST(member_count - 1, 0) WHERE id = OLD.squad_id;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER trg_squad_member_count
  AFTER INSERT OR DELETE ON squad_members
  FOR EACH ROW EXECUTE FUNCTION update_squad_member_count();


-- ── [5] place_meetups (장소 기반 밥메이트/동행 모집) ────────
CREATE TABLE IF NOT EXISTS place_meetups (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id        UUID         NOT NULL REFERENCES places_db(id) ON DELETE CASCADE,
  organizer_id    UUID         NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  city_id         UUID         REFERENCES cities(id),
  title           TEXT         NOT NULL,
  meet_at         TIMESTAMPTZ  NOT NULL,
  max_members     INT          DEFAULT 4,
  current_members INT          DEFAULT 1,
  status          TEXT         DEFAULT 'open',  -- 'open' | 'full' | 'closed'
  created_at      TIMESTAMPTZ  DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS place_meetups_place_idx ON place_meetups(place_id);
CREATE INDEX IF NOT EXISTS place_meetups_status_idx ON place_meetups(status, meet_at);

ALTER TABLE place_meetups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "place_meetups_read_all"   ON place_meetups FOR SELECT USING (true);
CREATE POLICY "place_meetups_create"     ON place_meetups FOR INSERT
  WITH CHECK (auth.uid() = organizer_id);
CREATE POLICY "place_meetups_update_own" ON place_meetups FOR UPDATE
  USING (auth.uid() = organizer_id);

ALTER PUBLICATION supabase_realtime ADD TABLE place_meetups;


-- ── [6] place_meetup_members ─────────────────────────────
CREATE TABLE IF NOT EXISTS place_meetup_members (
  meetup_id UUID REFERENCES place_meetups(id) ON DELETE CASCADE,
  user_id   UUID REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (meetup_id, user_id)
);

ALTER TABLE place_meetup_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pmm_read_all"  ON place_meetup_members FOR SELECT USING (true);
CREATE POLICY "pmm_join"      ON place_meetup_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "pmm_leave"     ON place_meetup_members FOR DELETE
  USING (auth.uid() = user_id);

-- current_members 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_place_meetup_count()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE place_meetups
    SET current_members = current_members + 1,
        status = CASE
          WHEN current_members + 1 >= max_members THEN 'full'
          ELSE status
        END
    WHERE id = NEW.meetup_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE place_meetups
    SET current_members = GREATEST(current_members - 1, 1),
        status = 'open'
    WHERE id = OLD.meetup_id;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER trg_place_meetup_count
  AFTER INSERT OR DELETE ON place_meetup_members
  FOR EACH ROW EXECUTE FUNCTION update_place_meetup_count();


-- ── [7] 도시별 기본 스쿼드 시드 데이터 ──────────────────────
-- 발리 스쿼드 예시 (실제 배포 시 city_id를 실제 UUID로 교체 필요)
-- INSERT INTO squads (city_id, name, hobby_tag, emoji, description)
-- SELECT id, '발리 서퍼스', 'surfing', '🏄', '에코비치에서 같이 서핑해요!'
-- FROM cities WHERE name ILIKE '%bali%' LIMIT 1;

-- RLS for places_db
ALTER TABLE places_db ENABLE ROW LEVEL SECURITY;
CREATE POLICY "places_read_all"    ON places_db FOR SELECT USING (true);
CREATE POLICY "places_insert_auth" ON places_db FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "places_update_verified" ON places_db FOR UPDATE
  USING (auth.uid() IS NOT NULL);
