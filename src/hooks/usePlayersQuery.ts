import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Player {
  id: string;
  name: string;
  is_host: boolean;
  joined_at?: string;
  room_id?: string;
}

export const usePlayersQuery = (roomId: string | undefined) => {
  return useQuery({
    queryKey: ["players", roomId],
    queryFn: async () => {
      if (!roomId) return [];

      const { data, error } = await supabase
        .from("players")
        .select("*")
        .eq("room_id", roomId)
        .order("joined_at", { ascending: true });

      if (error) {
        console.error("Error fetching players:", error);
        throw error;
      }

      return (data || []) as Player[];
    },
    enabled: !!roomId,
    refetchInterval: 1000, // Poll every 1 second
    staleTime: 0, // Always consider data stale to ensure fresh data
  });
};

