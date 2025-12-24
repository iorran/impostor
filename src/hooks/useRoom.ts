import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Generate unique 4-char room code
const generateRoomCode = (): string => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "";
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export const useRoom = () => {
  const [isLoading, setIsLoading] = useState(false);

  const createRoom = useCallback(async (playerName: string) => {
    setIsLoading(true);
    
    try {
      // Generate unique room code
      let roomCode: string;
      let attempts = 0;
      do {
        roomCode = generateRoomCode();
        const { data } = await supabase
          .from("rooms")
          .select("id")
          .eq("code", roomCode)
          .maybeSingle();
        
        if (!data) break;
        attempts++;
        if (attempts > 100) {
          throw new Error("Could not generate unique room code");
        }
      } while (true);

      // Create room
      const { data: roomData, error: roomError } = await supabase
        .from("rooms")
        .insert({ code: roomCode })
        .select()
        .single();

      if (roomError) throw roomError;
      if (!roomData) throw new Error("Failed to create room");

      // Create host player
      const { data: playerData, error: playerError } = await supabase
        .from("players")
        .insert({
          room_id: roomData.id,
          name: playerName.trim(),
          is_host: true,
        })
        .select()
        .single();

      if (playerError) throw playerError;
      if (!playerData) throw new Error("Failed to create player");

      // Update room with host
      const { error: updateError } = await supabase
        .from("rooms")
        .update({ host_player_id: playerData.id })
        .eq("id", roomData.id);

      if (updateError) throw updateError;

      // Store in localStorage
      localStorage.setItem("playerName", playerName.trim());
      localStorage.setItem("playerId", playerData.id);
      localStorage.setItem("roomId", roomData.id);

      return {
        roomId: roomData.id,
        roomCode: roomData.code,
        playerId: playerData.id,
      };
    } catch (error: any) {
      console.error("Error creating room:", error);
      toast.error(error.message || "Erro ao criar sala");
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const joinRoom = useCallback(async (roomCode: string, playerName: string) => {
    setIsLoading(true);

    try {
      // Find room
      const { data: roomData, error: roomError } = await supabase
        .from("rooms")
        .select("*")
        .eq("code", roomCode.toUpperCase())
        .maybeSingle();

      if (roomError) throw roomError;
      if (!roomData) {
        throw new Error("Room not found");
      }

      // Create player
      const { data: playerData, error: playerError } = await supabase
        .from("players")
        .insert({
          room_id: roomData.id,
          name: playerName.trim(),
          is_host: false,
        })
        .select()
        .single();

      if (playerError) throw playerError;
      if (!playerData) throw new Error("Failed to create player");

      // Store in localStorage
      localStorage.setItem("playerName", playerName.trim());
      localStorage.setItem("playerId", playerData.id);
      localStorage.setItem("roomId", roomData.id);

      return {
        roomId: roomData.id,
        roomCode: roomData.code,
        playerId: playerData.id,
      };
    } catch (error: any) {
      console.error("Error joining room:", error);
      toast.error(error.message || "Erro ao entrar na sala");
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    createRoom,
    joinRoom,
    isLoading,
  };
};

