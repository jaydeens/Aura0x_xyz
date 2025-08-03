import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
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
  const queryClient = useQueryClient();

  const [vouchAmount, setVouchAmount] = useState("1");
  const MIN_USDC_AMOUNT = 1;
  const MAX_USDC_AMOUNT = 100;

  const { data: profileUser, isLoading: profileLoading, error: profileError } = useQuery({
    queryKey: [`/api/users/${userId}`],
    retry: false,
  });

  const { data: auraLevels } = useQuery({
    queryKey: ["/api/aura-levels"],
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

  // Get current user's wallet address for USDC balance
  const currentUserData = currentUser as any;
  const userWalletAddress = currentUserData?.walletAddress;

  // Fetch current user's USDC balance when wallet is connected
  const { data: usdcBalanceData } = useQuery({
    queryKey: [`/api/wallet/usdc-balance/${userWalletAddress}`],
    enabled: !!userWalletAddress,
    refetchOnWindowFocus: true,
    staleTime: 10000, // Consider data stale after 10 seconds
  });

  const currentUsdcBalance = usdcBalanceData?.balance || 0;

  // Get current user's aura level and multiplier for vouching
  const getCurrentUserLevel = () => {
    if (!currentUser || !auraLevels || !Array.isArray(auraLevels)) return null;
    return auraLevels.find((level: any) => 
      (currentUser.currentStreak || 0) >= level.minDays && 
      (level.maxDays === null || (currentUser.currentStreak || 0) <= level.maxDays)
    ) || auraLevels[0];
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
    mutationFn: async (data: { vouchedUserId: string; usdcAmount: number; transactionHash: string }) => {
      return await apiRequest("POST", "/api/vouch/create", data);
    },
    onSuccess: (data) => {
      toast({
        title: "Vouch Successful!",
        description: `Awarded ${data.auraAwarded} aura points with ${data.multiplier}x multiplier`,
      });
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

    // Check if user has sufficient USDC balance
    if (parseInt(vouchAmount) > currentUsdcBalance) {
      toast({
        title: "Insufficient Balance",
        description: `You need ${vouchAmount} USDC but only have ${currentUsdcBalance.toFixed(2)} USDC in your wallet`,
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
      const targetChainId = 8453; // Base Mainnet
      
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
                chainName: 'Base Mainnet',
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
      
      // USDC contract for approval
      const usdcContractAddress = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'; // Base Mainnet USDC
      const usdcABI = [
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
      const usdcContract = new ethers.Contract(usdcContractAddress, usdcABI, signer);
      
      const usdcAmountWei = ethers.parseUnits(vouchAmount, 6); // USDC has 6 decimals
      
      // Step 1: Approve USDC for the contract
      toast({
        title: "Approving USDC",
        description: "Please approve USDC spending in your wallet...",
      });
      
      const approvalTx = await usdcContract.approve(contractInfo.contractAddress, usdcAmountWei);
      await approvalTx.wait();
      
      // Step 2: Call vouch function
      toast({
        title: "Processing Vouch",
        description: "Please confirm the vouch transaction...",
      });
      
      const tx = await contract.vouch(profileUser.walletAddress, usdcAmountWei);

      // Wait for transaction confirmation
      const receipt = await tx.wait();

      // Record vouch in backend
      await vouchMutation.mutateAsync({
        vouchedUserId: userId,
        usdcAmount: parseFloat(vouchAmount),
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
    if (!user || !auraLevels || !Array.isArray(auraLevels)) return null;
    return auraLevels.find((level: any) => 
      (user.currentStreak || 0) >= level.minDays && 
      (level.maxDays === null || (user.currentStreak || 0) <= level.maxDays)
    ) || auraLevels[0];
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
    <Card className="bg-black/40 border border-purple-500/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="w-16 h-16">
              <AvatarImage src={profileUser.profileImageUrl} />
              <AvatarFallback className="bg-purple-500 text-white text-xl">
                {profileUser.username?.[0]?.toUpperCase() || "?"}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-white text-xl">{profileUser.username || "Anonymous"}</CardTitle>
              {userLevel && (
                <div className="flex items-center gap-2 mt-1">
                  <span className={`${getLevelColor(userLevel.name)}`}>
                    {getLevelIcon(userLevel.name)}
                  </span>
                  <span className="text-white/80">{userLevel.name}</span>
                </div>
              )}
            </div>
          </div>
          
          {canVouch && (
            <Dialog open={isVouchDialogOpen} onOpenChange={setIsVouchDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white">
                  <Heart className="w-4 h-4 mr-2" />
                  {totalVouchedAmount > 0 ? `Vouch More (${remainingAmount.toFixed(2)} left)` : "Vouch"}
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-black/90 border border-purple-500/20 text-white">
                <DialogHeader>
                  <DialogTitle className="text-white flex items-center gap-2">
                    <Coins className="w-5 h-5 text-purple-400" />
                    Vouch for {profileUser.username}
                  </DialogTitle>
                </DialogHeader>
                
                <div className="space-y-6">
                  {/* Vouching Info */}
                  <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4 space-y-3">
                    <div className="space-y-2">
                      <span className="text-white/80">Vouching Amount (USDC):</span>
                      <Input
                        type="number"
                        min={MIN_USDC_AMOUNT}
                        max={Math.min(MAX_USDC_AMOUNT, remainingAmount)}
                        value={vouchAmount}
                        onChange={(e) => setVouchAmount(Math.max(MIN_USDC_AMOUNT, Math.min(remainingAmount, parseInt(e.target.value) || MIN_USDC_AMOUNT)).toString())}
                        className="bg-black/20 border-purple-500/30 text-white"
                        placeholder={`Enter amount (${MIN_USDC_AMOUNT}-${Math.min(MAX_USDC_AMOUNT, remainingAmount)})`}
                      />
                      <div className="text-sm text-white/60">
                        Available: {MIN_USDC_AMOUNT}-{Math.min(MAX_USDC_AMOUNT, remainingAmount).toFixed(2)} USDC
                        {totalVouchedAmount > 0 && (
                          <div className="text-blue-400">
                            Already vouched: {totalVouchedAmount.toFixed(2)} USDC ({vouchCount} times)
                          </div>
                        )}
                      </div>
                      
                      {/* USDC Balance Display */}
                      <div className="flex items-center justify-between bg-gray-800/50 rounded-lg p-3 mt-2">
                        <div className="flex items-center gap-2">
                          <Wallet className="w-4 h-4 text-blue-400" />
                          <span className="text-white/80">Your USDC Balance:</span>
                        </div>
                        <span className="text-blue-400 font-semibold">
                          {currentUsdcBalance.toFixed(2)} USDC
                        </span>
                      </div>
                      
                      {/* Insufficient Balance Warning */}
                      {parseInt(vouchAmount) > currentUsdcBalance && (
                        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                          <p className="text-red-400 text-sm">
                            ⚠️ Insufficient balance. You need {vouchAmount} USDC but only have {currentUsdcBalance.toFixed(2)} USDC.
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
                    <div className="flex items-center justify-between pt-2 border-t border-purple-500/20">
                      <span className="text-white font-medium">Aura Award:</span>
                      <span className="text-purple-400 font-bold">{parseInt(vouchAmount) * 10} points ({vouchAmount} × 10)</span>
                    </div>
                  </div>

                  {/* Instructions */}
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                    <h4 className="text-blue-300 font-medium mb-2">Smart Contract Vouching:</h4>
                    <ol className="text-blue-200 text-sm space-y-1 list-decimal list-inside">
                      <li>Click "Vouch Now" to open your wallet</li>
                      <li>First, approve {vouchAmount} USDC spending</li>
                      <li>Then, confirm the vouch transaction</li>
                      <li>The smart contract automatically distributes funds</li>
                    </ol>
                  </div>

                  {/* Submit Button */}
                  <Button
                    onClick={handleVouchSubmit}
                    disabled={isProcessing || vouchMutation.isPending || parseInt(vouchAmount) > currentUsdcBalance}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium disabled:opacity-50"
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
            <Badge variant="outline" className="text-green-400 border-green-400">
              Max Vouched (100 USDC)
            </Badge>
          )}
          
          {totalVouchedAmount > 0 && canVouchMore && (
            <Badge variant="outline" className="text-blue-400 border-blue-400">
              Vouched {totalVouchedAmount.toFixed(2)} USDC
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* User Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3 text-center">
            <div className="text-purple-400 text-2xl font-bold">{(profileUser as any).auraPoints || 0}</div>
            <div className="text-white/60 text-sm">Total Aura</div>
          </div>
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 text-center">
            <div className="text-blue-400 text-2xl font-bold">{profileUser.currentStreak || 0}</div>
            <div className="text-white/60 text-sm">Streak Days</div>
          </div>
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 text-center">
            <div className="text-green-400 text-2xl font-bold">{vouchStats?.vouchesReceived || 0}</div>
            <div className="text-white/60 text-sm">Vouches Received</div>
          </div>
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 text-center">
            <div className="text-yellow-400 text-2xl font-bold">{Number((vouchStats as any)?.totalUsdcReceived || 0).toFixed(2)}</div>
            <div className="text-white/60 text-sm">USDC Received</div>
          </div>
        </div>

        {/* Wallet Status */}
        <div className="bg-gray-500/10 border border-gray-500/20 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-gray-400" />
              <span className="text-white">Wallet Status</span>
            </div>
            {profileUser.walletAddress ? (
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-green-400 border-green-400">
                  Connected
                </Badge>
                <span className="text-white/60 font-mono text-sm">
                  {profileUser.walletAddress.slice(0, 6)}...{profileUser.walletAddress.slice(-4)}
                </span>
              </div>
            ) : (
              <Badge variant="outline" className="text-red-400 border-red-400">
                Not Connected
              </Badge>
            )}
          </div>
        </div>

        {/* Vouching Notice */}
        {!canVouch && currentUser && currentUser.id !== userId && (
          <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4">
            <p className="text-orange-300 text-sm">
              {!currentUser.walletAddress && "You need to connect your wallet to vouch for users."}
              {!profileUser.walletAddress && "This user needs to connect their wallet to receive vouches."}
              {!canVouchMore && "You have reached the maximum vouch amount (100 USDC) for this user."}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}