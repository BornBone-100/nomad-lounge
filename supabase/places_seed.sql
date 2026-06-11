-- ════════════════════════════════════════════════════════
--  NomadLounge 전 세계 20개 도시 로컬 맛집/명소 시드 데이터
--  cities_seed.sql 실행 후 이 파일 실행
-- ════════════════════════════════════════════════════════

-- ── 🌴 발리 (Bali) ──────────────────────────────────────
INSERT INTO places_db (city_id, name, name_ko, category, latitude, longitude, local_review, tags, price_range, avg_rating, is_verified)
SELECT id, 'Warung Babi Guling Ibu Oka', '이부 오카 바비굴링', 'restaurant',
  -8.3405, 115.0895, '발리 전통 통돼지 구이의 성지. 줄 서도 먹을 가치 있음. 오전 11시 전에 가야 안 품절',
  ARRAY['로컬맛집', '전통음식', '솔로OK'], 1, 4.7, true FROM cities WHERE name = 'Bali'
UNION ALL
SELECT id, 'Zibiru Restaurant', '지비루', 'restaurant',
  -8.6778, 115.1629, '쌀딩 절벽뷰 레스토랑. 석양 볼 때 가면 인생샷 보장. 인도네시아 파인다이닝',
  ARRAY['뷰맛집', '데이트', '석양'], 3, 4.5, true FROM cities WHERE name = 'Bali'
UNION ALL
SELECT id, 'Revolver Espresso', '리볼버 에스프레소', 'cafe',
  -8.6748, 115.1625, '발리 최고의 스페셜티 카페. 골목 안 숨겨진 보물. 에스프레소 한 잔으로 하루 시작',
  ARRAY['카페', '스페셜티', '솔로OK'], 2, 4.6, true FROM cities WHERE name = 'Bali'
UNION ALL
SELECT id, 'Single Fin Bali', '싱글핀', 'bar',
  -8.8100, 115.0888, '울루와뚜 절벽 위 바. 서핑 보며 맥주 한 잔. 일요일 선셋 파티는 필수',
  ARRAY['바', '서핑뷰', '파티'], 2, 4.4, true FROM cities WHERE name = 'Bali'
UNION ALL
SELECT id, 'Tegallalang Rice Terrace', '떼갈랄랑 계단식 논', 'attraction',
  -8.4322, 115.2771, '인스타에서 본 그 논 맞음. 이른 아침 6-7시에 가면 관광객 없이 혼자 즐길 수 있음',
  ARRAY['자연', '포토스팟', '아침추천'], 1, 4.3, false FROM cities WHERE name = 'Bali';

-- ── 🐘 방콕 (Bangkok) ────────────────────────────────────
INSERT INTO places_db (city_id, name, name_ko, category, latitude, longitude, local_review, tags, price_range, avg_rating, is_verified)
SELECT id, 'Jay Fai', '제이 파이', 'restaurant',
  13.7574, 100.5014, '미슐랭 스타 받은 노점. 1인 게살 팟타이 700바트. 줄 2-3시간은 기본, 전날 예약 필수',
  ARRAY['미슐랭', '팟타이', '솔로OK'], 3, 4.8, true FROM cities WHERE name = 'Bangkok'
UNION ALL
SELECT id, 'Kuay Tiew Reua Prayoon', '쁘라윤 보트국수', 'restaurant',
  13.7372, 100.5025, '현지인만 아는 보트 국수. 한 그릇 50바트. 방콕 왔으면 무조건 먹어야 하는 진짜 로컬 맛',
  ARRAY['로컬맛집', '저렴', '현지인'], 1, 4.5, true FROM cities WHERE name = 'Bangkok'
UNION ALL
SELECT id, 'Roast Coffee', '로스트 커피', 'cafe',
  13.7285, 100.5693, '방콕 힙스터들의 성지 Em Quartier 내 위치. 브런치 맛있고 에어컨 빵빵',
  ARRAY['카페', '브런치', '에어컨'], 2, 4.3, false FROM cities WHERE name = 'Bangkok'
UNION ALL
SELECT id, 'Maggie Choo''s', '매기 추', 'bar',
  13.7254, 100.5285, '지하 빈티지 재즈바. 드레스코드 있음(스마트 캐주얼). 혼자 가도 바텐더가 말 걸어줌',
  ARRAY['재즈바', '분위기', '솔로OK'], 3, 4.4, true FROM cities WHERE name = 'Bangkok'
UNION ALL
SELECT id, 'Chatuchak Weekend Market', '짜뚜짝 주말시장', 'attraction',
  13.7999, 100.5503, '토/일만 열리는 세계 최대 규모 시장. 섹션 27 빈티지 의류 강추. 아침 일찍 가야 덜 더움',
  ARRAY['쇼핑', '주말한정', '현지경험'], 1, 4.5, true FROM cities WHERE name = 'Bangkok';

-- ── 🗼 도쿄 (Tokyo) ──────────────────────────────────────
INSERT INTO places_db (city_id, name, name_ko, category, latitude, longitude, local_review, tags, price_range, avg_rating, is_verified)
SELECT id, 'Ichiran Ramen Shibuya', '이치란 라멘 시부야', 'restaurant',
  35.6595, 139.7004, '1인 칸막이 라멘의 원조. 솔로 여행자에게 최고의 식사. 한국어 주문서 있음',
  ARRAY['라멘', '1인석', '솔로최고'], 2, 4.6, true FROM cities WHERE name = 'Tokyo'
