import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { depositVouch, getUSDTBalance } from "@/lib/vouchingSolana";
import { Wallet, Heart, Loader2, ExternalLink } from "lucide-react";
import type { User } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";
import { CARV_SVM } from "@shared/constants";

declare global {
  interface Window {
    solana?: any;
    phantom?: any;
    backpack?: any;
  }
}

interface VouchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipient: User;
}

export default function VouchModal({ open, onOpenChange, recipient }: VouchModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [usdtAmount, setUsdtAmount] = useState("10");
  const [usdtBalance, setUsdtBalance] = useState<number | null>(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);

  // Get Solana wallet object
  const getSolanaWallet = () => {
    if (window.backpack?.isBackpack) {
      return window.backpack;
    }
    if (window.phantom?.solana?.isPhantom) {
      return window.phantom.solana;
    }
    if (window.solana?.isPhantom) {
      return window.solana;
    }
    if (window.solana) {
      return window.solana;
    }
    return null;
  };

  // Load USDT balance when modal opens
  const loadBalance = async () => {
    const wallet = getSolanaWallet();
    if (!wallet || !wallet.publicKey) return;
    setIsLoadingBalance(true);
    try {
      const balance = await getUSDTBalance(wallet.publicKey.toString());
      setUsdtBalance(balance);
    } catch (error) {
      console.error("Error loading USDT balance:", error);
    } finally {
      setIsLoadingBalance(false);
    }
  };

  // Load balance when modal opens
  useEffect(() => {
    if (open) {
      loadBalance();
    }
  }, [open]);

  const vouchMutation = useMutation({
    mutationFn: async (amount: number) => {
      const wallet = getSolanaWallet();
      if (!wallet || !wallet.publicKey) {
        throw new Error("Please connect your Solana wallet first");
      }

      if (!recipient.walletAddress) {
        throw new Error("Recipient does not have a wallet address");
      }

      // Execute vouch transaction on Solana
      const signature = await depositVouch(
        recipient.walletAddress,
        amount,
        wallet.publicKey,
        wallet.signTransaction || wallet.signAllTransactions
      );

      // Confirm vouch on backend
      const response = await apiRequest('POST', '/api/vouch/confirm', {
        transactionHash: signature,
        recipientId: recipient.id,
        usdtAmount: amount,
      });

      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Vouch Successful! 🎉",
        description: `You vouched for ${recipient.username || recipient.walletAddress?.slice(0, 8)} with ${usdtAmount} USDT. They earned ${data.dreamzPoints} Dreamz Points!`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/leaderboard'] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${recipient.id}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/vouch/stats/${recipient.id}`] });
      if (user?.id) {
        queryClient.invalidateQueries({ queryKey: [`/api/users/${user.id}`] });
        queryClient.invalidateQueries({ queryKey: [`/api/vouch/stats/${user.id}`] });
      }
      onOpenChange(false);
      setUsdtAmount("10");
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Vouch Failed",
        description: error.message || "Failed to process vouch transaction",
      });
    },
  });

  const handleVouch = () => {
    // Check if trying to vouch for platform wallet (not allowed)
    if (recipient.walletAddress === CARV_SVM.PLATFORM_WALLET) {
      toast({
        variant: "destructive",
        title: "Cannot Vouch",
        description: "You cannot vouch for the platform wallet address",
      });
      return;
    }

    const amount = parseFloat(usdtAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        variant: "destructive",
        title: "Invalid Amount",
        description: "Please enter a valid USDT amount",
      });
      return;
    }

    if (amount < 1) {
      toast({
        variant: "destructive",
        title: "Minimum Amount",
        description: "Minimum vouch amount is 1 USDT",
      });
      return;
    }

    if (usdtBalance !== null && amount > usdtBalance) {
      toast({
        variant: "destructive",
        title: "Insufficient Balance",
        description: `You have ${usdtBalance.toFixed(2)} USDT but trying to vouch ${amount} USDT`,
      });
      return;
    }

    vouchMutation.mutate(amount);
  };

  const recipientAmount = parseFloat(usdtAmount || "0") * 0.7;
  const platformAmount = parseFloat(usdtAmount || "0") * 0.3;
  const dreamzPoints = Math.floor(parseFloat(usdtAmount || "0") * 10); // 1 USDT = 10 Dreamz Points
  
  const wallet = getSolanaWallet();
  const publicKey = wallet?.publicKey;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-gradient-to-br from-cyan-900/40 via-blue-900/40 to-cyan-900/40 backdrop-blur-lg border border-cyan-500/30 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl font-bold text-transparent bg-gradient-to-r from-cyan-300 to-blue-400 bg-clip-text">
            <Heart className="w-6 h-6 text-cyan-400" />
            Vouch for {recipient.username || "User"}
          </DialogTitle>
          <DialogDescription className="text-cyan-200">
            Support this user by vouching with USDT on CARV SVM Chain
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Recipient Info */}
          <div className="p-4 bg-cyan-900/30 rounded-xl border border-cyan-500/20">
            <div className="flex items-center gap-3">
              {recipient.profileImageUrl ? (
                <img 
                  src={recipient.profileImageUrl} 
                  alt={recipient.username || "User"} 
                  className="w-12 h-12 rounded-full border-2 border-cyan-500/30"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500/30 to-blue-500/30 flex items-center justify-center border border-cyan-500/30">
                  <Wallet className="w-6 h-6 text-cyan-400" />
                </div>
              )}
              <div className="flex-1">
                <p className="font-bold text-white">{recipient.username || "Anonymous"}</p>
                <p className="text-xs text-cyan-300 font-mono">
                  {recipient.walletAddress?.slice(0, 12)}...{recipient.walletAddress?.slice(-8)}
                </p>
              </div>
            </div>
          </div>

          {/* USDT Balance */}
          {getSolanaWallet()?.publicKey && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-cyan-300">Your USDT Balance:</span>
              {isLoadingBalance ? (
                <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
              ) : usdtBalance !== null ? (
                <span className="font-bold text-white">{usdtBalance.toFixed(2)} USDT</span>
              ) : (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={loadBalance}
                  className="text-cyan-400 hover:text-cyan-300 h-auto p-0"
                >
                  Load Balance
                </Button>
              )}
            </div>
          )}

          {/* Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="usdt-amount" className="text-cyan-200">
              USDT Amount
            </Label>
            <Input
              id="usdt-amount"
              type="number"
              min="1"
              step="1"
              value={usdtAmount}
              onChange={(e) => setUsdtAmount(e.target.value)}
              placeholder="Enter USDT amount"
              className="bg-cyan-900/30 border-cyan-500/30 text-white placeholder:text-cyan-300/50 focus:border-cyan-500/50"
              disabled={vouchMutation.isPending}
              data-testid="input-vouch-amount"
            />
            <p className="text-xs text-cyan-300">Minimum: 1 USDT</p>
          </div>

          {/* Distribution Breakdown */}
          {parseFloat(usdtAmount || "0") > 0 && (
            <div className="p-4 bg-cyan-900/30 rounded-xl border border-cyan-500/20 space-y-2">
              <p className="text-sm font-bold text-cyan-200 mb-2">Distribution:</p>
              <div className="flex justify-between text-sm">
                <span className="text-cyan-300">To Recipient (70%):</span>
                <span className="font-bold text-white">{recipientAmount.toFixed(2)} USDT</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-cyan-300">To Platform (30%):</span>
                <span className="font-bold text-white">{platformAmount.toFixed(2)} USDT</span>
              </div>
              <div className="flex justify-between text-sm pt-2 border-t border-cyan-500/20">
                <span className="text-cyan-300">Dreamz Points Awarded:</span>
                <span className="font-bold text-cyan-400">{dreamzPoints} DP</span>
              </div>
            </div>
          )}

          {/* Wallet Connection Warning */}
          {!publicKey && (
            <div className="p-4 bg-yellow-900/30 rounded-xl border border-yellow-500/30">
              <p className="text-sm text-yellow-200">
                <Wallet className="w-4 h-4 inline mr-2" />
                Please connect your Solana wallet to vouch
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={vouchMutation.isPending}
              className="flex-1 border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20"
              data-testid="button-cancel-vouch"
            >
              Cancel
            </Button>
            <Button
              onClick={handleVouch}
              disabled={!publicKey || vouchMutation.isPending || parseFloat(usdtAmount || "0") <= 0}
              className="flex-1 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold"
              data-testid="button-confirm-vouch"
            >
              {vouchMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Heart className="w-4 h-4 mr-2" />
                  Vouch with {usdtAmount} USDT
                </>
              )}
            </Button>
          </div>

          {/* Info */}
          <p className="text-xs text-cyan-300 text-center">
            Transaction on CARV SVM Testnet • View on{" "}
            <a
              href="https://solscan.io"
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-400 hover:underline inline-flex items-center gap-1"
            >
              Solscan
              <ExternalLink className="w-3 h-3" />
            </a>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
