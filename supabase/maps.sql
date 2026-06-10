-- ════════════════════════════════════════════════════════
--  [1] profiles — 위치 정보 추가
-- ════════════════════════════════════════════════════════
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS latitude  DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

-- 위치 기반 쿼리용 인덱스
CREATE INDEX IF NOT EXISTS profiles_location_idx
  ON profiles(latitude, longitude)
  WHERE latitude IS NOT NULL AND longitude IS NOT NULL;


-- ════════════════════════════════════════════════════════
--  [2] cities — 위경도 추가 (도시 선택 지도용)
-- ════════════════════════════════════════════════════════
ALTER TABLE cities
  ADD COLUMN IF NOT EXISTS latitude  DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

-- 주요 도시 위경도 시드 데이터 (name 컬럼 기준 ILIKE로 매칭)
UPDATE cities SET latitude = 13.7563,  longitude = 100.5018 WHERE name ILIKE '%bangkok%'  OR name ILIKE '%방콕%';
UPDATE cities SET latitude = -8.4095,  longitude = 115.1889 WHERE name ILIKE '%bali%'     OR name ILIKE '%발리%';
UPDATE cities SET latitude = 1.3521,   longitude = 103.8198 WHERE name ILIKE '%singapore%' OR name ILIKE '%싱가포르%';
UPDATE cities SET latitude = 48.8566,  longitude = 2.3522   WHERE name ILIKE '%paris%'    OR name ILIKE '%파리%';
UPDATE cities SET latitude = 35.6762,  longitude = 139.6503 WHERE name ILIKE '%tokyo%'    OR name ILIKE '%도쿄%';
UPDATE cities SET latitude = 37.5665,  longitude = 126.9780 WHERE name ILIKE '%seoul%'    OR name ILIKE '%서울%';
UPDATE cities SET latitude = 40.7128,  longitude = -74.0060 WHERE name ILIKE '%new york%' OR name ILIKE '%뉴욕%';
UPDATE cities SET latitude = 51.5074,  longitude = -0.1278  WHERE name ILIKE '%london%'   OR name ILIKE '%런던%';
UPDATE cities SET latitude = -33.8688, longitude = 151.2093 WHERE name ILIKE '%sydney%'   OR name ILIKE '%시드니%';
UPDATE cities SET latitude = 25.2048,  longitude = 55.2708  WHERE name ILIKE '%dubai%'    OR name ILIKE '%두바이%';
UPDATE cities SET latitude = 41.9028,  longitude = 12.4964  WHERE name ILIKE '%rome%'     OR name ILIKE '%로마%';
UPDATE cities SET latitude = 22.3193,  longitude = 114.1694 WHERE name ILIKE '%hong kong%' OR name ILIKE '%홍콩%';
UPDATE cities SET latitude = 3.1390,   longitude = 101.6869 WHERE name ILIKE '%kuala%'    OR name ILIKE '%쿠알라%';
UPDATE cities SET latitude = 14.5995,  longitude = 120.9842 WHERE name ILIKE '%manila%'   OR name ILIKE '%마닐라%';
UPDATE cities SET latitude = 21.0278,  longitude = 105.8342 WHERE name ILIKE '%hanoi%'    OR name ILIKE '%하노이%';


-- ════════════════════════════════════════════════════════
--  [3] meetups — 위경도 추가 (약속 장소 핀용)
-- ════════════════════════════════════════════════════════
ALTER TABLE meetups
  ADD COLUMN IF NOT EXISTS place_lat  DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS place_lng  DOUBLE PRECISION;