UNION ALL
SELECT id, 'Tsukiji Outer Market', '츠키지 외시장', 'restaurant',
  35.6654, 139.7707, '신선한 참치 카이센동 아침 식사. 8시 전에 가야 줄 짧음. 타마고야끼도 필수',
  ARRAY['해산물', '아침식사', '신선'], 2, 4.7, true FROM cities WHERE name = 'Tokyo'
UNION ALL
SELECT id, 'Fuglen Tokyo', '푸글렌 도쿄', 'cafe',
  35.6693, 139.6985, '노르웨이 스페셜티 커피의 도쿄 지점. 저녁엔 바로 변신. 요요기공원 바로 옆',
  ARRAY['스페셜티', '낮엔카페밤엔바', '공원뷰'], 2, 4.5, true FROM cities WHERE name = 'Tokyo'
UNION ALL
SELECT id, 'Golden Gai', '골든가이', 'bar',
  35.6939, 139.7036, '신주쿠 골목 미로 속 작은 바들. 혼자 가면 마스터가 말 걸어줌. 한 바당 5-6명 정원',
  ARRAY['바', '혼자추천', '신주쿠'], 2, 4.6, true FROM cities WHERE name = 'Tokyo'
UNION ALL
SELECT id, 'Yanaka Ginza', '야나카 긴자', 'attraction',
  35.7266, 139.7698, '도쿄에서 옛날 느낌 가장 많이 남은 동네. 고양이 많음. 멜론빵 먹으며 산책 추천',
  ARRAY['올드도쿄', '산책', '고양이'], 1, 4.4, false FROM cities WHERE name = 'Tokyo';

-- ── 💃 바르셀로나 (Barcelona) ────────────────────────────
INSERT INTO places_db (city_id, name, name_ko, category, latitude, longitude, local_review, tags, price_range, avg_rating, is_verified)
SELECT id, 'Bar El Xampanyet', '엘 샴파네트', 'bar',
  41.3844, 2.1815, '1929년부터 운영한 바. 까바(스파클링 와인) 한 잔에 핀초스. 가우디 집에서 도보 5분',
  ARRAY['전통바', '카바', '핀초스'], 2, 4.5, true FROM cities WHERE name = 'Barcelona'
UNION ALL
SELECT id, 'Cervecería Catalana', '세르베세리아 카탈라나', 'restaurant',
  41.3932, 2.1607, '바르셀로나 최고의 핀초스 바. 람블라스 근처. 점심 12시 오픈 직후 가야 자리 있음',
  ARRAY['핀초스', '타파스', '솔로OK'], 2, 4.6, true FROM cities WHERE name = 'Barcelona'
UNION ALL
SELECT id, 'El Nacional', '엘 나시오날', 'restaurant',
  41.3925, 2.1652, '한 건물 안에 4개 레스토랑. 혼자 와도 바 자리에서 편하게 먹을 수 있음',
  ARRAY['분위기', '다양한음식', '솔로OK'], 3, 4.4, false FROM cities WHERE name = 'Barcelona'
UNION ALL
SELECT id, 'Nomad Coffee Lab', '노마드 커피', 'cafe',
  41.3986, 2.1824, '바르셀로나 스페셜티 커피 1위. 바리스타들이 열정적. 원두도 살 수 있음',
  ARRAY['스페셜티', '커피덕후', '솔로OK'], 2, 4.7, true FROM cities WHERE name = 'Barcelona'
UNION ALL
SELECT id, 'Barceloneta Beach', '바르셀로네타 해변', 'attraction',
  41.3793, 2.1896, '도심 접근성 최고의 도시 해변. 아침 7시 조깅 코스로도 최고. 비치발리볼 코트 무료',
  ARRAY['해변', '무료', '아침추천'], 1, 4.2, false FROM cities WHERE name = 'Barcelona';

-- ── 🏰 리스본 (Lisbon) ──────────────────────────────────
INSERT INTO places_db (city_id, name, name_ko, category, latitude, longitude, local_review, tags, price_range, avg_rating, is_verified)
SELECT id, 'Time Out Market', '타임아웃 마켓', 'restaurant',
  38.7067, -9.1459, '리스본 최고 레스토랑들이 한 자리에. 혼자 가도 카운터 석에서 부담 없이 먹기 좋음',
  ARRAY['푸드홀', '솔로OK', '다양한선택'], 2, 4.5, true FROM cities WHERE name = 'Lisbon'
UNION ALL
SELECT id, 'A Cevicheria', '아 세비체리아', 'restaurant',
  38.7148, -9.1487, '포르투갈식 세비체. 오픈 키친 바 자리에서 혼자 먹기 좋음. 문어 세비체 강추',
  ARRAY['해산물', '솔로OK', '바자리'], 3, 4.7, true FROM cities WHERE name = 'Lisbon'
UNION ALL
SELECT id, 'Copenhagen Coffee Lab', '코펜하겐 커피랩', 'cafe',
  38.7120, -9.1384, '리스본 스페셜티 커피 최강자. 아늑한 인테리어. 에그타르트와 함께하면 완벽',
  ARRAY['스페셜티', '에그타르트', '아늑함'], 2, 4.6, true FROM cities WHERE name = 'Lisbon'
UNION ALL
SELECT id, 'Park Bar', '파크 바', 'bar',
  38.7137, -9.1419, '주차장 옥상을 개조한 루프탑 바. 리스본 야경과 함께 진토닉 한 잔. 여름 필수 코스',
  ARRAY['루프탑', '야경', '진토닉'], 2, 4.4, true FROM cities WHERE name = 'Lisbon'
