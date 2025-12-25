import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface WordRevealProps {
  word: string;
  isImpostor: boolean;
  isAnonymous?: boolean;
}

export function WordReveal({ word, isImpostor, isAnonymous = false }: WordRevealProps) {
  // In anonymous mode, hide all colors and role information
  if (isAnonymous) {
    return (
      <Card className="border-2 border-border animate-reveal">
        <CardContent className="p-8 text-center space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Sua palavra é
            </p>
            <h2 className="text-4xl font-bold font-mono text-foreground">
              {word}
            </h2>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Normal mode - show colors and role
  return (
    <Card className={cn(
      "border-2 animate-reveal",
      isImpostor ? "border-impostor glow-impostor" : "border-crewmate glow-crewmate"
    )}>
      <CardContent className="p-8 text-center space-y-4">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            {isImpostor ? "Você é o" : "Sua palavra é"}
          </p>
          <h2 className={cn(
            "text-4xl font-bold font-mono",
            isImpostor ? "text-impostor" : "text-crewmate"
          )}>
            {word}
          </h2>
        </div>
        
        <div className="pt-4 border-t border-border">
          <span className={cn(
            "role-badge inline-block",
            isImpostor ? "role-impostor" : "role-crewmate"
          )}>
            {isImpostor ? "IMPOSTOR" : "CREWMATE"}
          </span>
        </div>

        {isImpostor && (
          <p className="text-sm text-muted-foreground pt-2">
            Todos os outros receberam uma palavra diferente. Tente descobrir qual é!
          </p>
        )}
      </CardContent>
    </Card>
  );
}

