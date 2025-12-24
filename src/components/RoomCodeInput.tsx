import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface RoomCodeInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function RoomCodeInput({ value, onChange, disabled }: RoomCodeInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [focused, setFocused] = useState(false);

  const handleChange = (index: number, char: string) => {
    const newValue = value.split("");
    newValue[index] = char.toUpperCase();
    const result = newValue.join("").slice(0, 4);
    onChange(result);

    if (char && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !value[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").toUpperCase().slice(0, 4);
    onChange(pasted);
    inputRefs.current[Math.min(pasted.length, 3)]?.focus();
  };

  return (
    <div className="flex gap-3 justify-center">
      {[0, 1, 2, 3].map((index) => (
        <input
          key={index}
          ref={(el) => (inputRefs.current[index] = el)}
          type="text"
          maxLength={1}
          disabled={disabled}
          value={value[index] || ""}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className={cn(
            "w-14 h-16 text-center text-2xl font-mono font-bold bg-secondary border-2 border-border text-foreground transition-all duration-200",
            "focus:outline-none focus:border-primary focus:ring-0",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            focused && "border-primary/50"
          )}
        />
      ))}
    </div>
  );
}