UNION ALL
SELECT id, 'Alfama District', '알파마 지구', 'attraction',
  38.7139, -9.1334, '리스본에서 가장 오래된 동네. 파두 음악 들리는 골목길 산책. 저녁 일몰 때 최고',
  ARRAY['올드타운', '파두', '산책'], 1, 4.6, false FROM cities WHERE name = 'Lisbon';

-- ── 🍜 호치민 (Ho Chi Minh) ──────────────────────────────
INSERT INTO places_db (city_id, name, name_ko, category, latitude, longitude, local_review, tags, price_range, avg_rating, is_verified)
SELECT id, 'Pho Hoa Pasteur', '포 호아 파스퇴르', 'restaurant',
  10.7772, 106.6950, '1960년부터 운영. 호치민 쌀국수의 전설. 현지인들도 아침에 줄 서는 곳',
  ARRAY['쌀국수', '전통', '아침식사'], 1, 4.6, true FROM cities WHERE name = 'Ho Chi Minh'
UNION ALL
SELECT id, 'Bui Vien Walking Street', '부이비엔 거리', 'bar',
  10.7671, 106.6928, '밤 9시부터 새벽 2시까지 거리 전체가 파티. 맥주 한 캔 20,000동(약 1천원)',
  ARRAY['파티거리', '저렴', '야간'], 1, 4.0, false FROM cities WHERE name = 'Ho Chi Minh'
UNION ALL
SELECT id, 'The Workshop Coffee', '더 워크샵 커피', 'cafe',
  10.7793, 106.6991, '호치민 스페셜티 커피 개척자. 넓은 공간, 빠른 와이파이. 디지털노마드 성지',
  ARRAY['스페셜티', '노마드', '와이파이'], 2, 4.5, true FROM cities WHERE name = 'Ho Chi Minh'
UNION ALL
SELECT id, 'Banh Mi Huynh Hoa', '반미 후인 호아', 'restaurant',
  10.7621, 106.6904, '호치민 반미 맛집 1위. 항상 줄 서있지만 10분이면 해결. 5만동(약 3천원)',
  ARRAY['반미', '줄서도OK', '저렴'], 1, 4.8, true FROM cities WHERE name = 'Ho Chi Minh'
UNION ALL
SELECT id, 'Saigon Skydeck', '사이공 스카이덱', 'attraction',
  10.7717, 106.7040, '비텍스코 타워 49층 전망대. 호치민 전경 한눈에. 일몰 1시간 전이 황금 타이밍',
  ARRAY['전망대', '야경', '포토스팟'], 2, 4.3, false FROM cities WHERE name = 'Ho Chi Minh';

-- ── 🏔️ 치앙마이 (Chiang Mai) ────────────────────────────
INSERT INTO places_db (city_id, name, name_ko, category, latitude, longitude, local_review, tags, price_range, avg_rating, is_verified)
SELECT id, 'Khao Soi Khun Yai', '카오소이 쿤야이', 'restaurant',
  18.7882, 98.9927, '치앙마이 카오소이(코코넛 커리 국수) 원조집. 현지인 단골. 점심 2시면 품절',
  ARRAY['카오소이', '로컬맛집', '현지인'], 1, 4.8, true FROM cities WHERE name = 'Chiang Mai'
UNION ALL
SELECT id, 'Ristr8to Coffee Lab', '리스트레토 커피랩', 'cafe',
  18.7884, 98.9962, '태국 바리스타 챔피언십 우승자 운영. 치앙마이 스페셜티 커피의 기준',
  ARRAY['스페셜티', '챔피언', '솔로OK'], 2, 4.7, true FROM cities WHERE name = 'Chiang Mai'
UNION ALL
SELECT id, 'Sunday Walking Street', '선데이 워킹스트리트', 'attraction',
  18.7884, 98.9872, '일요일 오후 4시-자정 와로롯 시장 주변. 수공예품, 길거리 음식, 라이브 음악',
  ARRAY['일요일한정', '야시장', '쇼핑'], 1, 4.5, false FROM cities WHERE name = 'Chiang Mai'
UNION ALL
SELECT id, 'Doi Inthanon National Park', '도이인타논 국립공원', 'activity',
  18.5887, 98.4865, '태국 최고봉. 새벽 일출 트레킹 강추. 치앙마이 시내에서 투어 3만원대',
  ARRAY['트레킹', '일출', '당일치기'], 2, 4.6, true FROM cities WHERE name = 'Chiang Mai'
UNION ALL
SELECT id, 'Zoe in Yellow', '조이 인 옐로우', 'bar',
  18.7909, 98.9978, '나이트바자 근처 야외 바. 여행자들 모여드는 핫플. 혼자 가면 친구 생김',
  ARRAY['야외바', '여행자모임', '솔로추천'], 1, 4.2, false FROM cities WHERE name = 'Chiang Mai';

-- ── 🌺 메데진 (Medellín) ────────────────────────────────
INSERT INTO places_db (city_id, name, name_ko, category, latitude, longitude, local_review, tags, price_range, avg_rating, is_verified)
SELECT id, 'Mondongos', '몬동고스', 'restaurant',
  6.2087, -75.5740, '콜롬비아 전통 소곱창 수프 몬동고. 현지인 가족 단골집. 아침 해장으로 최고',
  ARRAY['전통음식', '현지인', '해장'], 1, 4.5, true FROM cities WHERE name = 'Medellín'
UNION ALL
SELECT id, 'Café Pergamino', '카페 페르가미노', 'cafe',
  6.2094, -75.5694, '콜롬비아 스페셜티 커피 최고봉. 원두 직접 구매 가능. 엘 포블라도 핵심 카페',
  ARRAY['스페셜티', '콜롬비아원두', '디지털노마드'], 2, 4.8, true FROM cities WHERE name = 'Medellín'
