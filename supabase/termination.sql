-- ════════════════════════════════════════════════════════
--  [0] profiles 누락 컬럼 추가
-- ════════════════════════════════════════════════════════
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS manner_temperature FLOAT NOT NULL DEFAULT 36.5,
  ADD COLUMN IF NOT EXISTS is_verified        BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS status             TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'shadow_banned', 'suspended', 'terminated'));


-- ════════════════════════════════════════════════════════
--  [1] terminated_users — 탈퇴 기록 (재가입 차단용)
-- ════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS terminated_users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL,
  email           TEXT,
  nickname        TEXT,
  reason          TEXT NOT NULL,
  detail          TEXT,
  manner_temp_at_termination FLOAT,
  report_count_at_termination INT,
  terminated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS term_email_idx ON terminated_users(email);
CREATE INDEX IF NOT EXISTS term_user_idx  ON terminated_users(user_id);

ALTER TABLE terminated_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "terminated_no_access" ON terminated_users
  FOR ALL USING (FALSE);


-- ════════════════════════════════════════════════════════
--  [2] moderation_violations — AI 모데레이션 위반 누적
-- ════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS moderation_violations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  message     TEXT NOT NULL,
  categories  TEXT[],
  lounge_id   TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS modviol_user_idx ON moderation_violations(user_id);

ALTER TABLE moderation_violations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "modviol_no_access" ON moderation_violations
  FOR ALL USING (FALSE);


-- ════════════════════════════════════════════════════════
--  [3] 자동 탈퇴 트리거 함수
-- ════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION auto_terminate_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_report_count  INT;
  v_reason        TEXT;
  v_detail        TEXT;
BEGIN
  -- 이미 탈퇴 처리된 유저는 스킵
  IF NEW.status = 'terminated' THEN RETURN NEW; END IF;

  v_reason := NULL;

  -- 조건 1: 매너온도 20℃ 이하
  IF NEW.manner_temperature <= 20 THEN
    v_reason := 'low_temperature';
    v_detail := '매너온도 ' || NEW.manner_temperature || '℃ — 자동 탈퇴';
  END IF;

  -- 조건 2: 신고 누적 5회 이상
  IF v_reason IS NULL THEN
    SELECT COUNT(*) INTO v_report_count
    FROM reports WHERE target_user_id = NEW.id;

    IF v_report_count >= 5 THEN
      v_reason := 'report_threshold';
      v_detail := '신고 ' || v_report_count || '회 누적 — 자동 탈퇴';
    END IF;
  END IF;

  IF v_reason IS NULL THEN RETURN NEW; END IF;

  -- 상태 변경
  NEW.status := 'terminated';

  -- 탈퇴 기록 저장
  INSERT INTO terminated_users(
    user_id, email, nickname, reason, detail,
    manner_temp_at_termination, report_count_at_termination
  ) VALUES (
    NEW.id, NULL, NEW.nickname, v_reason, v_detail,
    NEW.manner_temperature, COALESCE(v_report_count, 0)
  );

  -- 마지막 알림 (본인에게)
  INSERT INTO notifications(user_id, type, title, body, action_url)
  VALUES (
    NEW.id, 'system',
    '계정이 영구 정지되었습니다',
    v_detail,
    '/banned'
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_terminate ON profiles;
CREATE TRIGGER trg_auto_terminate
  BEFORE UPDATE OF manner_temperature, status ON profiles
  FOR EACH ROW EXECUTE FUNCTION auto_terminate_user();


-- ════════════════════════════════════════════════════════
--  [4] 재가입 차단 트리거
-- ════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION block_terminated_signup()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_email TEXT;
BEGIN
  SELECT email INTO v_email FROM auth.users WHERE id = NEW.id;

  IF EXISTS (
    SELECT 1 FROM terminated_users
    WHERE email = v_email OR user_id = NEW.id
  ) THEN
    NEW.status := 'terminated';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_block_terminated ON profiles;
CREATE TRIGGER trg_block_terminated
  BEFORE INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION block_terminated_signup();
