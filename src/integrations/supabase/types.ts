export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      players: {
        Row: {
          id: string
          is_host: boolean
          joined_at: string
          last_seen: string
          name: string
          room_id: string
        }
        Insert: {
          id?: string
          is_host?: boolean
          joined_at?: string
          last_seen?: string
          name: string
          room_id: string
        }
        Update: {
          id?: string
          is_host?: boolean
          joined_at?: string
          last_seen?: string
          name?: string
          room_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "players_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          }
        ]
      }
      player_words: {
        Row: {
          room_id: string
          round_number: number
          player_id: string
          word: string
          is_impostor: boolean
        }
        Insert: {
          room_id: string
          round_number: number
          player_id: string
          word: string
          is_impostor?: boolean
        }
        Update: {
          room_id?: string
          round_number?: number
          player_id?: string
          word?: string
          is_impostor?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "player_words_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_words_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          }
        ]
      }
      rooms: {
        Row: {
          id: string
          code: string
          host_player_id: string | null
          status: "lobby" | "in_progress"
          round_number: number
          word: string | null
          impostor_word: string | null
          created_at: string
        }
        Insert: {
          id?: string
          code: string
          host_player_id?: string | null
          status?: "lobby" | "in_progress"
          round_number?: number
          word?: string | null
          impostor_word?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          code?: string
          host_player_id?: string | null
          status?: "lobby" | "in_progress"
          round_number?: number
          word?: string | null
          impostor_word?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_host_player"
            columns: ["host_player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Functions: {
      create_room: {
        Args: {
          player_name: string
        }
        Returns: Json
      }
      join_room: {
        Args: {
          room_code: string
          player_name: string
        }
        Returns: Json
      }
      start_game: {
        Args: {
          p_room_id: string
          p_host_player_id: string
        }
        Returns: Json
      }
      reset_game: {
        Args: {
          p_room_id: string
          p_host_player_id: string
        }
        Returns: Json
      }
    }
  }
}