UNION ALL
SELECT id, 'Parque Lleras', '파르케 예라스', 'bar',
  6.2086, -75.5691, '메데진 나이트라이프의 중심. 야외 레스토랑과 바들이 광장 중심으로 모여있음',
  ARRAY['광장', '나이트라이프', '안전'], 2, 4.3, false FROM cities WHERE name = 'Medellín'
UNION ALL
SELECT id, 'Pablo Escobar Tour', '파블로 에스코바르 투어', 'activity',
  6.2442, -75.5812, '메데진 역사를 이해하는 투어. 논란 있지만 도시 변화 과정 이해에 도움. 영어 투어 있음',
  ARRAY['역사투어', '영어OK', '당일'], 2, 4.1, false FROM cities WHERE name = 'Medellín'
UNION ALL
SELECT id, 'Mercado del Rio', '메르카도 델 리오', 'restaurant',
  6.2521, -75.5674, '메데진 최대 푸드홀. 다양한 콜롬비아 음식 한 자리에서. 혼자 가기 좋은 카운터 자리',
  ARRAY['푸드홀', '솔로OK', '다양'], 2, 4.4, true FROM cities WHERE name = 'Medellín';

-- ── 🏛️ 부다페스트 (Budapest) ────────────────────────────
INSERT INTO places_db (city_id, name, name_ko, category, latitude, longitude, local_review, tags, price_range, avg_rating, is_verified)
SELECT id, 'Széchenyi Thermal Bath', '세체니 온천', 'activity',
  47.5190, 19.0819, '부다페스트 최대 야외 온천. 겨울에 눈 맞으며 즐기는 건 버킷리스트. 수영복 렌탈 가능',
  ARRAY['온천', '버킷리스트', '겨울추천'], 2, 4.7, true FROM cities WHERE name = 'Budapest'
UNION ALL
SELECT id, 'Langos Stand Vásárcsarnok', '중앙시장 랑고시', 'restaurant',
  47.4874, 19.0577, '헝가리 전통 튀긴 빵 랑고시. 중앙시장 2층 노점. 사워크림+치즈 토핑이 정석',
  ARRAY['전통음식', '저렴', '시장음식'], 1, 4.5, true FROM cities WHERE name = 'Budapest'
UNION ALL
SELECT id, 'Ruin Bars Kazinczy Street', '루인바 카진치 거리', 'bar',
  47.4995, 19.0633, '폐건물 개조한 독특한 분위기의 루인바 밀집. 심플라 케르트가 가장 유명. 저렴하고 분위기 최고',
  ARRAY['루인바', '독특', '저렴'], 1, 4.6, true FROM cities WHERE name = 'Budapest'
UNION ALL
SELECT id, 'My Little Melbourne', '마이 리틀 멜버른', 'cafe',
  47.4977, 19.0511, '부다페스트 스페셜티 커피 1위. 호주 스타일. 플랫화이트 마시며 다뉴브강 걸어가기',
  ARRAY['스페셜티', '플랫화이트', '솔로OK'], 2, 4.6, true FROM cities WHERE name = 'Budapest'
UNION ALL
SELECT id, 'Fisherman''s Bastion', '어부의 요새', 'attraction',
  47.5018, 19.0345, '부다 성 옆 야경 포인트. 일몰 직후 30분이 황금. 야간에는 입장료 없음',
  ARRAY['야경', '무료(야간)', '포토스팟'], 1, 4.8, false FROM cities WHERE name = 'Budapest';

-- ── 🍷 트빌리시 (Tbilisi) ────────────────────────────────
INSERT INTO places_db (city_id, name, name_ko, category, latitude, longitude, local_review, tags, price_range, avg_rating, is_verified)
SELECT id, 'Café Leila', '카페 레일라', 'cafe',
  41.6932, 44.8008, '트빌리시 힙스터 카페 1위. 조지아 내추럴 와인도 팜. 아침 브런치 메뉴 훌륭',
  ARRAY['스페셜티', '내추럴와인', '브런치'], 2, 4.6, true FROM cities WHERE name = 'Tbilisi'
UNION ALL
SELECT id, 'Shavi Lomi', '샤비 로미', 'restaurant',
  41.6912, 44.7998, '조지아 현대 가정식 최고. 예약 필수. 힌칼리(만두)와 차슈슐리(스튜) 강추',
  ARRAY['조지아음식', '예약필수', '고급'], 3, 4.8, true FROM cities WHERE name = 'Tbilisi'
UNION ALL
SELECT id, 'Fabrika', '파브리카', 'bar',
  41.7015, 44.7854, '옛 봉제공장을 개조한 복합문화공간. 카페/바/호스텔/편집샵. 혼자 가서 사람 사귀기 최고',
  ARRAY['복합공간', '솔로추천', '힙플'], 2, 4.5, true FROM cities WHERE name = 'Tbilisi'
UNION ALL
SELECT id, 'Narikala Fortress', '나리칼라 요새', 'attraction',
  41.6881, 44.8093, '트빌리시 전경을 내려다보는 고대 요새. 케이블카 이용 추천. 일몰 뷰 환상적',
  ARRAY['유적지', '전망', '케이블카'], 1, 4.6, false FROM cities WHERE name = 'Tbilisi'
UNION ALL
SELECT id, 'Wine Factory N1', '와인팩토리 N1', 'bar',
  41.6955, 44.7990, '조지아 내추럴 와인 전문점. 한 잔에 3-5라리(약 1천-2천원). 와인 초보도 친절하게 설명',
  ARRAY['내추럴와인', '저렴', '초보환영'], 1, 4.5, true FROM cities WHERE name = 'Tbilisi';

