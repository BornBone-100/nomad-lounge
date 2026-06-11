-- ════════════════════════════════════════════════════════
--  NomadLounge 도시 시드 데이터
--  전 세계 솔로 여행자 핫플 20개 도시
-- ════════════════════════════════════════════════════════

-- ── 컬럼 없으면 추가 ──────────────────────────────────────
ALTER TABLE cities ADD COLUMN IF NOT EXISTS name_ko        TEXT;
ALTER TABLE cities ADD COLUMN IF NOT EXISTS country        TEXT;
ALTER TABLE cities ADD COLUMN IF NOT EXISTS country_code   TEXT;
ALTER TABLE cities ADD COLUMN IF NOT EXISTS emoji          TEXT;
ALTER TABLE cities ADD COLUMN IF NOT EXISTS timezone       TEXT;
ALTER TABLE cities ADD COLUMN IF NOT EXISTS traveler_count INT DEFAULT 0;

-- ── name 컬럼 UNIQUE 제약 추가 (없으면) ──────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'cities_name_unique' AND conrelid = 'cities'::regclass
  ) THEN
    ALTER TABLE cities ADD CONSTRAINT cities_name_unique UNIQUE (name);
  END IF;
END $$;

-- ── 데이터 삽입 ──────────────────────────────────────────
INSERT INTO cities (name, name_ko, country, country_code, emoji, timezone, latitude, longitude, traveler_count)
VALUES
  ('Bali',         '발리',        'Indonesia',     'ID', '🌴', 'Asia/Makassar',       -8.3405,   115.0920,  0),
  ('Bangkok',      '방콕',        'Thailand',      'TH', '🐘', 'Asia/Bangkok',         13.7563,   100.5018,  0),
  ('Tokyo',        '도쿄',        'Japan',         'JP', '🗼', 'Asia/Tokyo',           35.6762,   139.6503,  0),
  ('Barcelona',    '바르셀로나',   'Spain',         'ES', '💃', 'Europe/Madrid',        41.3851,     2.1734,  0),
  ('Lisbon',       '리스본',      'Portugal',      'PT', '🏰', 'Europe/Lisbon',        38.7169,    -9.1399,  0),
  ('Ho Chi Minh',  '호치민',      'Vietnam',       'VN', '🍜', 'Asia/Ho_Chi_Minh',    10.8231,   106.6297,  0),
  ('Chiang Mai',   '치앙마이',    'Thailand',      'TH', '🏔️', 'Asia/Bangkok',        18.7883,    98.9853,  0),
  ('Medellín',     '메데진',      'Colombia',      'CO', '🌺', 'America/Bogota',        6.2442,   -75.5812,  0),
  ('Budapest',     '부다페스트',  'Hungary',       'HU', '🏛️', 'Europe/Budapest',     47.4979,    19.0402,  0),
  ('Tbilisi',      '트빌리시',    'Georgia',       'GE', '🍷', 'Asia/Tbilisi',         41.6938,    44.8015,  0),
  ('Mexico City',  '멕시코시티',  'Mexico',        'MX', '🌮', 'America/Mexico_City',  19.4326,   -99.1332,  0),
  ('Prague',       '프라하',      'Czech Republic','CZ', '🍺', 'Europe/Prague',        50.0755,    14.4378,  0),
  ('Hanoi',        '하노이',      'Vietnam',       'VN', '🏮', 'Asia/Ho_Chi_Minh',    21.0285,   105.8542,  0),
  ('Cape Town',    '케이프타운',  'South Africa',  'ZA', '🦁', 'Africa/Johannesburg', -33.9249,    18.4241,  0),
  ('Kyoto',        '교토',        'Japan',         'JP', '⛩️', 'Asia/Tokyo',          35.0116,   135.7681,  0),
  ('Athens',       '아테네',      'Greece',        'GR', '🏛️', 'Europe/Athens',       37.9838,    23.7275,  0),
  ('Berlin',       '베를린',      'Germany',       'DE', '🎸', 'Europe/Berlin',        52.5200,    13.4050,  0),
  ('Kuala Lumpur', '쿠알라룸푸르','Malaysia',      'MY', '🏙️', 'Asia/Kuala_Lumpur',    3.1390,   101.6869,  0),
  ('Porto',        '포르투',      'Portugal',      'PT', '🍊', 'Europe/Lisbon',        41.1579,    -8.6291,  0),
  ('Seoul',        '서울',        'South Korea',   'KR', '🌸', 'Asia/Seoul',           37.5665,   126.9780,  0)
ON CONFLICT (name) DO UPDATE SET
  name_ko        = EXCLUDED.name_ko,
  country        = EXCLUDED.country,
  country_code   = EXCLUDED.country_code,
  emoji          = EXCLUDED.emoji,
  timezone       = EXCLUDED.timezone,
  latitude       = EXCLUDED.latitude,
  longitude      = EXCLUDED.longitude;


-- ── 각 도시의 라운지(메인 채팅방) 자동 생성 ──────────────────
INSERT INTO lounges (city_id, type)
SELECT c.id, 'main'
FROM cities c
WHERE NOT EXISTS (
  SELECT 1 FROM lounges l WHERE l.city_id = c.id
);
