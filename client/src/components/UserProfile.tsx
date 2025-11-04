import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useCelebration } from "@/components/CelebrationAnimation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { 
  User, 
  TrendingUp, 
  Zap, 
  Crown, 
  Trophy, 
  Star,
  Wallet,
  Coins,
  CheckCircle,
  Heart
} from "lucide-react";
import { ethers } from "ethers";

declare global {
  interface Window {
    ethereum?: any;
  }
}

interface UserProfileProps {
  userId: string;
}

export default function UserProfile({ userId }: UserProfileProps) {
  const [isVouchDialogOpen, setIsVouchDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const { triggerVouchCelebration } = useCelebration();
  const queryClient = useQueryClient();

  const [vouchAmount, setVouchAmount] = useState("1");
  const MIN_USDT_AMOUNT = 1;
  const MAX_USDT_AMOUNT = 100;

  const { data: profileUser, isLoading: profileLoading, error: profileError } = useQuery({
    queryKey: [`/api/users/${userId}`],
    retry: false,
  });

  const { data: dreamzLevels } = useQuery({
    queryKey: ["/api/dreamz-levels"],
    retry: false,
  });

  const { data: vouchStats } = useQuery({
    queryKey: [`/api/vouch/stats/${userId}`],
    retry: false,
  });

  const { data: contractInfo } = useQuery({
    queryKey: ["/api/vouch/contract-info"],
    retry: false,
  });

  // Get current user's wallet address for USDT balance
  const currentUserData = currentUser as any;
  const userWalletAddress = currentUserData?.walletAddress;

  // Fetch current user's USDT balance when wallet is connected
  const { data: usdtBalanceData } = useQuery({
    queryKey: [`/api/wallet/usdt-balance/${userWalletAddress}`],
    enabled: !!userWalletAddress,
    refetchOnWindowFocus: true,
    staleTime: 10000, // Consider data stale after 10 seconds
  });

  const currentUsdtBalance = usdtBalanceData?.balance || 0;

  // Get current user's dreamz level and multiplier for vouching
  const getCurrentUserLevel = () => {
    if (!currentUser || !dreamzLevels || !Array.isArray(dreamzLevels)) return null;
    return dreamzLevels.find((level: any) => 
      (currentUser.currentStreak || 0) >= level.minDays && 
      (level.maxDays === null || (currentUser.currentStreak || 0) <= level.maxDays)
    ) || dreamzLevels[0];
  };

  const currentUserLevel = getCurrentUserLevel();
  const baseAuraPoints = 50;
  const finalAuraPoints = currentUserLevel ? Math.round(baseAuraPoints * parseFloat(currentUserLevel.vouchingMultiplier || "1.0")) : baseAuraPoints;

  // Fetch vouch amount data for this user pair
  const { data: vouchAmountData, refetch: refetchVouchAmount } = useQuery({
    queryKey: [`/api/vouch/amount/${currentUser?.id}/${profileUser?.id}`],
    enabled: !!currentUser?.id && !!profileUser?.id && currentUser.id !== profileUser.id,
  });

  const totalVouchedAmount = vouchAmountData?.totalVouchedAmount || 0;
  const remainingAmount = vouchAmountData?.remainingAmount || 100;
  const canVouchMore = vouchAmountData?.canVouchMore || true;
  const vouchCount = vouchAmountData?.vouchCount || 0;

  const vouchMutation = useMutation({
    mutationFn: async (data: { vouchedUserId: string; usdtAmount: number; transactionHash: string }) => {
      return await apiRequest("POST", "/api/vouch/create", data);
    },
    onSuccess: (data) => {
      toast({
        title: "Vouch Successful!",
        description: `Awarded ${data.auraAwarded} aura points with ${data.multiplier}x multiplier`,
      });
      
      // Trigger celebration animation
      triggerVouchCelebration();
      
      setIsVouchDialogOpen(false);
      refetchVouchAmount(); // Refresh vouch amount data
      queryClient.invalidateQueries({ queryKey: ["/api/leaderboard"] });
      queryClient.invalidateQueries({ queryKey: [`/api/vouch/stats/${userId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/vouch/amount/${currentUser?.id}/${profileUser?.id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
    onError: (error: any) => {
      toast({
        title: "Vouch Failed",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  const handleVouchSubmit = async () => {
    if (!window.ethereum) {
      toast({
        title: "Wallet Required",
        description: "Please install MetaMask or another Web3 wallet",
        variant: "destructive",
      });
      return;
    }

    if (!currentUser?.walletAddress || !profileUser?.walletAddress) {
      toast({
        title: "Wallet Required",
        description: "Both users must have connected wallets",
        variant: "destructive",
      });
      return;
    }

    // Check if user has sufficient USDT balance
    if (parseInt(vouchAmount) > currentUsdtBalance) {
      toast({
        title: "Insufficient Balance",
        description: `You need ${vouchAmount} USDT but only have ${currentUsdtBalance.toFixed(2)} USDT in your wallet`,
        variant: "destructive",
      });
      return;
    }

    if (!contractInfo?.contractAddress || !contractInfo?.abi) {
      toast({
        title: "Contract Error",
        description: "Vouching contract not available",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      // Connect to wallet
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      // Check network
      const provider = new ethers.BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();
      const targetChainId = 8453; // CARV SVM Chain (Base-compatible)
      
      if (Number(network.chainId) !== targetChainId) {
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: `0x${targetChainId.toString(16)}` }],
          });
        } catch (switchError: any) {
          if (switchError.code === 4902) {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: `0x${targetChainId.toString(16)}`,
                chainName: 'CARV SVM Chain',
                nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
                rpcUrls: ['https://mainnet.base.org'],
                blockExplorerUrls: ['https://basescan.org'],
              }],
            });
          } else {
            throw switchError;
          }
        }
      }

      // Create contract instances
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractInfo.contractAddress, contractInfo.abi, signer);
      
      // USDT contract for approval (Base Mainnet for Ethereum wallets - CARV SVM uses Solana tokens)
      const usdtContractAddress = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'; // Base Mainnet USDT
      const usdtABI = [
        {
          "constant": false,
          "inputs": [
            {"name": "_spender", "type": "address"},
            {"name": "_value", "type": "uint256"}
          ],
          "name": "approve",
          "outputs": [{"name": "", "type": "bool"}],
          "payable": false,
          "stateMutability": "nonpayable",
          "type": "function"
        }
      ];
      const usdtContract = new ethers.Contract(usdtContractAddress, usdtABI, signer);
      
      const usdtAmountWei = ethers.parseUnits(vouchAmount, 6); // USDT has 6 decimals
      
      // Step 1: Approve USDT for the contract
      toast({
        title: "Approving USDT",
        description: "Please approve USDT spending in your wallet...",
      });
      
      const approvalTx = await usdtContract.approve(contractInfo.contractAddress, usdtAmountWei);
      await approvalTx.wait();
      
      // Step 2: Call vouch function
      toast({
        title: "Processing Vouch",
        description: "Please confirm the vouch transaction...",
      });
      
      const tx = await contract.vouch(profileUser.walletAddress, usdtAmountWei);

      // Wait for transaction confirmation
      const receipt = await tx.wait();

      // Record vouch in backend
      await vouchMutation.mutateAsync({
        vouchedUserId: userId,
        usdtAmount: parseFloat(vouchAmount),
        transactionHash: receipt.transactionHash
      });

    } catch (error: any) {
      console.error("Vouching error:", error);
      toast({
        title: "Transaction Failed",
        description: error.message || "Failed to complete vouch transaction",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case "Aura Vader": return <Crown className="w-4 h-4" />;
      case "Grinder": return <Trophy className="w-4 h-4" />;
      case "Dedicated": return <Star className="w-4 h-4" />;
      case "Attention Seeker": return <TrendingUp className="w-4 h-4" />;
      default: return <User className="w-4 h-4" />;
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case "Aura Vader": return "text-yellow-400";
      case "Grinder": return "text-green-400";
      case "Dedicated": return "text-emerald-400";
      case "Attention Seeker": return "text-purple-400";
      default: return "text-blue-400";
    }
  };

  const getUserLevel = (user: any) => {
    if (!user || !dreamzLevels || !Array.isArray(dreamzLevels)) return null;
    return dreamzLevels.find((level: any) => 
      (user.currentStreak || 0) >= level.minDays && 
      (level.maxDays === null || (user.currentStreak || 0) <= level.maxDays)
    ) || dreamzLevels[0];
  };

  const userLevel = getUserLevel(profileUser);

  // Handle loading state
  if (profileLoading) {
    return (
      <Card className="bg-black/40 border border-purple-500/20">
        <CardContent className="pt-6">
          <div className="text-center text-white/60">Loading user profile...</div>
        </CardContent>
      </Card>
    );
  }

  // Handle error state
  if (profileError || !profileUser) {
    return (
      <Card className="bg-black/40 border border-red-500/20">
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="text-red-400 text-xl mb-2">User Not Found</div>
            <div className="text-white/60">The user profile you're looking for doesn't exist or couldn't be loaded.</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const canVouch = currentUser && 
                  currentUser.id !== userId && 
                  currentUser.walletAddress && 
                  profileUser.walletAddress &&
                  canVouchMore;

  return (
    <div className="space-y-6">
      {/* Profile Header Card */}
      <div className="bg-gradient-to-br from-purple-900/40 via-black/60 to-cyan-900/40 border border-cyan-500/20 rounded-2xl p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-6">
            <Avatar className="w-20 h-20 ring-2 ring-cyan-500/50">
              <AvatarImage src={profileUser.profileImageUrl} />
              <AvatarFallback className="bg-gradient-to-br from-purple-500 to-cyan-500 text-white text-2xl font-bold">
                {profileUser.username?.[0]?.toUpperCase() || "?"}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-white text-3xl font-bold mb-1">{profileUser.username || "Anonymous"}</h1>
              {userLevel && (
                <div className="flex items-center gap-2">
                  <span className={`${getLevelColor(userLevel.name)}`}>
                    {getLevelIcon(userLevel.name)}
                  </span>
                  <span className="text-cyan-300 font-medium">{userLevel.name}</span>
                </div>
              )}
            </div>
          </div>
          
          {canVouch && (
            <Dialog open={isVouchDialogOpen} onOpenChange={setIsVouchDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold px-6 py-6 text-lg rounded-xl">
                  <Heart className="w-5 h-5 mr-2" />
                  {totalVouchedAmount > 0 ? `Vouch More (${remainingAmount.toFixed(2)} left)` : "Vouch"}
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-gradient-to-br from-black via-blue-950/50 to-cyan-950/50 border border-cyan-500/20 text-white">
                <DialogHeader>
                  <DialogTitle className="text-white flex items-center gap-2 text-xl">
                    <Coins className="w-5 h-5 text-cyan-400" />
                    Vouch for {profileUser.username}
                  </DialogTitle>
                </DialogHeader>
                
                <div className="space-y-6">
                  {/* Vouching Info */}
                  <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-4 space-y-3">
                    <div className="space-y-2">
                      <span className="text-white/80">Vouching Amount (USDT):</span>
                      <Input
                        type="number"
                        min={MIN_USDT_AMOUNT}
                        max={Math.min(MAX_USDT_AMOUNT, remainingAmount)}
                        value={vouchAmount}
                        onChange={(e) => setVouchAmount(Math.max(MIN_USDT_AMOUNT, Math.min(remainingAmount, parseInt(e.target.value) || MIN_USDT_AMOUNT)).toString())}
                        className="bg-black/20 border-cyan-500/30 text-white"
                        placeholder={`Enter amount (${MIN_USDT_AMOUNT}-${Math.min(MAX_USDT_AMOUNT, remainingAmount)})`}
                      />
                      <div className="text-sm text-white/60">
                        Available: {MIN_USDT_AMOUNT}-{Math.min(MAX_USDT_AMOUNT, remainingAmount).toFixed(2)} USDT
                        {totalVouchedAmount > 0 && (
                          <div className="text-blue-400">
                            Already vouched: {totalVouchedAmount.toFixed(2)} USDT ({vouchCount} times)
                          </div>
                        )}
                      </div>
                      
                      {/* USDT Balance Display */}
                      <div className="flex items-center justify-between bg-gray-800/50 rounded-lg p-3 mt-2">
                        <div className="flex items-center gap-2">
                          <Wallet className="w-4 h-4 text-blue-400" />
                          <span className="text-white/80">Your USDT Balance:</span>
                        </div>
                        <span className="text-blue-400 font-semibold">
                          {currentUsdtBalance.toFixed(2)} USDT
                        </span>
                      </div>
                      
                      {/* Insufficient Balance Warning */}
                      {parseInt(vouchAmount) > currentUsdtBalance && (
                        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                          <p className="text-red-400 text-sm">
                            ⚠️ Insufficient balance. You need {vouchAmount} USDT but only have {currentUsdtBalance.toFixed(2)} USDT.
                          </p>
                        </div>
                      )}
                    </div>
                    {currentUserLevel && (
                      <div className="flex items-center justify-between">
                        <span className="text-white/80">Your Level:</span>
                        <div className="flex items-center gap-2">
                          <span className={`${getLevelColor(currentUserLevel.name)}`}>
                            {getLevelIcon(currentUserLevel.name)}
                          </span>
                          <span className="text-white">{currentUserLevel.name}</span>
                          <Badge variant="outline" className="text-green-400 border-green-400">
                            {parseFloat(currentUserLevel.vouchingMultiplier || "1.0")}x
                          </Badge>
                        </div>
                      </div>
                    )}
                    <div className="flex items-center justify-between pt-2 border-t border-cyan-500/20">
                      <span className="text-white font-medium">Dreamz Award:</span>
                      <span className="text-cyan-400 font-bold">{parseInt(vouchAmount) * 10} points ({vouchAmount} × 10)</span>
                    </div>
                  </div>

                  {/* Instructions */}
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                    <h4 className="text-blue-300 font-medium mb-2">Smart Contract Vouching:</h4>
                    <ol className="text-blue-200 text-sm space-y-1 list-decimal list-inside">
                      <li>Click "Vouch Now" to open your wallet</li>
                      <li>First, approve {vouchAmount} USDT spending</li>
                      <li>Then, confirm the vouch transaction</li>
                      <li>The smart contract automatically distributes funds</li>
                    </ol>
                  </div>

                  {/* Submit Button */}
                  <Button
                    onClick={handleVouchSubmit}
                    disabled={isProcessing || vouchMutation.isPending || parseInt(vouchAmount) > currentUsdtBalance}
                    className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold disabled:opacity-50 py-6 text-lg rounded-xl"
                  >
                    {isProcessing || vouchMutation.isPending ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Processing Vouch...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        Vouch Now ({parseInt(vouchAmount) * 10} aura)
                      </div>
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}

          {!canVouchMore && totalVouchedAmount >= 100 && (
            <Badge variant="outline" className="text-green-400 border-green-400 px-4 py-2 text-sm">
              Max Vouched (100 USDT)
            </Badge>
          )}
          
          {totalVouchedAmount > 0 && canVouchMore && (
            <Badge variant="outline" className="text-cyan-400 border-cyan-400 px-4 py-2 text-sm">
              Vouched {totalVouchedAmount.toFixed(2)} USDT
            </Badge>
          )}
        </div>

        {/* User Stats - Gradient Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {/* Total Dreamz - Purple/Blue Gradient */}
          <div className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-purple-600/20 via-blue-600/20 to-purple-800/20 border border-purple-500/30 backdrop-blur-sm">
            <div className="text-center">
              <div className="text-white text-4xl font-bold mb-2">{(profileUser as any).dreamzPoints || 0}</div>
              <div className="text-purple-200 text-sm font-medium">Total Dreamz</div>
            </div>
            <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500/10 rounded-full blur-2xl"></div>
          </div>

          {/* Streak Days - Blue Gradient */}
          <div className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-blue-600/20 via-cyan-600/20 to-blue-800/20 border border-blue-500/30 backdrop-blur-sm">
            <div className="text-center">
              <div className="text-white text-4xl font-bold mb-2">{profileUser.currentStreak || 0}</div>
              <div className="text-blue-200 text-sm font-medium">Streak Days</div>
            </div>
            <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/10 rounded-full blur-2xl"></div>
          </div>

          {/* Vouches Received - Green Gradient */}
          <div className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-green-600/20 via-emerald-600/20 to-green-800/20 border border-green-500/30 backdrop-blur-sm">
            <div className="text-center">
              <div className="text-white text-4xl font-bold mb-2">{vouchStats?.vouchesReceived || 0}</div>
              <div className="text-green-200 text-sm font-medium">Vouches Received</div>
            </div>
            <div className="absolute top-0 right-0 w-20 h-20 bg-green-500/10 rounded-full blur-2xl"></div>
          </div>

          {/* USDT Received - Gold/Yellow Gradient */}
          <div className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-yellow-600/20 via-amber-600/20 to-yellow-800/20 border border-yellow-500/30 backdrop-blur-sm">
            <div className="text-center">
              <div className="text-white text-4xl font-bold mb-2">{Number((vouchStats as any)?.totalUsdcReceived || 0).toFixed(2)}</div>
              <div className="text-yellow-200 text-sm font-medium">USDT Received</div>
            </div>
            <div className="absolute top-0 right-0 w-20 h-20 bg-yellow-500/10 rounded-full blur-2xl"></div>
          </div>

          {/* Vouches Given - Pink/Rose Gradient */}
          <div className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-pink-600/20 via-rose-600/20 to-pink-800/20 border border-pink-500/30 backdrop-blur-sm">
            <div className="text-center">
              <div className="text-white text-4xl font-bold mb-2">{vouchStats?.vouchesGiven || 0}</div>
              <div className="text-pink-200 text-sm font-medium">Vouches Given</div>
            </div>
            <div className="absolute top-0 right-0 w-20 h-20 bg-pink-500/10 rounded-full blur-2xl"></div>
          </div>

          {/* USDT Given - Orange Gradient */}
          <div className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-orange-600/20 via-amber-600/20 to-orange-800/20 border border-orange-500/30 backdrop-blur-sm">
            <div className="text-center">
              <div className="text-white text-4xl font-bold mb-2">{Number((vouchStats as any)?.totalUsdcGiven || 0).toFixed(2)}</div>
              <div className="text-orange-200 text-sm font-medium">USDT Given</div>
            </div>
            <div className="absolute top-0 right-0 w-20 h-20 bg-orange-500/10 rounded-full blur-2xl"></div>
          </div>

          {/* Dreamz from Vouching - Cyan Gradient */}
          <div className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-cyan-600/20 via-teal-600/20 to-cyan-800/20 border border-cyan-500/30 backdrop-blur-sm">
            <div className="text-center">
              <div className="text-white text-4xl font-bold mb-2">{vouchStats?.totalDreamzReceived || 0}</div>
              <div className="text-cyan-200 text-sm font-medium">Dreamz from Vouches</div>
            </div>
            <div className="absolute top-0 right-0 w-20 h-20 bg-cyan-500/10 rounded-full blur-2xl"></div>
          </div>
        </div>
      </div>

      {/* Wallet Status Card */}
      <div className="bg-gradient-to-br from-gray-900/60 via-black/60 to-gray-900/60 border border-gray-500/20 rounded-2xl p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Wallet className="w-6 h-6 text-gray-300" />
            <span className="text-white text-lg font-medium">Wallet Status</span>
          </div>
          {profileUser.walletAddress ? (
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="text-green-400 border-green-400 px-3 py-1">
                Connected
              </Badge>
              <span className="text-white/80 font-mono text-sm bg-black/30 px-3 py-1 rounded-lg">
                {profileUser.walletAddress.slice(0, 6)}...{profileUser.walletAddress.slice(-4)}
              </span>
            </div>
          ) : (
            <Badge variant="outline" className="text-red-400 border-red-400 px-3 py-1">
              Not Connected
            </Badge>
          )}
        </div>
      </div>

      {/* Vouching Notice */}
      {!canVouch && currentUser && currentUser.id !== userId && (
        <div className="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-4">
          <p className="text-orange-300 text-sm">
            {!currentUser.walletAddress && "You need to connect your wallet to vouch for users."}
            {!profileUser.walletAddress && "This user needs to connect their wallet to receive vouches."}
            {!canVouchMore && "You have reached the maximum vouch amount (100 USDT) for this user."}
          </p>
        </div>
      )}
    </div>
  );
}