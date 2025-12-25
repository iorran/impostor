import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Word lists
const CREWMATE_WORDS = [
  "BANANA",
  "ELEFANTE",
  "COMPUTADOR",
  "BICICLETA",
  "OCEANO",
  "MONTANHA",
  "ESTRELA",
  "LIVRO",
  "MUSICA",
  "SOL",
  "ARVORE",
  "CACHORRO",
  "GATO",
  "CARRO",
  "CASA",
  "ESCOLA",
  "AMIGO",
  "FAMILIA",
  "VIAGEM",
  "SONHO",
];

const IMPOSTOR_WORDS = [
  "MAÇÃ",
  "RINOCERONTE",
  "TABLET",
  "MOTOCICLETA",
  "MAR",
  "COLINA",
  "LUA",
  "REVISTA",
  "SOM",
  "LUA",
  "FLOR",
  "GALO",
  "PEIXE",
  "MOTO",
  "APARTAMENTO",
  "UNIVERSIDADE",
  "COLEGA",
  "PARENTE",
  "FERIAS",
  "META",
];

const getRandomWord = (words: string[]): string => {
  return words[Math.floor(Math.random() * words.length)];
};

const getCrewmateWord = (): string => {
  return getRandomWord(CREWMATE_WORDS);
};

const getImpostorWord = (): string => {
  return getRandomWord(IMPOSTOR_WORDS);
};

