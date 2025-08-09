import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BackButtonProps {
  onClick: () => void;
  text?: string;
  className?: string;
}

export default function BackButton({ onClick, text = "Back", className = "" }: BackButtonProps) {
  return (
    <Button 
      variant="ghost" 
      size="sm" 
      onClick={onClick} 
      className={`hover:bg-[var(--surface-alt)] focus-visible:ring-2 focus-visible:ring-[var(--focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)] ${className}`}
      style={{ color: 'var(--text)' }}
    >
      <ArrowLeft className="h-4 w-4 mr-2" />
      {text}
    </Button>
  );
}