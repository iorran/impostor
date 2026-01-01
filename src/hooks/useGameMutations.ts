import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { WordCategory } from "@/hooks/useGame";

interface WordPair {
  id: string;
  crewmate_word: string;
  impostor_word: string;
  category: string;
}

const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export const useGameMutations = () => {
  const queryClient = useQueryClient();

  const startGame = useMutation({
    mutationFn: async ({
      roomId,
      hostPlayerId,
      numImpostors,
    }: {
      roomId: string;
      hostPlayerId: string;
      numImpostors: number;
    }) => {
      // Get room
      const { data: roomData, error: roomError } = await supabase
        .from("rooms")
        .select("*")
        .eq("id", roomId)
        .single();

      if (roomError) throw roomError;
      if (!roomData) throw new Error("Room not found");

      // Verify host
      if (roomData.host_player_id !== hostPlayerId) {
        throw new Error("Only host can start the game");
      }

      // Get all players
      const { data: playersData, error: playersError } = await supabase
        .from("players")
        .select("*")
        .eq("room_id", roomId);

      if (playersError) throw playersError;
      if (!playersData || playersData.length < 3) {
        throw new Error("Not enough players. Need at least 3 players");
      }

      // Validate number of impostors
      if (numImpostors < 1) {
        throw new Error("Number of impostors must be at least 1");
      }
      if (numImpostors >= playersData.length) {
        throw new Error(
          "Number of impostors must be less than number of players"
        );
      }

      // Generate words from database, avoiding duplicates from last 30 rounds
      const category = (roomData.word_category as WordCategory) || 'all';
      
      // Get word pairs from database
      let wordPairsQuery = supabase
        .from('word_pairs')
        .select('id, crewmate_word, impostor_word, category');
      
      // Filter by category if not 'all'
      if (category !== 'all') {
        wordPairsQuery = wordPairsQuery.eq('category', category);
      }
      
      const { data: allWordPairs, error: wordPairsError } = await wordPairsQuery;
      
      if (wordPairsError || !allWordPairs || allWordPairs.length === 0) {
        throw new Error("Erro ao buscar palavras do banco de dados");
      }
      
      // Get history of used word pairs for this room (last 30 rounds)
      const { data: wordHistory } = await supabase
        .from('room_word_history')
        .select('word_pair_id')
        .eq('room_id', roomId)
        .order('round_number', { ascending: false })
        .limit(30);
      
      const usedWordPairIds = new Set(
        wordHistory?.map(h => h.word_pair_id) || []
      );
      
      // Filter out used word pairs
      const availableWordPairs = allWordPairs.filter(
        wp => !usedWordPairIds.has(wp.id)
      );
      
      // If no available pairs (all have been used), use all pairs
      const wordPairsToChooseFrom = availableWordPairs.length > 0 
        ? availableWordPairs 
        : allWordPairs;
      
      // Randomly select a word pair
      const randomIndex = Math.floor(Math.random() * wordPairsToChooseFrom.length);
      const selectedWordPair = wordPairsToChooseFrom[randomIndex];
      
      const crewmateWord = selectedWordPair.crewmate_word;
      const impostorWord = selectedWordPair.impostor_word;
      const wordPairId = selectedWordPair.id;

      // Shuffle players and select impostors
      const shuffledPlayers = shuffleArray(playersData);
      const impostorIndices = new Set<number>();
      
      const indices = Array.from({ length: shuffledPlayers.length }, (_, i) => i);
      const shuffledIndices = shuffleArray(indices);
      
      for (let i = 0; i < numImpostors && i < shuffledIndices.length; i++) {
        impostorIndices.add(shuffledIndices[i]);
      }

      const newRoundNumber = roomData.round_number + 1;
      const startingPlayerIndex = Math.floor(Math.random() * shuffledPlayers.length);
      const startingPlayer = shuffledPlayers[startingPlayerIndex];

      // Clear ALL old words for this room
      await supabase
        .from("player_words")
        .delete()
        .eq("room_id", roomId);

      // Assign words to ALL current players
      const playerWords = shuffledPlayers.map((player, index) => ({
        room_id: roomId,
        round_number: newRoundNumber,
        player_id: player.id,
        word: impostorIndices.has(index) ? impostorWord : crewmateWord,
        is_impostor: impostorIndices.has(index),
      }));

      // Verify no duplicates
      const playerIds = new Set(playerWords.map(pw => pw.player_id));
      if (playerIds.size !== playerWords.length) {
        throw new Error("Duplicate players detected in word assignment");
      }

      // Check for existing words
      const { data: existingWords } = await supabase
        .from("player_words")
        .select("player_id")
        .eq("room_id", roomId)
        .eq("round_number", newRoundNumber);

      if (existingWords && existingWords.length > 0) {
        await supabase
          .from("player_words")
          .delete()
          .eq("room_id", roomId)
          .eq("round_number", newRoundNumber);
      }

      const { error: wordsError } = await supabase
        .from("player_words")
        .insert(playerWords);

      if (wordsError) {
        console.error("Error inserting player words:", wordsError);
        throw wordsError;
      }

      // Update room AFTER words are inserted
      const { error: updateError } = await supabase
        .from("rooms")
        .update({
          status: "in_progress",
          round_number: newRoundNumber,
          word: crewmateWord,
          impostor_word: impostorWord,
          num_impostors: numImpostors,
          starting_player_id: startingPlayer.id,
        })
        .eq("id", roomId);

      if (updateError) throw updateError;

      // Record word pair usage in history
      await supabase
        .from('room_word_history')
        .insert({
          room_id: roomId,
          round_number: newRoundNumber,
          word_pair_id: wordPairId,
        });

      // Cleanup old history entries (keep only last 30 rounds)
      await supabase.rpc('cleanup_old_word_history');

      return { success: true, roundNumber: newRoundNumber };
    },
    onSuccess: (_, variables) => {
      // Invalidate queries to refetch fresh data
      queryClient.invalidateQueries({ queryKey: ["room"] });
      queryClient.invalidateQueries({ queryKey: ["players", variables.roomId] });
      queryClient.invalidateQueries({ queryKey: ["playerWord"] });
      toast.success("Partida iniciada!");
    },
    onError: (error: any) => {
      console.error("Error starting game:", error);
      toast.error(error.message || "Erro ao iniciar partida");
    },
  });

  const resetGame = useMutation({
    mutationFn: async ({
      roomId,
      hostPlayerId,
    }: {
      roomId: string;
      hostPlayerId: string;
    }) => {
      // Get room
      const { data: roomData, error: roomError } = await supabase
        .from("rooms")
        .select("*")
        .eq("id", roomId)
        .single();

      if (roomError) throw roomError;
      if (!roomData) throw new Error("Room not found");

      // Verify host
      if (roomData.host_player_id !== hostPlayerId) {
        throw new Error("Only host can reset the game");
      }

      // Get all players
      const { data: playersData, error: playersError } = await supabase
        .from("players")
        .select("*")
        .eq("room_id", roomId);

      if (playersError) throw playersError;
      if (!playersData || playersData.length < 3) {
        throw new Error("Not enough players. Need at least 3 players");
      }

      // Use the number of impostors from the room
      let numImpostors = roomData.num_impostors || 1;
      if (numImpostors < 1) numImpostors = 1;
      if (numImpostors >= playersData.length) {
        numImpostors = playersData.length - 1;
      }

      // Generate new words from database, avoiding duplicates from last 30 rounds
      const category = (roomData.word_category as WordCategory) || 'all';
      
      // Get word pairs from database
      let wordPairsQuery = supabase
        .from('word_pairs')
        .select('id, crewmate_word, impostor_word, category');
      
      // Filter by category if not 'all'
      if (category !== 'all') {
        wordPairsQuery = wordPairsQuery.eq('category', category);
      }
      
      const { data: allWordPairs, error: wordPairsError } = await wordPairsQuery;
      
      if (wordPairsError || !allWordPairs || allWordPairs.length === 0) {
        throw new Error("Erro ao buscar palavras do banco de dados");
      }
      
      // Get history of used word pairs for this room (last 30 rounds)
      const { data: wordHistory } = await supabase
        .from('room_word_history')
        .select('word_pair_id')
        .eq('room_id', roomId)
        .order('round_number', { ascending: false })
        .limit(30);
      
      const usedWordPairIds = new Set(
        wordHistory?.map(h => h.word_pair_id) || []
      );
      
      // Filter out used word pairs
      const availableWordPairs = allWordPairs.filter(
        wp => !usedWordPairIds.has(wp.id)
      );
      
      // If no available pairs (all have been used), use all pairs
      const wordPairsToChooseFrom = availableWordPairs.length > 0 
        ? availableWordPairs 
        : allWordPairs;
      
      // Randomly select a word pair
      const randomIndex = Math.floor(Math.random() * wordPairsToChooseFrom.length);
      const selectedWordPair = wordPairsToChooseFrom[randomIndex];
      
      const crewmateWord = selectedWordPair.crewmate_word;
      const impostorWord = selectedWordPair.impostor_word;
      const wordPairId = selectedWordPair.id;

      // Shuffle players and select impostors
      const shuffledPlayers = shuffleArray(playersData);
      const impostorIndices = new Set<number>();
      
      const indices = Array.from({ length: shuffledPlayers.length }, (_, i) => i);
      const shuffledIndices = shuffleArray(indices);
      
      for (let i = 0; i < numImpostors && i < shuffledIndices.length; i++) {
        impostorIndices.add(shuffledIndices[i]);
      }

      const newRoundNumber = roomData.round_number + 1;
      const startingPlayerIndex = Math.floor(Math.random() * shuffledPlayers.length);
      const startingPlayer = shuffledPlayers[startingPlayerIndex];

      // Clear ALL old words for this room
      const { error: deleteError } = await supabase
        .from("player_words")
        .delete()
        .eq("room_id", roomId);

      if (deleteError) {
        console.error("Error deleting old words:", deleteError);
        throw deleteError;
      }

      // Assign new words to ALL current players
      const playerWords = shuffledPlayers.map((player, index) => ({
        room_id: roomId,
        round_number: newRoundNumber,
        player_id: player.id,
        word: impostorIndices.has(index) ? impostorWord : crewmateWord,
        is_impostor: impostorIndices.has(index),
      }));

      // Verify no duplicates
      const playerIds = new Set(playerWords.map(pw => pw.player_id));
      if (playerIds.size !== playerWords.length) {
        throw new Error("Duplicate players detected in word assignment");
      }

      // Check for existing words
      const { data: existingWords } = await supabase
        .from("player_words")
        .select("player_id")
        .eq("room_id", roomId)
        .eq("round_number", newRoundNumber);

      if (existingWords && existingWords.length > 0) {
        await supabase
          .from("player_words")
          .delete()
          .eq("room_id", roomId)
          .eq("round_number", newRoundNumber);
      }

      const { error: wordsError } = await supabase
        .from("player_words")
        .insert(playerWords);

      if (wordsError) {
        console.error("Error inserting player words:", wordsError);
        throw wordsError;
      }

      // Update room with new round number, words, and starting player
      const { error: updateError } = await supabase
        .from("rooms")
        .update({
          round_number: newRoundNumber,
          word: crewmateWord,
          impostor_word: impostorWord,
          starting_player_id: startingPlayer.id,
        })
        .eq("id", roomId);

      if (updateError) throw updateError;

      // Record word pair usage in history
      await supabase
        .from('room_word_history')
        .insert({
          room_id: roomId,
          round_number: newRoundNumber,
          word_pair_id: wordPairId,
        });

      // Cleanup old history entries (keep only last 30 rounds)
      await supabase.rpc('cleanup_old_word_history');

      return { success: true, roundNumber: newRoundNumber };
    },
    onSuccess: (_, variables) => {
      // Invalidate queries to refetch fresh data
      queryClient.invalidateQueries({ queryKey: ["room"] });
      queryClient.invalidateQueries({ queryKey: ["players", variables.roomId] });
      queryClient.invalidateQueries({ queryKey: ["playerWord"] });
      toast.success("Nova rodada iniciada!");
    },
    onError: (error: any) => {
      console.error("Error restarting:", error);
      toast.error(error.message || "Erro ao reiniciar");
    },
  });

  return {
    startGame,
    resetGame,
  };
};

