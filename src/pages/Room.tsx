import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlayerCard } from "@/components/PlayerCard";
import { WordReveal } from "@/components/WordReveal";
import { Copy, LogOut, Play, RotateCcw, Users, Loader2, Star } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useGame } from "@/hooks/useGame";
import type { WordCategory } from "@/hooks/useGame";

type GameStatus = "lobby" | "in_progress";
type GameMode = "normal" | "anonymous";

interface Room {
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

interface Player {
  id: string;
  name: string;
  is_host: boolean;
  joined_at?: string;
}

interface PlayerWord {
  player_id: string;
  word: string;
  is_impostor: boolean;
}

const Room = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  
  const [room, setRoom] = useState<Room | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [myWord, setMyWord] = useState<string | null>(null);
  const [isImpostor, setIsImpostor] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [numImpostors, setNumImpostors] = useState<number>(1);
  const isFetchingWordRef = useRef(false);
  const roomRef = useRef<Room | null>(null);
  
  // Keep roomRef in sync with room state
  useEffect(() => {
    roomRef.current = room;
  }, [room]);
  
  const { startGame, resetGame } = useGame();
  const currentPlayerId = localStorage.getItem("playerId");
  const currentPlayer = players.find(p => p.id === currentPlayerId);
  const isHost = currentPlayer?.is_host ?? false;
  const activePlayers = players.filter(p => !p.is_host || p.id === currentPlayerId);
  const canStart = activePlayers.length >= 3; // Minimum 3 players needed
  const maxImpostors = activePlayers.length > 0 ? Math.min(activePlayers.length - 1, Math.max(1, Math.floor(activePlayers.length / 2))) : 1; // Max half of players, but at least 1 less than total
  
  // Update numImpostors if it exceeds the new max
  useEffect(() => {
    if (activePlayers.length > 0 && numImpostors > maxImpostors) {
      setNumImpostors(maxImpostors);
    }
  }, [maxImpostors, activePlayers.length, numImpostors]);

  // Fetch room data
  const fetchRoom = useCallback(async () => {
    if (!code) return;
    
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .eq('code', code.toUpperCase())
      .maybeSingle();
    
    if (error) {
      console.error("Error fetching room:", error);
      toast.error("Erro ao carregar sala");
      return;
    }
    
    if (!data) {
      toast.error("Sala não encontrada");
      navigate("/");
      return;
    }
    
    const roomData = data as Room;
    setRoom(roomData);
    // Initialize numImpostors from room data or default to 1
    if (roomData.num_impostors) {
      setNumImpostors(roomData.num_impostors);
    }
    // Initialize game_mode from room data or default to 'normal'
    // (handled by realtime subscription)
  }, [code, navigate]);

  // Fetch players
  const fetchPlayers = useCallback(async () => {
    if (!room?.id) return;
    
    const { data, error } = await supabase
      .from('players')
      .select('*')
      .eq('room_id', room.id)
      .order('joined_at', { ascending: true });
    
    if (error) {
      console.error("Error fetching players:", error);
      return;
    }
    
    setPlayers(data as Player[]);
  }, [room?.id]);