-- ── 🌮 멕시코시티 (Mexico City) ──────────────────────────
INSERT INTO places_db (city_id, name, name_ko, category, latitude, longitude, local_review, tags, price_range, avg_rating, is_verified)
SELECT id, 'El Huequito', '엘 우에키토', 'restaurant',
  19.4346, -99.1408, '1959년부터 운영한 알 파스토르(돼지 타코) 원조. 타코 하나 25페소. 줄 항상 있지만 빠름',
  ARRAY['타코', '알파스토르', '저렴'], 1, 4.7, true FROM cities WHERE name = 'Mexico City'
UNION ALL
SELECT id, 'Expendio de Maíz', '엑스펜디오 데 마이스', 'restaurant',
  19.4282, -99.1547, '옥수수 기반 전통 멕시코 음식. 일요일 점심만 오픈. 현지인들의 소울 푸드',
  ARRAY['전통음식', '일요일한정', '현지인'], 2, 4.8, true FROM cities WHERE name = 'Mexico City'
UNION ALL
SELECT id, 'Café Nin', '카페 닌', 'cafe',
  19.4197, -99.1680, '콘데사 지역 인기 카페. 멕시코 싱글 오리진 커피. 아보카도 토스트 맛있음',
  ARRAY['스페셜티', '브런치', '콘데사'], 2, 4.5, false FROM cities WHERE name = 'Mexico City'
UNION ALL
SELECT id, 'La Botica Mezcalería', '라 보티카 메스칼레리아', 'bar',
  19.4270, -99.1688, '메스칼 전문 바. 작은 의자에 앉아 메스칼 한 잔. 바텐더가 영어로 설명해줌. 솔로 추천',
  ARRAY['메스칼', '솔로추천', '영어OK'], 2, 4.5, true FROM cities WHERE name = 'Mexico City'
UNION ALL
SELECT id, 'Teotihuacán Pyramids', '테오티우아칸 피라미드', 'attraction',
  19.6925, -98.8438, '시내에서 버스 1시간. 태양의 피라미드 정상에서 보는 뷰 압도적. 오전 9시 전 입장 추천',
  ARRAY['유네스코', '당일치기', '버스가능'], 2, 4.8, true FROM cities WHERE name = 'Mexico City';

-- ── 🍺 프라하 (Prague) ──────────────────────────────────
INSERT INTO places_db (city_id, name, name_ko, category, latitude, longitude, local_review, tags, price_range, avg_rating, is_verified)
SELECT id, 'Lokál Dlouhááá', '로칼 들로우하', 'bar',
  50.0883, 14.4224, '체코 정통 탱크 필스너 우르켈. 신선도가 다름. 체코 맥주 첫 경험은 여기서',
  ARRAY['탱크맥주', '체코정통', '솔로OK'], 1, 4.6, true FROM cities WHERE name = 'Prague'
UNION ALL
SELECT id, 'Eska', '에스카', 'restaurant',
  50.0889, 14.4499, '체코 현대 베이커리 레스토랑. 사워도우 빵이 예술. 혼자 브런치 먹기 좋은 카운터 자리',
  ARRAY['베이커리', '브런치', '솔로OK'], 3, 4.7, true FROM cities WHERE name = 'Prague'
UNION ALL
SELECT id, 'EMA Espresso Bar', '에마 에스프레소 바', 'cafe',
  50.0795, 14.4315, '프라하 스페셜티 커피 1위. 작고 아늑함. 아침 일찍부터 오픈',
  ARRAY['스페셜티', '아침오픈', '아늑함'], 2, 4.7, true FROM cities WHERE name = 'Prague'
UNION ALL
SELECT id, 'Letná Beer Garden', '레트나 맥주 정원', 'bar',
  50.1015, 14.4168, '레트나 공원 내 야외 맥주 정원. 블타바강 뷰. 체코 맥주 한 잔에 50코루나(약 3천원)',
  ARRAY['야외', '저렴', '강뷰'], 1, 4.5, false FROM cities WHERE name = 'Prague'
UNION ALL
SELECT id, 'Vinohrady District', '비노흐라디 지구', 'attraction',
  50.0749, 14.4430, '관광객 없는 진짜 프라하 로컬 동네. 카페와 빈티지샵 탐방 코스. 주민들 일상 엿보기',
  ARRAY['로컬동네', '카페', '산책'], 1, 4.4, false FROM cities WHERE name = 'Prague';

-- ── 🏮 하노이 (Hanoi) ───────────────────────────────────
INSERT INTO places_db (city_id, name, name_ko, category, latitude, longitude, local_review, tags, price_range, avg_rating, is_verified)
SELECT id, 'Bun Cha Huong Lien', '분짜 흐엉 리엔', 'restaurant',
  21.0267, 105.8440, '오바마가 보일러버 앤솔로니 부르댕과 먹은 그 분짜집. 메뉴에 오바마 세트 있음',
  ARRAY['분짜', '오바마단골', '유명맛집'], 1, 4.6, true FROM cities WHERE name = 'Hanoi'
UNION ALL
SELECT id, 'Cà Phê Trứng Giang', '까페 쯩 장', 'cafe',
  21.0362, 105.8524, '베트남 에그 커피 원조집. 골목 안 구석에 숨어있음. 달달하고 고소한 맛',
  ARRAY['에그커피', '원조', '인스타'], 1, 4.7, true FROM cities WHERE name = 'Hanoi'
