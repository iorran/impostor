import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RoomCodeInput } from "@/components/RoomCodeInput";
import { Users, ArrowRight, UserX } from "lucide-react";
import { toast } from "sonner";
import { useRoom } from "@/hooks/useRoom";

const Index = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState<"home" | "create" | "join">("home");
  const [playerName, setPlayerName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const { createRoom, joinRoom, isLoading } = useRoom();

  // Check if there's a room code in URL params
  useEffect(() => {
    const codeFromUrl = searchParams.get("code");
    if (codeFromUrl && codeFromUrl.length === 4) {
      setRoomCode(codeFromUrl.toUpperCase());
      setMode("join");
    }
  }, [searchParams]);

  const handleCreateRoom = async () => {
    if (!playerName.trim()) {
      toast.error("Digite seu nome");
      return;
    }
    
    try {
      const result = await createRoom(playerName.trim());
      navigate(`/room/${result.roomCode}`);
    } catch (error) {
      // Error is already handled in the hook
    }
  };

  const handleJoinRoom = async () => {
    if (!playerName.trim()) {
      toast.error("Digite seu nome");
      return;
    }
    if (roomCode.length !== 4) {
      toast.error("Código da sala deve ter 4 caracteres");
      return;
    }
    
    try {
      const result = await joinRoom(roomCode.toUpperCase(), playerName.trim());
      navigate(`/room/${result.roomCode}`);
    } catch (error) {
      // Error is already handled in the hook
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="p-6 border-b border-border">
        <div className="flex items-center justify-center gap-3">
          <UserX className="w-8 h-8 text-primary" />
          <h1 className="text-2xl font-bold font-mono tracking-wider">IMPOSTOR</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md space-y-8 animate-fade-in">
          {mode === "home" && (
            <>
              <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold">Jogo do Impostor</h2>
                <p className="text-muted-foreground">
                  Descubra quem é o impostor antes que seja tarde demais
                </p>
              </div>

              <div className="space-y-4">
                <Button
                  variant="default"
                  size="xl"
                  className="w-full"
                  onClick={() => setMode("create")}
                >
                  <Users className="w-5 h-5" />
                  Criar Sala
                </Button>
                
                <Button
                  variant="outline"
                  size="xl"
                  className="w-full"
                  onClick={() => setMode("join")}
                >
                  <ArrowRight className="w-5 h-5" />
                  Entrar na Sala
                </Button>
              </div>
            </>
          )}

          {mode === "create" && (
            <>
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold">Criar Nova Sala</h2>
                <p className="text-muted-foreground">
                  Você será o host da partida
                </p>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                    Seu nome
                  </label>
                  <Input
                    placeholder="Digite seu nome"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    maxLength={20}
                    disabled={isLoading}
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => setMode("home")}
                    disabled={isLoading}
                    className="flex-1"
                  >
                    Voltar
                  </Button>
                  <Button
                    variant="default"
                    size="lg"
                    onClick={handleCreateRoom}
                    disabled={isLoading || !playerName.trim()}
                    className="flex-1"
                  >
                    {isLoading ? "Criando..." : "Criar"}
                  </Button>
                </div>
              </div>
            </>
          )}

          {mode === "join" && (
            <>
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold">Entrar na Sala</h2>
                <p className="text-muted-foreground">
                  Digite o código de 4 letras
                </p>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                    Seu nome
                  </label>
                  <Input
                    placeholder="Digite seu nome"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    maxLength={20}
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                    Código da sala
                  </label>
                  <RoomCodeInput
                    value={roomCode}
                    onChange={setRoomCode}
                    disabled={isLoading}
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => setMode("home")}
                    disabled={isLoading}
                    className="flex-1"
                  >
                    Voltar
                  </Button>
                  <Button
                    variant="default"
                    size="lg"
                    onClick={handleJoinRoom}
                    disabled={isLoading || !playerName.trim() || roomCode.length !== 4}
                    className="flex-1"
                  >
                    {isLoading ? "Entrando..." : "Entrar"}
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="p-4 border-t border-border text-center">
        <p className="text-sm text-muted-foreground font-mono">
          v1.0 • Jogue com amigos
        </p>
      </footer>
    </div>
  );
};

export default Index;

