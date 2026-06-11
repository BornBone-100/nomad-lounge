// Supabase 테이블 타입 정의

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string; nickname: string; avatar_url: string | null;
          home_country: string | null; languages: string[];
          current_city_id: string | null; status_signal: string | null;
          signal_emoji: string | null; signal_expires_at: string | null;
          signal_lat: number | null; signal_lng: number | null;
          signal_place_id: string | null; last_seen_at: string; created_at: string;
          bio: string | null; travel_style_tags: string[]; visited_countries: string[];
          check_in_date: string | null; check_out_date: string | null;
          hobbies: string[]; manner_temperature: number;
          is_verified: boolean; status: string;
          latitude: number | null; longitude: number | null;
        };
        Insert: Omit<Database["public"]["Tables"]["profiles"]["Row"], "created_at" | "last_seen_at"> & { last_seen_at?: string; created_at?: string };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
      };
      cities: {
        Row: { id: string; name: string; name_ko: string | null; country: string; timezone: string; emoji: string | null; active_count: number; latitude: number | null; longitude: number | null };
        Insert: Omit<Database["public"]["Tables"]["cities"]["Row"], "active_count"> & { active_count?: number };
        Update: Partial<Database["public"]["Tables"]["cities"]["Insert"]>;
      };
      lounges: {
        Row: { id: string; city_id: string; type: "public" | "group" };
        Insert: Omit<Database["public"]["Tables"]["lounges"]["Row"], "type"> & { type?: "public" | "group" };
        Update: Partial<Database["public"]["Tables"]["lounges"]["Insert"]>;
      };
      messages: {
        Row: { id: string; lounge_id: string; user_id: string; content: string; lang: string; created_at: string };
        Insert: Omit<Database["public"]["Tables"]["messages"]["Row"], "id" | "created_at"> & { id?: string; created_at?: string };
        Update: Partial<Database["public"]["Tables"]["messages"]["Insert"]>;
      };
      message_translations: {
        Row: { id: string; message_id: string; target_lang: string; content: string };
        Insert: Omit<Database["public"]["Tables"]["message_translations"]["Row"], "id"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["message_translations"]["Insert"]>;
      };
      places_db: {
        Row: { id: string; city_id: string | null; name: string; name_ko: string | null; category: PlaceCategory; latitude: number; longitude: number; address: string | null; local_review: string | null; tags: string[]; price_range: number; avg_rating: number; review_count: number; is_verified: boolean; verified_by: string | null; photos: string[]; google_place_id: string | null; created_at: string };
        Insert: Omit<Database["public"]["Tables"]["places_db"]["Row"], "id" | "created_at" | "avg_rating" | "review_count"> & { id?: string; created_at?: string; avg_rating?: number; review_count?: number };
        Update: Partial<Database["public"]["Tables"]["places_db"]["Insert"]>;
      };
      user_signals: {
        Row: { id: string; user_id: string; city_id: string | null; content: string; emoji: string; latitude: number | null; longitude: number | null; place_id: string | null; expires_at: string; created_at: string };
        Insert: Omit<Database["public"]["Tables"]["user_signals"]["Row"], "id" | "created_at"> & { id?: string; created_at?: string };
        Update: Partial<Database["public"]["Tables"]["user_signals"]["Insert"]>;
      };
      squads: {
        Row: { id: string; city_id: string | null; name: string; hobby_tag: string; emoji: string; description: string | null; member_count: number; lounge_id: string | null; created_at: string };
        Insert: Omit<Database["public"]["Tables"]["squads"]["Row"], "id" | "created_at" | "member_count"> & { id?: string; created_at?: string; member_count?: number };
        Update: Partial<Database["public"]["Tables"]["squads"]["Insert"]>;
      };
      squad_members: {
        Row: { squad_id: string; user_id: string; joined_at: string };
        Insert: Omit<Database["public"]["Tables"]["squad_members"]["Row"], "joined_at"> & { joined_at?: string };
        Update: Partial<Database["public"]["Tables"]["squad_members"]["Insert"]>;
      };
      place_meetups: {
        Row: { id: string; place_id: string; organizer_id: string; city_id: string | null; title: string; meet_at: string; max_members: number; current_members: number; status: "open" | "full" | "closed"; created_at: string };
        Insert: Omit<Database["public"]["Tables"]["place_meetups"]["Row"], "id" | "created_at" | "current_members"> & { id?: string; created_at?: string; current_members?: number };
        Update: Partial<Database["public"]["Tables"]["place_meetups"]["Insert"]>;
      };
      place_meetup_members: {
        Row: { meetup_id: string; user_id: string; joined_at: string };
        Insert: Omit<Database["public"]["Tables"]["place_meetup_members"]["Row"], "joined_at"> & { joined_at?: string };
        Update: Partial<Database["public"]["Tables"]["place_meetup_members"]["Insert"]>;
      };
    };
  };
}

