import { Badge } from "@/components/ui/badge";

export default function BetaIndicator() {
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Badge 
        variant="secondary" 
        className="bg-gradient-to-r from-orange-500/20 to-yellow-500/20 border border-orange-500/30 text-orange-400 text-xs font-bold uppercase tracking-wide shadow-lg backdrop-blur-sm"
      >
        BETA
      </Badge>
    </div>
  );
}