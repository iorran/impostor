import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface PlayerWord {
  player_id: string;
  word: string;
  is_impostor: boolean;
  round_number: number;
}

export const usePlayerWordQuery = (
  roomId: string | undefined,
  playerId: string | undefined,
  roundNumber: number | undefined
) => {
  return useQuery({
    queryKey: ["playerWord", roomId, playerId, roundNumber],
    queryFn: async () => {
      if (!roomId || !playerId || roundNumber === undefined || roundNumber === 0) {
        return null;
      }

      const { data, error } = await supabase
        .from("player_words")
        .select("word, is_impostor, round_number")
        .eq("room_id", roomId)
        .eq("player_id", playerId)
        .eq("round_number", roundNumber)
        .maybeSingle();

      if (error) {
        console.error("Error fetching player word:", error);
        throw error;
      }

      if (!data) {
        return null;
      }

      return {
        word: data.word,
        is_impostor: data.is_impostor,
        round_number: data.round_number,
      } as PlayerWord;
    },
    enabled: !!roomId && !!playerId && roundNumber !== undefined && roundNumber > 0,
    refetchInterval: (query) => {
      // Only poll if we don't have a word yet
      return query.state.data === null ? 500 : false; // Poll every 500ms if no word, stop if we have it
    },
    staleTime: 0,
  });
};

