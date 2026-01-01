import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { WordCategory } from "@/hooks/useGame";

type GameStatus = "lobby" | "in_progress";
type GameMode = "normal" | "anonymous";

export interface Room {
  id: string;
  code: string;
  host_player_id: string;
  status: GameStatus;
  round_number: number;
  word: string | null;
  impostor_word: string | null;
  num_impostors: number;
  game_mode: GameMode;
  starting_player_id: string | null;
  word_category: WordCategory | null;
}

export const useRoomQuery = (code: string | undefined) => {
  return useQuery({
    queryKey: ["room", code],
    queryFn: async () => {
      if (!code) return null;

      const { data, error } = await supabase
        .from("rooms")
        .select("*")
        .eq("code", code.toUpperCase())
        .maybeSingle();

      if (error) {
        console.error("Error fetching room:", error);
        throw error;
      }

      if (!data) {
        return null;
      }

      return data as Room;
    },
    enabled: !!code,
    refetchInterval: 1000, // Poll every 1 second
    staleTime: 0, // Always consider data stale to ensure fresh data
  });
};

