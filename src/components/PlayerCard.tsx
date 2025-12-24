import { cn } from "@/lib/utils";
import { Crown, User } from "lucide-react";

interface PlayerCardProps {
  name: string;
  isHost?: boolean;
  isCurrentPlayer?: boolean;
}

export function PlayerCard({ name, isHost, isCurrentPlayer }: PlayerCardProps) {
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
    </div>
  );
}