UNION ALL
SELECT id, 'Beer Corner Ta Hien', '타히엔 맥주거리', 'bar',
  21.0345, 105.8510, '구시가지 맥주 골목. 플라스틱 의자에 앉아 하노이 비어 한 잔. 1만동(약 500원)',
  ARRAY['길거리맥주', '초저렴', '여행자거리'], 1, 4.3, false FROM cities WHERE name = 'Hanoi'
UNION ALL
SELECT id, 'Hoan Kiem Lake', '호안끼엠 호수', 'attraction',
  21.0285, 105.8522, '하노이 도심 한복판 호수. 아침 6시 현지인 태극권/줄넘기 풍경. 거북이 사원도 보기',
  ARRAY['호수', '아침산책', '무료'], 1, 4.5, false FROM cities WHERE name = 'Hanoi'
UNION ALL
SELECT id, 'Nola Kitchen', '놀라 키친', 'restaurant',
  21.0312, 105.8478, '하노이 퓨전 레스토랑 중 가장 분위기 좋음. 베트남 식재료로 만드는 창의적 요리',
  ARRAY['퓨전', '분위기', '저녁추천'], 2, 4.5, true FROM cities WHERE name = 'Hanoi';

-- ── 🦁 케이프타운 (Cape Town) ──────────────────────────
INSERT INTO places_db (city_id, name, name_ko, category, latitude, longitude, local_review, tags, price_range, avg_rating, is_verified)
SELECT id, 'The Test Kitchen', '더 테스트 키친', 'restaurant',
  -33.9258, 18.4128, '아프리카 최고 레스토랑 중 하나. 예약 3-6개월 대기. 혼자 카운터 예약이 조금 더 쉬움',
  ARRAY['파인다이닝', '예약필수', '미슐랭급'], 4, 4.9, true FROM cities WHERE name = 'Cape Town'
UNION ALL
SELECT id, 'Truth Coffee', '트루스 커피', 'cafe',
  -33.9221, 18.4176, '세계에서 가장 멋있는 카페로 선정됨. 스팀펑크 인테리어. 케이프타운 커피문화의 중심',
  ARRAY['스페셜티', '인테리어맛집', '인스타'], 2, 4.5, true FROM cities WHERE name = 'Cape Town'
UNION ALL
SELECT id, 'Boulders Beach Penguin Colony', '볼더스 비치 펭귄', 'attraction',
  -34.1968, 18.4521, '케이프타운 당일치기 코스 필수. 아프리카 펭귄들이랑 수영 가능. 왕복 버스 있음',
  ARRAY['펭귄', '당일치기', '자연'], 2, 4.8, true FROM cities WHERE name = 'Cape Town'
UNION ALL
SELECT id, 'Camps Bay Beach', '캠프스 베이 해변', 'attraction',
  -33.9489, 18.3773, '테이블마운틴을 배경으로 한 아름다운 해변. 일몰 무조건 여기서. 물은 차가움',
  ARRAY['해변', '일몰', '테이블마운틴뷰'], 1, 4.6, false FROM cities WHERE name = 'Cape Town'
UNION ALL
SELECT id, 'The Gin Bar', '더 진 바', 'bar',
  -33.9245, 18.4186, '남아공산 크래프트 진 전문점. 진 토닉만 20종류 이상. 솔로 여행자가 바텐더랑 얘기하기 좋음',
  ARRAY['크래프트진', '솔로추천', '영어OK'], 3, 4.5, true FROM cities WHERE name = 'Cape Town';

-- ── ⛩️ 교토 (Kyoto) ──────────────────────────────────────
INSERT INTO places_db (city_id, name, name_ko, category, latitude, longitude, local_review, tags, price_range, avg_rating, is_verified)
SELECT id, 'Nishiki Market', '니시키 시장', 'attraction',
  35.0048, 135.7657, '교토의 부엌. 400년 역사의 시장 골목. 타코야끼, 두부 도넛, 절임 반찬 시식',
  ARRAY['시장', '먹거리', '역사'], 1, 4.5, true FROM cities WHERE name = 'Kyoto'
UNION ALL
SELECT id, 'Fushimi Inari Taisha', '후시미 이나리 신사', 'attraction',
  34.9671, 135.7727, '수천 개 도리이 문 트레킹. 새벽 5-7시에 가면 인파 없이 신비로운 분위기 경험',
  ARRAY['신사', '새벽추천', '트레킹'], 1, 4.8, true FROM cities WHERE name = 'Kyoto'
UNION ALL
SELECT id, 'Weekenders Coffee', '위켄더스 커피', 'cafe',
  35.0066, 135.7576, '교토 스페셜티 커피 대표 카페. 깔끔한 공간. 1인 카운터 자리에서 마치는 커피 시간',
  ARRAY['스페셜티', '1인추천', '조용함'], 2, 4.6, true FROM cities WHERE name = 'Kyoto'
UNION ALL
SELECT id, 'Pontocho Alley', '폰토초 골목', 'restaurant',
  35.0072, 135.7716, '가모가와 강변 좁은 골목. 저녁에 야외석에서 강 보며 먹는 가이세키 요리. 예산 5천엔대도 있음',
  ARRAY['골목', '가와유카', '저녁'], 3, 4.6, false FROM cities WHERE name = 'Kyoto'
UNION ALL
SELECT id, 'Bar K6', '바 K6', 'bar',
  35.0061, 135.7732, '기온 골목 조용한 위스키 바. 마스터가 영어 가능. 혼자 가서 교토 이야기 듣기 좋음',
  ARRAY['위스키바', '솔로추천', '영어OK'], 3, 4.5, true FROM cities WHERE name = 'Kyoto';

