// Supabase 테이블 타입 정의
// 실제 배포 시 `npx supabase gen types typescript` 로 자동 생성 가능

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          nickname: string;
          avatar_url: string | null;
          home_country: string | null;
          languages: string[];
          current_city_id: string | null;
          status_signal: string | null;
          signal_emoji: string | null;
          signal_expires_at: string | null;
          last_seen_at: string;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["profiles"]["Row"], "created_at" | "last_seen_at"> & {
          last_seen_at?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
      };
      cities: {
        Row: {
          id: string;
          name: string;
          name_ko: string | null;
          country: string;
          timezone: string;
          emoji: string | null;
          active_count: number;
        };
        Insert: Omit<Database["public"]["Tables"]["cities"]["Row"], "active_count"> & {
          active_count?: number;
        };
        Update: Partial<Database["public"]["Tables"]["cities"]["Insert"]>;
      };
      lounges: {
        Row: {
          id: string;
          city_id: string;
          type: "public" | "group";
        };
        Insert: Omit<Database["public"]["Tables"]["lounges"]["Row"], "type"> & {
          type?: "public" | "group";
        };
        Update: Partial<Database["public"]["Tables"]["lounges"]["Insert"]>;
      };
      messages: {
        Row: {
          id: string;
          lounge_id: string;
          user_id: string;
          content: string;
          lang: string;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["messages"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["messages"]["Insert"]>;
      };
      message_translations: {
        Row: {
          id: string;
          message_id: string;
          target_lang: string;
          content: string;
        };
        Insert: Omit<Database["public"]["Tables"]["message_translations"]["Row"], "id"> & {
          id?: string;
        };
        Update: Partial<Database["public"]["Tables"]["message_translations"]["Insert"]>;
      };
    };
  };
}

// 편의 타입 alias
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type City = Database["public"]["Tables"]["cities"]["Row"];
export type Lounge = Database["public"]["Tables"]["lounges"]["Row"];
export type Message = Database["public"]["Tables"]["messages"]["Row"];
export type MessageWithProfile = Message & { profiles: Pick<Profile, "nickname" | "avatar_url" | "home_country" | "status_signal" | "signal_emoji"> };
