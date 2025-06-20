import { Badge } from "@/components/ui/badge";

export default function BetaIndicator() {
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Badge 
        variant="secondary" 
        className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/30 text-blue-400 text-sm font-bold uppercase tracking-wide shadow-lg backdrop-blur-sm px-4 py-2"
      >
        BETA
      </Badge>
    </div>
  );
}