-- ── 🏛️ 아테네 (Athens) ──────────────────────────────────
INSERT INTO places_db (city_id, name, name_ko, category, latitude, longitude, local_review, tags, price_range, avg_rating, is_verified)
SELECT id, 'Monastiraki Flea Market', '모나스티라키 벼룩시장', 'attraction',
  37.9755, 23.7236, '아크로폴리스 아래 벼룩시장. 일요일이 가장 크게 열림. 빈티지 그리스 소품 쇼핑',
  ARRAY['벼룩시장', '일요일추천', '쇼핑'], 1, 4.4, false FROM cities WHERE name = 'Athens'
UNION ALL
SELECT id, 'To Kafeneio tou Psyrri', '프시리 카페네이오', 'cafe',
  37.9791, 23.7231, '프시리 지역 전통 그리스 카페. 프라페(아이스 인스턴트 커피)가 그리스 경험. 현지 노인들과 함께',
  ARRAY['전통카페', '현지경험', '프라페'], 1, 4.3, false FROM cities WHERE name = 'Athens'
UNION ALL
SELECT id, 'Diporto', '디포르토', 'restaurant',
  37.9796, 23.7268, '지하 타베르나. 메뉴판 없음. 주인이 오늘 있는 것 알려줌. 현지인들의 점심 성지',
  ARRAY['타베르나', '현지인성지', '점심'], 2, 4.7, true FROM cities WHERE name = 'Athens'
UNION ALL
SELECT id, 'Six D.O.G.S', '식스독스', 'bar',
  37.9786, 23.7256, '아테네 최고의 야외 바. 여름밤 야외 정원에서 그리스 맥주 한 잔. 음악 항상 좋음',
  ARRAY['야외바', '여름추천', '음악'], 2, 4.5, true FROM cities WHERE name = 'Athens'
UNION ALL
SELECT id, 'Acropolis at Sunset', '아크로폴리스 일몰', 'attraction',
  37.9715, 23.7267, '폐장 1시간 전 입장하면 일몰과 조명 켜지는 순간 동시에. 인원 줄어서 여유롭게 관람 가능',
  ARRAY['유네스코', '일몰추천', '버킷리스트'], 2, 4.9, true FROM cities WHERE name = 'Athens';

-- ── 🎸 베를린 (Berlin) ──────────────────────────────────
INSERT INTO places_db (city_id, name, name_ko, category, latitude, longitude, local_review, tags, price_range, avg_rating, is_verified)
SELECT id, 'Mustafa''s Gemüse Kebap', '무스타파스 케밥', 'restaurant',
  52.4982, 13.3913, '베를린 케밥 줄 서기 성지. 1-2시간 줄 서지만 값어치 있음. 구운 채소 케밥이 특징',
  ARRAY['케밥', '줄서도OK', '저렴'], 1, 4.6, true FROM cities WHERE name = 'Berlin'
UNION ALL
SELECT id, 'Berghain', '베르그하인', 'bar',
  52.5117, 13.4440, '세계 최고 클럽. 입장 거절률 50% 이상. 검정 옷 입고 혼자 가면 입장 확률 올라감. 토-월 오픈',
  ARRAY['클럽', '하우스테크노', '드레스코드'], 2, 4.5, true FROM cities WHERE name = 'Berlin'
UNION ALL
SELECT id, 'The Barn Coffee', '더 반 커피', 'cafe',
  52.5247, 13.4033, '베를린 스페셜티 커피 아버지. 미니멀한 공간. 커피만 파는 퓨리스트 카페',
  ARRAY['스페셜티', '미니멀', '커피퓨리스트'], 2, 4.7, true FROM cities WHERE name = 'Berlin'
UNION ALL
SELECT id, 'East Side Gallery', '이스트 사이드 갤러리', 'attraction',
  52.5050, 13.4399, '베를린 장벽 1.3km 야외 갤러리. 24시간 무료. 아침 일찍 가면 사진 잘 찍힘',
  ARRAY['베를린장벽', '무료', '24시간'], 1, 4.6, true FROM cities WHERE name = 'Berlin'
UNION ALL
SELECT id, 'Markthalle Neun', '마르크트할레 노이', 'restaurant',
  52.4993, 13.4213, '목요일 스트리트 푸드 시장이 특히 좋음. 다양한 문화의 음식들. 크로이츠베르크 지역 탐험과 함께',
  ARRAY['푸드시장', '목요일추천', '크로이츠베르크'], 2, 4.5, false FROM cities WHERE name = 'Berlin';

-- ── 🏙️ 쿠알라룸푸르 (Kuala Lumpur) ───────────────────────
INSERT INTO places_db (city_id, name, name_ko, category, latitude, longitude, local_review, tags, price_range, avg_rating, is_verified)
SELECT id, 'Jalan Alor', '잘란 알로르', 'restaurant',
  3.1453, 101.7077, 'KL 최대 야외 먹자 골목. 저녁 6시부터 활기. 볶음 국수, 사테, 두리안까지 다 있음',
  ARRAY['야외먹자골목', '저녁', '다양'], 1, 4.5, true FROM cities WHERE name = 'Kuala Lumpur'
UNION ALL
SELECT id, 'VCR Cafe', 'VCR 카페', 'cafe',
  3.1485, 101.7129, 'KL 힙스터 카페 원조. 버릭트 지역. 에그 베네딕트 맛있고 커피도 훌륭',
  ARRAY['카페', '브런치', '힙스터'], 2, 4.5, true FROM cities WHERE name = 'Kuala Lumpur'