export type Profile            = Database["public"]["Tables"]["profiles"]["Row"];
export type City               = Database["public"]["Tables"]["cities"]["Row"];
export type Lounge             = Database["public"]["Tables"]["lounges"]["Row"];
export type Message            = Database["public"]["Tables"]["messages"]["Row"];
export type Place              = Database["public"]["Tables"]["places_db"]["Row"];
export type UserSignal         = Database["public"]["Tables"]["user_signals"]["Row"];
export type Squad              = Database["public"]["Tables"]["squads"]["Row"];
export type PlaceMeetup        = Database["public"]["Tables"]["place_meetups"]["Row"];
export type PlaceCategory      = "restaurant" | "cafe" | "bar" | "activity" | "attraction";

export type MessageWithProfile = Message & {
  profiles: Pick<Profile, "nickname" | "avatar_url" | "home_country" | "status_signal" | "signal_emoji">;
};
export type UserSignalWithProfile = UserSignal & {
  profiles: Pick<Profile, "nickname" | "avatar_url" | "home_country" | "hobbies" | "manner_temperature" | "is_verified">;
  places_db?: Pick<Place, "name" | "name_ko" | "category"> | null;
};
export type PlaceWithMeetups    = Place & { place_meetups?: PlaceMeetup[] };
export type SquadWithMembership = Squad & { is_member?: boolean };

export const CITY_HOBBY_TAGS: Record<string, { tag: string; emoji: string; label: string }[]> = {
  bali:    [{ tag: "surfing",      emoji: "🏄", label: "서핑"       }, { tag: "yoga",         emoji: "🧘", label: "요가"       }, { tag: "scooter",  emoji: "🛵", label: "스쿠터"     }],
  bangkok: [{ tag: "street_food",  emoji: "🍜", label: "길거리음식" }, { tag: "temple",       emoji: "⛩️", label: "사원투어"   }, { tag: "nightlife",emoji: "🌙", label: "나이트라이프"}],
  paris:   [{ tag: "museum",       emoji: "🎨", label: "미술관투어" }, { tag: "wine_tasting", emoji: "🍷", label: "와인테이스팅"}, { tag: "photography",emoji: "📸", label: "사진투어"}],
  tokyo:   [{ tag: "ramen_tour",   emoji: "🍜", label: "라멘투어"   }, { tag: "anime",        emoji: "🎌", label: "오타쿠투어" }, { tag: "hiking",   emoji: "🗻", label: "하이킹"     }],
  default: [{ tag: "food_tour",    emoji: "🍽️", label: "맛집투어"   }, { tag: "photography",  emoji: "📸", label: "사진"       }, { tag: "hiking",   emoji: "🥾", label: "하이킹"     }],
};

export const PLACE_CATEGORY_META: Record<PlaceCategory, { label: string; emoji: string; color: string }> = {
  restaurant: { label: "맛집",    emoji: "🍜", color: "text-orange-600 bg-orange-50" },
  cafe:       { label: "카페",    emoji: "☕", color: "text-amber-600  bg-amber-50"  },
  bar:        { label: "바/펍",   emoji: "🍺", color: "text-blue-600   bg-blue-50"   },
  activity:   { label: "액티비티", emoji: "🏄", color: "text-green-600  bg-green-50"  },
  attraction: { label: "명소",    emoji: "📸", color: "text-violet-600 bg-violet-50" },
};