  // Fetch my word
  const fetchMyWord = useCallback(async (force = false) => {
    if (!room?.id || !currentPlayerId) {
      return;
    }
    
    // Prevent multiple simultaneous fetches, unless forced
    if (isFetchingWordRef.current && !force) {
      return;
    }
    
    // Only clear words if game is not in progress
    if (room.status !== 'in_progress') {
      setMyWord(null);
      setIsImpostor(false);
      return;
    }
    
    isFetchingWordRef.current = true;
    
    // Try to fetch word for current round, with retry logic
    const fetchWord = async (attempt = 0): Promise<void> => {
      // Fetch all words for this player in this room to check for duplicates
      const { data: allWords, error: allError } = await supabase
        .from('player_words')
        .select('*')
        .eq('room_id', room.id)
        .eq('player_id', currentPlayerId);
      
      if (allError) {
        console.error("Error fetching all words:", allError);
        isFetchingWordRef.current = false;
        return;
      }
      
      // Filter for current round and check for duplicates
      const currentRoundWords = allWords?.filter(
        (pw: any) => pw.round_number === room.round_number
      ) || [];
      
      if (currentRoundWords.length > 1) {
        console.warn(
          `Multiple words found for round ${room.round_number}:`,
          currentRoundWords
        );
        // Use the first one, but log the issue
      }
      
      const playerWord = currentRoundWords[0] as PlayerWord | undefined;
      
      if (playerWord) {
        setMyWord(playerWord.word);
        setIsImpostor(playerWord.is_impostor);
        isFetchingWordRef.current = false;
      } else if (attempt < 5) {
        // Retry after a short delay if word not found (might still be inserting)
        setTimeout(() => fetchWord(attempt + 1), 300 * (attempt + 1));
      } else {
        // After 5 attempts, log warning
        console.warn(
          `Word not found after retries for round ${room.round_number}`
        );
        isFetchingWordRef.current = false;
      }
    };
    
    await fetchWord();
  }, [room?.id, room?.round_number, room?.status, currentPlayerId]);