UNION ALL
SELECT id, 'Petronas Twin Towers', '페트로나스 트윈타워', 'attraction',
  3.1579, 101.7116, 'KL 상징. 무료 스카이브리지 티켓은 아침 일찍 현장 선착순. 야경은 KLCC 공원에서',
  ARRAY['랜드마크', '야경', '무료공원'], 1, 4.7, true FROM cities WHERE name = 'Kuala Lumpur'
UNION ALL
SELECT id, 'PS150', 'PS150', 'bar',
  3.1456, 101.6961, '차이나타운 페탈링 스트리트 옆 칵테일 바. 아시안 재료로 만드는 창의적 칵테일',
  ARRAY['칵테일', '차이나타운', '창의적'], 2, 4.6, true FROM cities WHERE name = 'Kuala Lumpur'
UNION ALL
SELECT id, 'Batu Caves', '바투 동굴', 'attraction',
  3.2379, 101.6840, 'KL 북쪽 30분. 272개 계단 올라가는 힌두 성지. 원숭이 소매치기 주의. 이른 아침 추천',
  ARRAY['힌두성지', '당일치기', '계단'], 1, 4.6, false FROM cities WHERE name = 'Kuala Lumpur';

-- ── 🍊 포르투 (Porto) ──────────────────────────────────
INSERT INTO places_db (city_id, name, name_ko, category, latitude, longitude, local_review, tags, price_range, avg_rating, is_verified)
SELECT id, 'Conga', '콩가', 'restaurant',
  41.1448, -8.6143, '포르투 프란세시냐(치즈소스 샌드위치) 최고봉. 현지인 줄 항상 있음. 에르밀링 섞어 마시기',
  ARRAY['프란세시냐', '현지인맛집', '포르투음식'], 2, 4.7, true FROM cities WHERE name = 'Porto'
UNION ALL
SELECT id, 'Livraria Lello', '리브라리아 렐루', 'attraction',
  41.1470, -8.6147, '세계에서 가장 아름다운 서점 중 하나. 해리포터 호그와트 모델. 티켓 5유로(책 구매시 환불)',
  ARRAY['서점', '해리포터', '건축'], 1, 4.6, true FROM cities WHERE name = 'Porto'
UNION ALL
SELECT id, 'Moustache', '무스타슈', 'cafe',
  41.1494, -8.6148, '포르투 스페셜티 커피 대표 카페. 파스텔 드 나타와 함께. 혼자 오는 사람 많음',
  ARRAY['스페셜티', '파스텔드나타', '솔로OK'], 2, 4.6, true FROM cities WHERE name = 'Porto'
UNION ALL
SELECT id, 'Graham''s Port Lodge', '그레이엄 포트 로지', 'bar',
  41.1381, -8.6218, '포르투 와인(포트 와인) 와이너리 투어+시음. 도루강 뷰 테라스에서 마시는 루비 포트',
  ARRAY['포트와인', '와이너리', '도루강뷰'], 2, 4.7, true FROM cities WHERE name = 'Porto'
UNION ALL
SELECT id, 'Ribeira Square', '히베이라 광장', 'attraction',
  41.1404, -8.6149, '포르투 구시가 강변 광장. 저녁 노을 때 도루강과 동 루이스 다리 뷰가 최고. 무료',
  ARRAY['강변', '일몰', '무료'], 1, 4.7, false FROM cities WHERE name = 'Porto';

-- ── 🌸 서울 (Seoul) ──────────────────────────────────────
INSERT INTO places_db (city_id, name, name_ko, category, latitude, longitude, local_review, tags, price_range, avg_rating, is_verified)
SELECT id, 'Gwangjang Market', '광장시장', 'restaurant',
  37.5702, 126.9997, '서울 최대 전통시장. 마약김밥, 빈대떡, 순대 골목. 현금 준비 필수. 저녁보다 점심이 덜 붐빔',
  ARRAY['전통시장', '길거리음식', '현금'], 1, 4.6, true FROM cities WHERE name = 'Seoul'
UNION ALL
SELECT id, 'Fritz Coffee Company', '프리츠 커피 컴퍼니', 'cafe',
  37.5400, 126.9952, '서울 스페셜티 커피 1위. 도원점 항상 줄 서있음. 마들렌도 같이 먹어야 완성',
  ARRAY['스페셜티', '줄서도OK', '마들렌'], 2, 4.8, true FROM cities WHERE name = 'Seoul'
UNION ALL
SELECT id, 'Ikseon-dong Hanok Village', '익선동 한옥마을', 'attraction',
  37.5742, 126.9985, '한옥을 개조한 카페와 음식점 골목. 인스타 포토스팟. 주중 낮이 그나마 덜 붐빔',
  ARRAY['한옥', '포토스팟', '카페골목'], 2, 4.4, false FROM cities WHERE name = 'Seoul'
UNION ALL
SELECT id, 'Namsangol Hanok Village Bar', '경리단길 루프탑', 'bar',
  37.5433, 126.9923, '이태원 경리단길 루프탑 바들. 서울 야경과 남산타워 뷰. 외국인 친화적',
  ARRAY['루프탑', '야경', '외국인많음'], 2, 4.3, false FROM cities WHERE name = 'Seoul'
UNION ALL
SELECT id, 'Gyeongbokgung Palace', '경복궁', 'attraction',
  37.5796, 126.9770, '서울 대표 궁궐. 수문장 교대식 오전 10시/오후 2시. 한복 대여하면 무료 입장',
  ARRAY['궁궐', '한복무료', '역사'], 1, 4.7, true FROM cities WHERE name = 'Seoul';