const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export const useGame = () => {
  const startGame = useCallback(
    async (roomId: string, hostPlayerId: string, numImpostors: number) => {
      try {
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

        // Generate words
        let crewmateWord = getCrewmateWord();
        let impostorWord = getImpostorWord();
        while (crewmateWord === impostorWord) {
          impostorWord = getImpostorWord();
        }

        // Shuffle players and select impostors
        // Use a more reliable method to ensure exactly numImpostors are selected
        const shuffledPlayers = shuffleArray(playersData);
        const impostorIndices = new Set<number>();
        
        // Create array of indices and shuffle to select impostors
        const indices = Array.from({ length: shuffledPlayers.length }, (_, i) => i);
        const shuffledIndices = shuffleArray(indices);
        
        // Select first numImpostors indices as impostors
        for (let i = 0; i < numImpostors && i < shuffledIndices.length; i++) {
          impostorIndices.add(shuffledIndices[i]);
        }
        
        // Verify we have the correct number of impostors
        if (impostorIndices.size !== numImpostors) {
          console.error(
            `Impostor count mismatch: expected ${numImpostors}, got ${impostorIndices.size}`
          );
        }

        const newRoundNumber = roomData.round_number + 1;

        // Randomly select a starting player
        const randomIndex = Math.floor(Math.random() * shuffledPlayers.length);
        const startingPlayer = shuffledPlayers[randomIndex];

        // Clear ALL old words for this room to ensure clean state
        await supabase
          .from("player_words")
          .delete()
          .eq("room_id", roomId);

        // Update room
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

        // Assign words to ALL current players in the room
        const playerWords = shuffledPlayers.map((player, index) => ({
          room_id: roomId,
          round_number: newRoundNumber,
          player_id: player.id,
          word: impostorIndices.has(index) ? impostorWord : crewmateWord,
          is_impostor: impostorIndices.has(index),
        }));

        // Verify no duplicates before inserting
        const playerIds = new Set(playerWords.map(pw => pw.player_id));
        if (playerIds.size !== playerWords.length) {
          throw new Error("Duplicate players detected in word assignment");
        }

        // Double-check: verify no words exist for this round before inserting
        const { data: existingWords } = await supabase
          .from("player_words")
          .select("player_id")
          .eq("room_id", roomId)
          .eq("round_number", newRoundNumber);

        if (existingWords && existingWords.length > 0) {
          console.warn(
            `Found ${existingWords.length} existing words for round ${newRoundNumber}, deleting them`
          );
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

        // Verify all words were inserted correctly
        const { data: insertedWords } = await supabase
          .from("player_words")
          .select("player_id, round_number, is_impostor")
          .eq("room_id", roomId)
          .eq("round_number", newRoundNumber);

        if (insertedWords) {
          const actualImpostorCount = insertedWords.filter(
            (w) => w.is_impostor
          ).length;
          
          if (insertedWords.length !== shuffledPlayers.length) {
            console.warn(
              `Word count mismatch: expected ${shuffledPlayers.length}, got ${insertedWords.length}`
            );
          }
          
          if (actualImpostorCount !== numImpostors) {
            console.warn(
              `Impostor count mismatch in DB: expected ${numImpostors}, got ${actualImpostorCount}`
            );
          }
        }

        toast.success("Partida iniciada!");
        return { success: true, roundNumber: newRoundNumber };
      } catch (error: any) {
        console.error("Error starting game:", error);
        toast.error(error.message || "Erro ao iniciar partida");
        throw error;
      }
    },
    []
  );

  const resetGame = useCallback(
    async (roomId: string, hostPlayerId: string) => {
      try {
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

        // Use the number of impostors from the room (default to 1 if not set)
        let numImpostors = roomData.num_impostors || 1;
        if (numImpostors < 1) numImpostors = 1;
        if (numImpostors >= playersData.length) {
          numImpostors = playersData.length - 1;
        }

        // Generate new words
        let crewmateWord = getCrewmateWord();
        let impostorWord = getImpostorWord();
        while (crewmateWord === impostorWord) {
          impostorWord = getImpostorWord();
        }

        // Shuffle players and select impostors
        // Use a more reliable method to ensure exactly numImpostors are selected
        const shuffledPlayers = shuffleArray(playersData);
        const impostorIndices = new Set<number>();
        
        // Create array of indices and shuffle to select impostors
        const indices = Array.from({ length: shuffledPlayers.length }, (_, i) => i);
        const shuffledIndices = shuffleArray(indices);
        
        // Select first numImpostors indices as impostors
        for (let i = 0; i < numImpostors && i < shuffledIndices.length; i++) {
          impostorIndices.add(shuffledIndices[i]);
        }
        
        // Verify we have the correct number of impostors
        if (impostorIndices.size !== numImpostors) {
          console.error(
            `Impostor count mismatch: expected ${numImpostors}, got ${impostorIndices.size}`
          );
        }

        const newRoundNumber = roomData.round_number + 1;

        // Randomly select a starting player
        const randomIndex = Math.floor(Math.random() * shuffledPlayers.length);
        const startingPlayer = shuffledPlayers[randomIndex];

        // Step 1: Clear ALL old words for this room FIRST (including from previous rounds)
        // This ensures no duplicate words exist
        const { error: deleteError } = await supabase
          .from("player_words")
          .delete()
          .eq("room_id", roomId);

        if (deleteError) {
          console.error("Error deleting old words:", deleteError);
          throw deleteError;
        }

        // Step 2: Update room with new round number, words, and starting player
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

        // Step 3: Assign new words to ALL current players in the room
        // Ensure each player gets exactly one word for this round
        const playerWords = shuffledPlayers.map((player, index) => ({
          room_id: roomId,
          round_number: newRoundNumber,
          player_id: player.id,
          word: impostorIndices.has(index) ? impostorWord : crewmateWord,
          is_impostor: impostorIndices.has(index),
        }));

        // Verify no duplicates before inserting
        const playerIds = new Set(playerWords.map(pw => pw.player_id));
        if (playerIds.size !== playerWords.length) {
          throw new Error("Duplicate players detected in word assignment");
        }

        // Double-check: verify no words exist for this round before inserting
        const { data: existingWords } = await supabase
          .from("player_words")
          .select("player_id")
          .eq("room_id", roomId)
          .eq("round_number", newRoundNumber);

        if (existingWords && existingWords.length > 0) {
          console.warn(
            `Found ${existingWords.length} existing words for round ${newRoundNumber}, deleting them`
          );
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

        // Step 4: Verify all words were inserted correctly
        const { data: insertedWords, error: verifyError } = await supabase
          .from("player_words")
          .select("player_id, round_number, is_impostor")
          .eq("room_id", roomId)
          .eq("round_number", newRoundNumber);

        if (verifyError) {
          console.error("Error verifying inserted words:", verifyError);
        } else {
          const actualImpostorCount = insertedWords?.filter(
            (w) => w.is_impostor
          ).length || 0;
          
          if (insertedWords && insertedWords.length !== shuffledPlayers.length) {
            console.warn(
              `Word count mismatch: expected ${shuffledPlayers.length}, got ${insertedWords.length}`
            );
          }
          
          if (actualImpostorCount !== numImpostors) {
            console.warn(
              `Impostor count mismatch in DB: expected ${numImpostors}, got ${actualImpostorCount}`
            );
          }
        }

        toast.success("Nova rodada iniciada!");
        return { success: true, roundNumber: newRoundNumber };
      } catch (error: any) {
        console.error("Error restarting:", error);
        toast.error(error.message || "Erro ao reiniciar");
        throw error;
      }
    },
    []
  );

  return {
    startGame,
    resetGame,
  };
};

