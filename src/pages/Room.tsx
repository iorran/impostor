import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlayerCard } from "@/components/PlayerCard";
import { WordReveal } from "@/components/WordReveal";
import { Copy, LogOut, Play, RotateCcw, Users, Loader2, Star, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useGameMutations } from "@/hooks/useGameMutations";
import { useRoomQuery } from "@/hooks/useRoomQuery";
import { usePlayersQuery } from "@/hooks/usePlayersQuery";
import { usePlayerWordQuery } from "@/hooks/usePlayerWordQuery";
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
  const queryClient = useQueryClient();
  
  // React Query hooks
  const { data: room, isLoading: isLoadingRoom } = useRoomQuery(code);
  const { data: players = [], isLoading: isLoadingPlayers } = usePlayersQuery(room?.id);
  const currentPlayerId = localStorage.getItem("playerId");
  const { data: playerWord } = usePlayerWordQuery(room?.id, currentPlayerId || undefined, room?.round_number);
  
  // Game mutations
  const { startGame, resetGame } = useGameMutations();
  
  // Derived state
  const currentPlayer = players.find(p => p.id === currentPlayerId);
  const isHost = currentPlayer?.is_host ?? false;
  const activePlayers = players.filter(p => !p.is_host || p.id === currentPlayerId);
  const canStart = activePlayers.length >= 3;
  const maxImpostors = activePlayers.length > 0 ? Math.min(activePlayers.length - 1, Math.max(1, Math.floor(activePlayers.length / 2))) : 1;
  const numImpostors = room?.num_impostors ?? 1;
  
  // Word state from query
  const myWord = playerWord?.word || null;
  const isImpostor = playerWord?.is_impostor || false;
  
  const isLoading = isLoadingRoom || isLoadingPlayers;
  const isActionLoading = startGame.isPending || resetGame.isPending;

  // Handle room not found
  useEffect(() => {
    if (!isLoadingRoom && !room && code) {
      toast.error("Sala não encontrada");
      navigate("/");
    }
  }, [isLoadingRoom, room, code, navigate]);

  // Check if player needs to join the room (no playerId or player not in room)
  useEffect(() => {
    if (!room?.id || isLoading) return;
    
    // If no playerId in localStorage, redirect to join page with code
    if (!currentPlayerId) {
      console.log("No playerId found, redirecting to join page");
      navigate(`/?code=${code}`);
      return;
    }
    
    // If players list is loaded and player is not in room, they were removed
    if (players.length > 0) {
      const isPlayerStillInRoom = players.some(p => p.id === currentPlayerId);
      
      if (!isPlayerStillInRoom) {
        // Player was removed from the room
        console.log("Player was removed from room, redirecting to join page");
        toast.error("Você foi removido da sala");
        
        // Clear localStorage
        localStorage.removeItem("playerId");
        localStorage.removeItem("roomId");
        
        // Redirect to join page with code
        navigate(`/?code=${code}`);
      }
    }
  }, [players, currentPlayerId, room?.id, isLoading, navigate, code]);


  const copyRoomCode = async () => {
    if (!code) {
      toast.error("Código da sala não disponível");
      return;
    }
    
    // Check if clipboard API is available
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(code);
        toast.success("Código copiado!");
        return;
      } catch (error) {
        console.error("Error copying to clipboard:", error);
        // Fall through to fallback method
      }
    }
    
    // Fallback: select and copy using execCommand
    try {
      const textArea = document.createElement("textarea");
      textArea.value = code;
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      textArea.style.left = "-999999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      if (successful) {
        toast.success("Código copiado!");
      } else {
        toast.error("Erro ao copiar código. Tente selecionar e copiar manualmente.");
      }
    } catch (fallbackError) {
      console.error("Fallback copy failed:", fallbackError);
      toast.error("Erro ao copiar código. O código é: " + code);
    }
  };

  const shareViaWhatsApp = () => {
    if (!code) return;
    
    // Share link that goes to Index with code pre-filled
    const roomUrl = `${window.location.origin}?code=${code}`;
    const message = `🎮 Entre na minha sala do Jogo do Impostor!\n\nCódigo da sala: ${code}\n\nLink: ${roomUrl}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    
    window.open(whatsappUrl, '_blank');
  };

  const handleStartGame = async () => {
    if (!room?.id || !currentPlayerId || !canStart) return;
    
    if (numImpostors < 1 || numImpostors >= activePlayers.length) {
      toast.error("Número de impostores inválido");
      return;
    }
    
    startGame.mutate({
      roomId: room.id,
      hostPlayerId: currentPlayerId,
      numImpostors,
    });
  };

  const handleRestart = async () => {
    if (!room?.id || !currentPlayerId) return;
    
    resetGame.mutate({
      roomId: room.id,
      hostPlayerId: currentPlayerId,
    });
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

      // Invalidate queries to refetch
      queryClient.invalidateQueries({ queryKey: ["players", room.id] });
      queryClient.invalidateQueries({ queryKey: ["room", code] });
      
      toast.success(`${playerToRemove.name} removido da sala`);
    } catch (error) {
      console.error("Error removing player:", error);
      toast.error("Erro ao remover jogador");
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

    try {
      // Update room's host_player_id
      const { error: roomError } = await supabase
        .from('rooms')
        .update({ host_player_id: newHostPlayerId })
        .eq('id', room.id);

      if (roomError) {
        console.error("Error updating room host:", roomError);
        toast.error("Erro ao delegar host");
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

      // Invalidate queries to refetch
      queryClient.invalidateQueries({ queryKey: ["players", room.id] });
      queryClient.invalidateQueries({ queryKey: ["room", code] });
      
      toast.success(`${newHost.name} é agora o host`);
    } catch (error) {
      console.error("Error delegating host:", error);
      toast.error("Erro ao delegar host");
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
          
          <div className="flex items-center gap-2">
            <button
              onClick={copyRoomCode}
              className="flex items-center gap-2 px-4 py-2 bg-secondary border border-border hover:border-primary transition-colors"
            >
              <span className="room-code text-xl">{code}</span>
              <Copy className="w-4 h-4 text-muted-foreground" />
            </button>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={shareViaWhatsApp}
              className="h-10 w-10 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950"
              aria-label="Compartilhar via WhatsApp"
              title="Compartilhar via WhatsApp"
            >
              <MessageCircle className="w-5 h-5" />
            </Button>
          </div>
          
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
                    canRemove={isHost && !player.is_host}
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
                    onChange={async (e) => {
                      const value = parseInt(e.target.value, 10);
                      if (!isNaN(value) && value >= 1 && value <= maxImpostors && room?.id) {
                        await supabase
                          .from('rooms')
                          .update({ num_impostors: value })
                          .eq('id', room.id);
                        // Invalidate to refetch
                        queryClient.invalidateQueries({ queryKey: ["room", code] });
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
                        console.log("Updating game mode to:", newMode);
                        
                        try {
                          const { error, data } = await supabase
                            .from('rooms')
                            .update({ game_mode: newMode })
                            .eq('id', room.id)
                            .select()
                            .single();
                          
                          if (error) {
                            console.error("Error updating game mode:", error);
                            toast.error("Erro ao atualizar modo de jogo");
                          } else if (data) {
                            console.log("Game mode updated successfully:", data);
                            // Invalidate to refetch
                            queryClient.invalidateQueries({ queryKey: ["room", code] });
                            toast.success(`Modo ${newMode === 'anonymous' ? 'anônimo' : 'normal'} ativado`);
                          }
                        } catch (error) {
                          console.error("Error updating game mode:", error);
                          toast.error("Erro ao atualizar modo de jogo");
                        }
                      }}
                      disabled={room?.status === 'in_progress'}
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
                        
                        console.log("Updating word category to:", value);
                        
                        try {
                          const { error, data } = await supabase
                            .from('rooms')
                            .update({ word_category: value })
                            .eq('id', room.id)
                            .select()
                            .single();
                          
                          if (error) {
                            console.error("Error updating word category:", error);
                            toast.error("Erro ao atualizar categoria");
                          } else if (data) {
                            console.log("Word category updated successfully:", data);
                            // Invalidate to refetch
                            queryClient.invalidateQueries({ queryKey: ["room", code] });
                            toast.success("Categoria atualizada");
                          }
                        } catch (error) {
                          console.error("Error updating word category:", error);
                          toast.error("Erro ao atualizar categoria");
                        }
                      }}
                      disabled={room?.status === 'in_progress'}
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

