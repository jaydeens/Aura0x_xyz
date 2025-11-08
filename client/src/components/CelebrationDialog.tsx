import { useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Sparkles, 
  Heart, 
  ExternalLink, 
  Check,
  Trophy,
  Coins
} from "lucide-react";
import { useCelebration } from "@/components/CelebrationAnimation";
import { CARV_SVM } from "@shared/constants";

interface CelebrationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "slp" | "vouch";
  data: {
    // For SLP purchases
    slpAmount?: number;
    usdtAmount?: number;
    txHash?: string;
    // For vouching
    recipientName?: string;
    dreamzAwarded?: number;
    vouchAmount?: number;
    multiplier?: number;
  };
}

export default function CelebrationDialog({ 
  open, 
  onOpenChange, 
  type,
  data 
}: CelebrationDialogProps) {
  const { triggerSteezeCelebration, triggerVouchCelebration } = useCelebration();

  useEffect(() => {
    if (open) {
      // Trigger confetti when dialog opens
      if (type === "slp") {
        triggerSteezeCelebration();
      } else {
        triggerVouchCelebration();
      }
    }
  }, [open, type, triggerSteezeCelebration, triggerVouchCelebration]);

  const explorerUrl = data.txHash 
    ? `${CARV_SVM.EXPLORER_URL}/tx/${data.txHash}`
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-gradient-to-br from-card to-card/80 border-primary/20">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            {type === "slp" ? (
              <>
                <Sparkles className="w-6 h-6 text-purple-400 animate-pulse" />
                <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  SLP Acquired!
                </span>
              </>
            ) : (
              <>
                <Heart className="w-6 h-6 text-green-400 animate-pulse" />
                <span className="bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
                  Vouch Successful!
                </span>
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Success Icon */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full blur-xl opacity-50 animate-pulse"></div>
              <div className="relative bg-gradient-to-r from-purple-500 to-pink-500 rounded-full p-4">
                <Check className="w-12 h-12 text-white" />
              </div>
            </div>
          </div>

          {/* Transaction Details */}
          <div className="bg-background/50 rounded-lg p-4 space-y-3 border border-primary/10">
            {type === "slp" ? (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">SLP Purchased</span>
                  <div className="flex items-center gap-2">
                    <Coins className="w-4 h-4 text-purple-400" />
                    <span className="text-xl font-bold text-purple-400">
                      {data.slpAmount?.toLocaleString()}
                    </span>
                    <Badge variant="secondary" className="ml-1">SLP</Badge>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">USDT Spent</span>
                  <span className="font-mono text-lg">
                    {data.usdtAmount?.toFixed(2)} USDT
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Exchange Rate</span>
                  <span className="text-muted-foreground">
                    100 SLP per 1 USDT
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Vouched For</span>
                  <span className="font-bold text-green-400">
                    {data.recipientName}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">USDT Vouched</span>
                  <span className="font-mono text-lg">
                    {data.vouchAmount?.toFixed(2)} USDT
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">DRMZ Awarded</span>
                  <div className="flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-yellow-400" />
                    <span className="text-xl font-bold text-yellow-400">
                      {data.dreamzAwarded?.toLocaleString()}
                    </span>
                  </div>
                </div>
                {data.multiplier && data.multiplier > 1 && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Multiplier</span>
                    <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500">
                      {data.multiplier}x
                    </Badge>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Transaction Hash */}
          {explorerUrl && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground text-center">
                Transaction confirmed on CARV SVM Chain
              </p>
              <a
                href={explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors"
              >
                View on Explorer
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}

          {/* Success Message */}
          <div className="text-center space-y-2">
            <p className="text-muted-foreground">
              {type === "slp" 
                ? "Neural tokens successfully added to your vault"
                : `Your support has been recorded on-chain`
              }
            </p>
          </div>

          {/* Close Button */}
          <Button
            onClick={() => onOpenChange(false)}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            data-testid="button-close-celebration"
          >
            Awesome!
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
