-- ============================================================
-- NomadLounge — Row Level Security 정책
-- Supabase SQL Editor에서 전체 실행하세요
-- ============================================================

-- --------------------------------------------------------
-- 1. RLS 활성화
-- --------------------------------------------------------
ALTER TABLE cities              ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles            ENABLE ROW LEVEL SECURITY;
ALTER TABLE lounges             ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages            ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_translations ENABLE ROW LEVEL SECURITY;


-- --------------------------------------------------------
-- 2. cities — 누구나 읽기 가능, 쓰기는 서비스 롤만
-- --------------------------------------------------------
CREATE POLICY "cities_select_all"
  ON cities FOR SELECT
  USING (true);

-- (INSERT/UPDATE/DELETE는 정책 없음 = 서비스 롤에서만 가능)


-- --------------------------------------------------------
-- 3. profiles — 읽기는 인증 유저 누구나, 수정은 본인만
-- --------------------------------------------------------
CREATE POLICY "profiles_select_authenticated"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "profiles_insert_own"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);


-- --------------------------------------------------------
-- 4. lounges — 읽기/생성은 인증 유저 누구나
-- --------------------------------------------------------
CREATE POLICY "lounges_select_authenticated"
  ON lounges FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "lounges_insert_authenticated"
  ON lounges FOR INSERT
  TO authenticated
  WITH CHECK (true);


-- --------------------------------------------------------
-- 5. messages — 읽기/쓰기는 인증 유저, 삭제는 본인만
-- --------------------------------------------------------
CREATE POLICY "messages_select_authenticated"
  ON messages FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "messages_insert_own"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "messages_delete_own"
  ON messages FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);


-- --------------------------------------------------------
-- 6. message_translations — 읽기/쓰기 인증 유저 누구나
--    (번역은 서버 API에서 삽입하므로 쓰기 허용)
-- --------------------------------------------------------
CREATE POLICY "translations_select_authenticated"
  ON message_translations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "translations_insert_authenticated"
  ON message_translations FOR INSERT
  TO authenticated
  WITH CHECK (true);


-- --------------------------------------------------------
-- 7. Realtime 활성화 (messages 테이블)
-- --------------------------------------------------------
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE cities;
