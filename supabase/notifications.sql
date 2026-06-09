-- ════════════════════════════════════════════════════════
--  [1] notifications 테이블
-- ════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,  -- 받는 사람
  type        TEXT NOT NULL,  -- 'dm' | 'meetup_accepted' | 'meetup_declined' | 'signal_reaction' | 'city_active'
  title       TEXT NOT NULL,
  body        TEXT,
  action_url  TEXT,           -- 클릭 시 이동할 경로 (e.g. /dm/uuid)
  is_read     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS notif_user_idx    ON notifications(user_id);
CREATE INDEX IF NOT EXISTS notif_unread_idx  ON notifications(user_id, is_read) WHERE is_read = FALSE;

-- ── RLS ─────────────────────────────────────────────────
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notif_select" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "notif_update" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);  -- 읽음 처리

-- 시스템 트리거가 INSERT하므로 service_role 허용
CREATE POLICY "notif_insert" ON notifications
  FOR INSERT WITH CHECK (TRUE);


-- ════════════════════════════════════════════════════════
--  [2] Realtime 활성화
-- ════════════════════════════════════════════════════════
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;


-- ════════════════════════════════════════════════════════
--  [3] 자동 트리거: DM 수신 알림
--      messages 테이블에 receiver_id가 있는 메시지 INSERT 시
-- ════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION notify_on_dm()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  sender_nick TEXT;
BEGIN
  -- DM만 처리 (receiver_id 있고 lounge_id 없는 메시지)
  IF NEW.receiver_id IS NULL THEN RETURN NEW; END IF;

  SELECT nickname INTO sender_nick FROM profiles WHERE id = NEW.sender_id;

  INSERT INTO notifications(user_id, type, title, body, action_url)
  VALUES (
    NEW.receiver_id,
    'dm',
    sender_nick || '님의 새 메시지',
    LEFT(NEW.content, 60),
    '/dm/' || NEW.sender_id::TEXT || '?name=' || sender_nick
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_dm ON messages;
CREATE TRIGGER trg_notify_dm
  AFTER INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION notify_on_dm();


-- ════════════════════════════════════════════════════════
--  [4] 자동 트리거: 약속 수락/거절 알림
-- ════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION notify_on_meetup_update()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  responder_nick TEXT;
  notif_type     TEXT;
  notif_title    TEXT;
BEGIN
  -- 상태가 바뀐 경우만 처리
  IF OLD.status = NEW.status THEN RETURN NEW; END IF;
  IF NEW.status NOT IN ('accepted', 'declined') THEN RETURN NEW; END IF;

  SELECT nickname INTO responder_nick FROM profiles WHERE id = NEW.receiver_id;

  IF NEW.status = 'accepted' THEN
    notif_type  := 'meetup_accepted';
    notif_title := responder_nick || '님이 약속을 수락했어요! 🎉';
  ELSE
    notif_type  := 'meetup_declined';
    notif_title := responder_nick || '님이 약속을 거절했어요';
  END IF;

  INSERT INTO notifications(user_id, type, title, body, action_url)
  VALUES (
    NEW.proposer_id,
    notif_type,
    notif_title,
    NEW.place || ' · ' || TO_CHAR(NEW.meet_at AT TIME ZONE 'UTC', 'MM/DD HH24:MI'),
    '/dm/' || NEW.receiver_id::TEXT || '?name=' || responder_nick
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_meetup ON meetups;
CREATE TRIGGER trg_notify_meetup
  AFTER UPDATE ON meetups
  FOR EACH ROW EXECUTE FUNCTION notify_on_meetup_update();


-- ════════════════════════════════════════════════════════
--  [5] 자동 트리거: 시그널 반응 알림
--      DM을 보낼 때 상대방 시그널이 있으면 알림
-- ════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION notify_on_signal_reaction()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  sender_nick    TEXT;
  receiver_signal TEXT;
BEGIN
  IF NEW.receiver_id IS NULL THEN RETURN NEW; END IF;

  -- 수신자에게 활성 시그널이 있는지 확인
  SELECT status_signal INTO receiver_signal
  FROM profiles WHERE id = NEW.receiver_id AND status_signal IS NOT NULL;

  IF receiver_signal IS NULL THEN RETURN NEW; END IF;

  SELECT nickname INTO sender_nick FROM profiles WHERE id = NEW.sender_id;

  INSERT INTO notifications(user_id, type, title, body, action_url)
  VALUES (
    NEW.receiver_id,
    'signal_reaction',
    sender_nick || '님이 내 시그널에 반응했어요! ⚡',
    '"' || receiver_signal || '" 시그널을 보고 연락했어요',
    '/dm/' || NEW.sender_id::TEXT || '?name=' || sender_nick
  );

  RETURN NEW;
END;
$$;

-- DM 트리거와 같은 테이블이므로 함수만 별도 등록
-- (trg_notify_dm에서 시그널 반응도 함께 처리하도록 통합 가능)
-- 별도 트리거로 분리하면 알림이 2개 생성되므로 notify_on_dm을 확장하는 방식 사용:

CREATE OR REPLACE FUNCTION notify_on_dm()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  sender_nick     TEXT;
  receiver_signal TEXT;
BEGIN
  IF NEW.receiver_id IS NULL THEN RETURN NEW; END IF;

  SELECT nickname INTO sender_nick FROM profiles WHERE id = NEW.sender_id;

  -- 1) 기본 DM 알림
  INSERT INTO notifications(user_id, type, title, body, action_url)
  VALUES (
    NEW.receiver_id, 'dm',
    sender_nick || '님의 새 메시지',
    LEFT(NEW.content, 60),
    '/dm/' || NEW.sender_id::TEXT || '?name=' || sender_nick
  );

  -- 2) 시그널 반응 알림 (수신자에게 활성 시그널이 있을 때 추가 알림)
  SELECT status_signal INTO receiver_signal
  FROM profiles WHERE id = NEW.receiver_id AND status_signal IS NOT NULL;

  IF receiver_signal IS NOT NULL THEN
    INSERT INTO notifications(user_id, type, title, body, action_url)
    VALUES (
      NEW.receiver_id, 'signal_reaction',
      sender_nick || '님이 내 시그널에 반응했어요! ⚡',
      '"' || receiver_signal || '" 시그널을 보고 연락했어요',
      '/dm/' || NEW.sender_id::TEXT || '?name=' || sender_nick
    );
  END IF;

  RETURN NEW;
END;
$$;