  // Initial load
  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      await fetchRoom();
      setIsLoading(false);
    };
    init();
  }, [fetchRoom]);

  // Fetch players when room changes
  useEffect(() => {
    if (room?.id) {
      fetchPlayers();
    }
  }, [room?.id, fetchPlayers]);

  // Check if current player was removed from the room
  useEffect(() => {
    // Only check if we have a room, current player ID, and players have been loaded
    if (!room?.id || !currentPlayerId || isLoading) return;
    
    // If players list is empty but we have a room, wait for it to load
    // (This prevents false positives during initial load)
    if (players.length === 0) return;

    const isPlayerStillInRoom = players.some(p => p.id === currentPlayerId);
    
    if (!isPlayerStillInRoom) {
      // Player was removed from the room
      console.log("Player was removed from room, redirecting to homepage");
      toast.error("Você foi removido da sala");
      
      // Clear localStorage
      localStorage.removeItem("playerId");
      localStorage.removeItem("roomId");
      
      // Redirect to homepage
      navigate("/");
    }
  }, [players, currentPlayerId, room?.id, isLoading, navigate]);

  // Clear word when game returns to lobby
  // Real-time subscription handles word updates during game
  useEffect(() => {
    if (room?.status === 'lobby') {
      // Only clear words if game is definitely in lobby
      // Don't clear during transitions or if status is temporarily undefined
      setMyWord(null);
      setIsImpostor(false);
    }
  }, [room?.status]);

  // Realtime subscriptions
  useEffect(() => {
    if (!room?.id || !currentPlayerId) return;

    const roomChannel = supabase
      .channel(`room-${room.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'rooms', filter: `id=eq.${room.id}` },
        (payload) => {
          console.log("Room update:", payload.eventType, payload);
          if (payload.eventType === 'UPDATE' && payload.new) {
            const newRoom = payload.new as Room;
            setRoom(newRoom);
            
            // If round_number changed and game is in progress, clear word state
            // The player_words subscription will update it in real-time
            if (newRoom.status === 'in_progress' && newRoom.round_number > 0) {
              // Clear current word - will be updated by player_words subscription
              setMyWord(null);
              setIsImpostor(false);
            }
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'players', filter: `room_id=eq.${room.id}` },
        (payload) => {
          console.log("Players update:", payload.eventType, payload);
          
          if (payload.eventType === 'INSERT' && payload.new) {
            // New player joined - add to state
            const newPlayer = payload.new as Player;
            setPlayers(prev => {
              // Check if player already exists to avoid duplicates
              if (prev.some(p => p.id === newPlayer.id)) {
                return prev;
              }
              // Add new player and sort by joined_at
              return [...prev, newPlayer].sort((a, b) => 
                new Date(a.joined_at || 0).getTime() - new Date(b.joined_at || 0).getTime()
              );
            });
          } else if (payload.eventType === 'UPDATE' && payload.new) {
            // Player updated - update in state
            const updatedPlayer = payload.new as Player;
            setPlayers(prev => 
              prev.map(p => p.id === updatedPlayer.id ? updatedPlayer : p)
            );
          } else if (payload.eventType === 'DELETE' && payload.old) {
            // Player removed - remove from state
            const deletedPlayer = payload.old as Player;
            setPlayers(prev => prev.filter(p => p.id !== deletedPlayer.id));
          }
        }
      )
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'player_words', 
          filter: `room_id=eq.${room.id} AND player_id=eq.${currentPlayerId}` 
        },
        (payload) => {
          console.log("Player words update:", payload.eventType, payload);
          
          // Get current room state from ref to avoid closure issues
          const currentRoom = roomRef.current;
          
          // Only process if game is in progress
          if (!currentRoom || currentRoom.status !== 'in_progress') {
            return;
          }

          if (payload.eventType === 'INSERT' && payload.new) {
            const newWord = payload.new as PlayerWord & { round_number: number };
            
            // Verify round number matches current round
            if (newWord.round_number === currentRoom.round_number) {
              setMyWord(newWord.word);
              setIsImpostor(newWord.is_impostor);
              console.log("Word updated from realtime INSERT:", newWord.word);
            } else {
              console.log(
                `Word INSERT for different round: ${newWord.round_number} vs ${currentRoom.round_number}`
              );
            }
          } else if (payload.eventType === 'UPDATE' && payload.new) {
            const updatedWord = payload.new as PlayerWord & { round_number: number };
            
            // Verify round number matches current round
            if (updatedWord.round_number === currentRoom.round_number) {
              setMyWord(updatedWord.word);
              setIsImpostor(updatedWord.is_impostor);
              console.log("Word updated from realtime UPDATE:", updatedWord.word);
            } else {
              console.log(
                `Word UPDATE for different round: ${updatedWord.round_number} vs ${currentRoom.round_number}`
              );
            }
          } else if (payload.eventType === 'DELETE' && payload.old) {
            const deletedWord = payload.old as PlayerWord & { round_number: number };
            
            // Only clear if it's for the current round
            if (deletedWord.round_number === currentRoom.round_number) {
              setMyWord(null);
              setIsImpostor(false);
              console.log("Word cleared from realtime DELETE");
            }
          }
        }
      )
      .subscribe((status) => {
        console.log("Realtime subscription status:", status);
        if (status === 'SUBSCRIBED') {
          console.log("Successfully subscribed to room changes");
        }
      });

    return () => {
      console.log("Cleaning up realtime subscription");
      supabase.removeChannel(roomChannel);
    };
  }, [room?.id, room?.status, room?.round_number, currentPlayerId, fetchPlayers]);

  const copyRoomCode = () => {
    navigator.clipboard.writeText(code || "");
    toast.success("Código copiado!");
  };

  const handleStartGame = async () => {
    if (!room?.id || !currentPlayerId || !canStart) return;
    
    if (numImpostors < 1 || numImpostors >= activePlayers.length) {
      toast.error("Número de impostores inválido");
      return;
    }
    
    setIsActionLoading(true);
    
    try {
      await startGame(room.id, currentPlayerId, numImpostors);
      await fetchRoom();
    } catch (error) {
      // Error is already handled in the hook
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleRestart = async () => {
    if (!room?.id || !currentPlayerId) return;
    
    setIsActionLoading(true);
    // Reset the fetching flag to allow new fetch
    isFetchingWordRef.current = false;
    
    try {
      await resetGame(room.id, currentPlayerId);
      // Refresh room data to get updated round_number
      await fetchRoom();
      // Word will be updated automatically via real-time subscription
    } catch (error) {
      // Error is already handled in the hook
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleLeave = async () => {
    if (currentPlayerId) {
      await supabase
        .from('players')
        .delete()
        .eq('id', currentPlayerId);
    }
    
    localStorage.removeItem("playerId");
    localStorage.removeItem("roomId");
    navigate("/");
  };

  const handleRemovePlayer = async (playerIdToRemove: string) => {
    // Prevent removing self
    if (playerIdToRemove === currentPlayerId) {
      toast.error("Você não pode remover a si mesmo");
      return;
    }

    const playerToRemove = players.find(p => p.id === playerIdToRemove);
    if (!playerToRemove) {
      toast.error("Jogador não encontrado");
      return;
    }

    if (!room?.id || !isHost) {
      toast.error("Apenas o host pode remover jogadores");
      return;
    }

    setIsActionLoading(true);

    try {
      // If game is in progress, reset to lobby first
      if (room.status === 'in_progress') {
        // Clear all player words
        await supabase
          .from('player_words')
          .delete()
          .eq('room_id', room.id);

        // Reset room to lobby
        const { error: resetError } = await supabase
          .from('rooms')
          .update({
            status: 'lobby',
            round_number: 0,
            word: null,
            impostor_word: null,
            starting_player_id: null,
          })
          .eq('id', room.id);

        if (resetError) {
          console.error("Error resetting room:", resetError);
          toast.error("Erro ao resetar sala");
          setIsActionLoading(false);
          return;
        }
      }

      // Remove the player
      const { error } = await supabase
        .from('players')
        .delete()
        .eq('id', playerIdToRemove)
        .eq('room_id', room.id);

      if (error) {
        console.error("Error removing player:", error);
        toast.error("Erro ao remover jogador");
        return;
      }

      toast.success(`${playerToRemove.name} removido da sala`);
      
      // Realtime subscription will automatically update the players list
      // No need to manually refetch - state will update from realtime event
    } catch (error) {
      console.error("Error removing player:", error);
      toast.error("Erro ao remover jogador");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDelegateHost = async (newHostPlayerId: string) => {
    if (!room?.id || !isHost) {
      toast.error("Apenas o host pode delegar host");
      return;
    }

    if (newHostPlayerId === currentPlayerId) {
      toast.error("Você já é o host");
      return;
    }

    const newHost = players.find(p => p.id === newHostPlayerId);
    if (!newHost) {
      toast.error("Jogador não encontrado");
      return;
    }

    setIsActionLoading(true);

    try {
      // Update room's host_player_id
      const { error: roomError } = await supabase
        .from('rooms')
        .update({ host_player_id: newHostPlayerId })
        .eq('id', room.id);

      if (roomError) {
        console.error("Error updating room host:", roomError);
        toast.error("Erro ao delegar host");
        setIsActionLoading(false);
        return;
      }

      // Update old host's is_host flag
      const { error: oldHostError } = await supabase
        .from('players')
        .update({ is_host: false })
        .eq('id', currentPlayerId)
        .eq('room_id', room.id);

      if (oldHostError) {
        console.error("Error updating old host:", oldHostError);
      }

      // Update new host's is_host flag
      const { error: newHostError } = await supabase
        .from('players')
        .update({ is_host: true })
        .eq('id', newHostPlayerId)
        .eq('room_id', room.id);

      if (newHostError) {
        console.error("Error updating new host:", newHostError);
        toast.error("Erro ao delegar host");
        return;
      }

      toast.success(`${newHost.name} é agora o host`);
      
      // Realtime subscription will automatically update the players list
    } catch (error) {
      console.error("Error delegating host:", error);
      toast.error("Erro ao delegar host");
    } finally {
      setIsActionLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!room) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={handleLeave}>
            <LogOut className="w-4 h-4" />
            Sair
          </Button>
          
          <button
            onClick={copyRoomCode}
            className="flex items-center gap-2 px-4 py-2 bg-secondary border border-border hover:border-primary transition-colors"
          >
            <span className="room-code text-xl">{code}</span>
            <Copy className="w-4 h-4 text-muted-foreground" />
          </button>
          
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="w-4 h-4" />
            <span className="font-mono">{players.length}</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-auto">
        {room.status === "lobby" ? (
          <div className="max-w-md mx-auto space-y-6 animate-fade-in">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-1">Sala de Espera</h2>
              <p className="text-muted-foreground text-sm">
                Aguardando jogadores...
              </p>
            </div>

            {/* Player List */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Jogadores ({players.length})
              </h3>
              <div className="space-y-2">
                {players.map((player) => (
                  <PlayerCard
                    key={player.id}
                    name={player.name}
                    isHost={player.is_host}
                    isCurrentPlayer={player.id === currentPlayerId}
                    playerId={player.id}
                    canRemove={isHost}
                    onRemove={handleRemovePlayer}
                    canDelegate={isHost && !player.is_host}
                    onDelegate={handleDelegateHost}
                  />
                ))}
              </div>
            </div>

            {/* Host Controls */}
            {isHost && (
              <div className="space-y-4 pt-4 border-t border-border">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label htmlFor="impostor-count" className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                      Número de Impostores
                    </label>
                  </div>
                  <Input
                    id="impostor-count"
                    type="number"
                    min={1}
                    max={maxImpostors}
                    value={numImpostors}
                    onChange={(e) => {
                      const value = parseInt(e.target.value, 10);
                      if (!isNaN(value) && value >= 1 && value <= maxImpostors) {
                        setNumImpostors(value);
                      }
                    }}
                    disabled={!canStart || isActionLoading}
                    className="w-full text-center"
                  />
                  <p className="text-xs text-center text-muted-foreground">
                    Máximo: {maxImpostors} impostor{maxImpostors !== 1 ? 'es' : ''} ({activePlayers.length} jogador{activePlayers.length !== 1 ? 'es' : ''})
                  </p>
                </div>

                <div className="space-y-3 pt-2 border-t border-border">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col gap-1">
                      <label htmlFor="game-mode" className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                        Modo Anônimo
                      </label>
                      <p className="text-xs text-muted-foreground">
                        Esconde cores e papéis dos jogadores
                      </p>
                    </div>
                    <Switch
                      id="game-mode"
                      checked={room?.game_mode === 'anonymous'}
                      onCheckedChange={async (checked) => {
                        if (!room?.id || !isHost) return;
                        
                        const newMode: GameMode = checked ? 'anonymous' : 'normal';
                        setIsActionLoading(true);
                        
                        try {
                          const { error } = await supabase
                            .from('rooms')
                            .update({ game_mode: newMode })
                            .eq('id', room.id);
                          
                          if (error) {
                            console.error("Error updating game mode:", error);
                            toast.error("Erro ao atualizar modo de jogo");
                          }
                        } catch (error) {
                          console.error("Error updating game mode:", error);
                          toast.error("Erro ao atualizar modo de jogo");
                        } finally {
                          setIsActionLoading(false);
                        }
                      }}
                      disabled={isActionLoading || room?.status === 'in_progress'}
                    />
                  </div>
                </div>

                <div className="space-y-3 pt-2 border-t border-border">
                  <div className="flex flex-col gap-2">
                    <label htmlFor="word-category" className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                      Categoria de Palavras
                    </label>
                    <Select
                      value={room?.word_category || 'all'}
                      onValueChange={async (value: WordCategory) => {
                        if (!room?.id || !isHost) return;
                        
                        setIsActionLoading(true);
                        try {
                          const { error } = await supabase
                            .from('rooms')
                            .update({ word_category: value })
                            .eq('id', room.id);
                          
                          if (error) {
                            console.error("Error updating word category:", error);
                            toast.error("Erro ao atualizar categoria");
                          }
                        } catch (error) {
                          console.error("Error updating word category:", error);
                          toast.error("Erro ao atualizar categoria");
                        } finally {
                          setIsActionLoading(false);
                        }
                      }}
                      disabled={isActionLoading || room?.status === 'in_progress'}
                    >
                      <SelectTrigger id="word-category" className="w-full">
                        <SelectValue placeholder="Selecione uma categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas as Categorias</SelectItem>
                        <SelectItem value="agua">Água/Mar</SelectItem>
                        <SelectItem value="veiculos">Veículos/Transporte</SelectItem>
                        <SelectItem value="casa">Casa/Construção</SelectItem>
                        <SelectItem value="animais">Animais</SelectItem>
                        <SelectItem value="natureza">Natureza</SelectItem>
                        <SelectItem value="tecnologia">Tecnologia</SelectItem>
                        <SelectItem value="corpo">Corpo Humano</SelectItem>
                        <SelectItem value="comida">Comida</SelectItem>
                        <SelectItem value="espaco">Espaço</SelectItem>
                        <SelectItem value="livros">Livros/Educação</SelectItem>
                        <SelectItem value="musica">Música</SelectItem>
                        <SelectItem value="esportes">Esportes</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-center text-muted-foreground">
                      Escolha a categoria de palavras para o jogo
                    </p>
                  </div>
                </div>

                <Button
                  variant="default"
                  size="lg"
                  className="w-full"
                  onClick={handleStartGame}
                  disabled={!canStart || isActionLoading}
                >
                  {isActionLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Play className="w-5 h-5" />
                  )}
                  Iniciar Partida
                </Button>

                {!canStart && (
                  <p className="text-center text-sm text-muted-foreground">
                    Mínimo de 3 jogadores necessários
                  </p>
                )}
              </div>
            )}

            {!isHost && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  Aguardando o host iniciar a partida...
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="max-w-md mx-auto space-y-6 animate-fade-in">
            {/* Word Reveal */}
            {myWord && (
              <WordReveal 
                word={myWord} 
                isImpostor={isImpostor} 
                isAnonymous={room?.game_mode === 'anonymous'} 
              />
            )}

            {/* Starting Player Indicator */}
            {room?.starting_player_id && (
              <div className="bg-secondary border border-border p-4 rounded-lg">
                <div className="flex items-center justify-center gap-2">
                  <Star className="w-4 h-4 text-primary fill-primary" />
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">
                      {players.find(p => p.id === room.starting_player_id)?.name || 'Jogador'}
                    </span>
                    {' '}começa esta rodada
                  </p>
                </div>
              </div>
            )}

            {/* Player List (names only) */}
            <div className="space-y-2 pt-6 border-t border-border">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Jogadores
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {players.map((player) => (
                  <div
                    key={player.id}
                    className={`p-3 bg-secondary border border-border text-center relative ${
                      player.id === currentPlayerId ? "border-primary" : ""
                    } ${
                      room?.starting_player_id === player.id ? "border-primary/50" : ""
                    }`}
                  >
                    <span className="text-sm">
                      {player.name}
                    </span>
                    {room?.starting_player_id === player.id && (
                      <Star className="w-3 h-3 text-primary fill-primary absolute top-1 right-1" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Host Controls */}
            {isHost && (
              <Button
                variant="destructive"
                size="lg"
                className="w-full"
                onClick={handleRestart}
                disabled={isActionLoading}
              >
                {isActionLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <RotateCcw className="w-5 h-5" />
                )}
                Reiniciar Rodada
              </Button>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="p-4 border-t border-border text-center">
        <p className="text-sm text-muted-foreground font-mono">
          {room.status === "lobby" ? "Lobby" : `Rodada ${room.round_number}`}
        </p>
      </footer>
    </div>
  );
};

export default Room;

