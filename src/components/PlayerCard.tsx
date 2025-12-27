import { cn } from "@/lib/utils";
import { Crown, User, X, UserCog } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PlayerCardProps {
  name: string;
  isHost?: boolean;
  isCurrentPlayer?: boolean;
  playerId: string;
  canRemove?: boolean;
  onRemove?: (playerId: string) => void;
  canDelegate?: boolean;
  onDelegate?: (playerId: string) => void;
}

export function PlayerCard({ 
  name, 
  isHost, 
  isCurrentPlayer, 
  playerId,
  canRemove = false,
  onRemove,
  canDelegate = false,
  onDelegate
}: PlayerCardProps) {
  const handleRemove = () => {
    if (onRemove) {
      onRemove(playerId);
    }
  };

  const handleDelegate = () => {
    if (onDelegate && !isHost) {
      onDelegate(playerId);
    }
  };

  return (
    <div
      className={cn(
        "flex items-center gap-3 p-3 bg-secondary border border-border transition-all duration-200",
        isCurrentPlayer && "border-primary bg-primary/10"
      )}
    >
      <div className={cn(
        "w-8 h-8 flex items-center justify-center bg-muted",
        isHost && "bg-primary/20"
      )}>
        {isHost ? (
          <Crown className="w-4 h-4 text-primary" />
        ) : (
          <User className="w-4 h-4 text-muted-foreground" />
        )}
      </div>
      
      <span className={cn(
        "font-medium flex-1",
        isCurrentPlayer && "text-primary"
      )}>
        {name}
        {isCurrentPlayer && <span className="text-muted-foreground text-sm ml-2">(você)</span>}
      </span>
      
      {isHost && (
        <span className="role-badge bg-primary/20 border-primary text-primary">
          Host
        </span>
      )}

      <div className="flex items-center gap-1">
        {canDelegate && !isHost && onDelegate && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDelegate}
            className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10"
            aria-label={`Tornar ${name} host`}
            title="Tornar host"
          >
            <UserCog className="w-4 h-4" />
          </Button>
        )}
        {canRemove && onRemove && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRemove}
            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
            aria-label={`Remover ${name}`}
            title="Remover jogador"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

