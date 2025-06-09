import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { 
  User, 
  TrendingUp, 
  Zap, 
  Crown, 
  Trophy, 
  Star,
  Wallet,
  ExternalLink,
  Coins,
  CheckCircle,
  Heart
} from "lucide-react";

interface UserProfileProps {
  userId: string;
}

export default function UserProfile({ userId }: UserProfileProps) {
  const [isVouchDialogOpen, setIsVouchDialogOpen] = useState(false);
  const [transactionHash, setTransactionHash] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const REQUIRED_ETH_AMOUNT = 0.0001;

  const { data: profileUser } = useQuery({
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

  const vouchMutation = useMutation({
    mutationFn: async (data: { vouchedUserId: string; ethAmount: number; transactionHash: string }) => {
      return await apiRequest("POST", "/api/vouch/create", data);
    },
    onSuccess: (data) => {
      toast({
        title: "Vouch Successful!",
        description: `Awarded ${data.auraAwarded} aura points with ${data.multiplier}x multiplier`,
      });
      setTransactionHash("");
      setIsVouchDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/leaderboard"] });
      queryClient.invalidateQueries({ queryKey: [`/api/vouch/stats/${userId}`] });
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
    if (!transactionHash) {
      toast({
        title: "Missing Transaction",
        description: "Please enter the transaction hash",
        variant: "destructive",
      });
      return;
    }

    if (!currentUser?.walletAddress) {
      toast({
        title: "Wallet Required",
        description: "Please connect your wallet to vouch",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      await vouchMutation.mutateAsync({
        vouchedUserId: userId,
        ethAmount: REQUIRED_ETH_AMOUNT,
        transactionHash
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

  if (!profileUser) {
    return (
      <Card className="bg-black/40 border border-purple-500/20">
        <CardContent className="pt-6">
          <div className="text-center text-white/60">Loading user profile...</div>
        </CardContent>
      </Card>
    );
  }

  const canVouch = currentUser && 
                  currentUser.id !== userId && 
                  currentUser.walletAddress && 
                  profileUser.walletAddress;

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
                  Vouch
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
                    <div className="flex items-center justify-between">
                      <span className="text-white/80">Required Amount:</span>
                      <Badge variant="outline" className="text-purple-400 border-purple-400">
                        {REQUIRED_ETH_AMOUNT} ETH
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-white/80">They receive:</span>
                      <span className="text-green-400">{(REQUIRED_ETH_AMOUNT * 0.7).toFixed(6)} ETH (70%)</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-white/80">Platform fee:</span>
                      <span className="text-white/60">{(REQUIRED_ETH_AMOUNT * 0.3).toFixed(6)} ETH (30%)</span>
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
                      <span className="text-purple-400 font-bold">{finalAuraPoints} points</span>
                    </div>
                  </div>

                  {/* Instructions */}
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                    <h4 className="text-blue-300 font-medium mb-2">How to vouch:</h4>
                    <ol className="text-blue-200 text-sm space-y-1 list-decimal list-inside">
                      <li>Send exactly {REQUIRED_ETH_AMOUNT} ETH to their wallet:</li>
                      <li className="ml-4 text-purple-300 font-mono break-all">{profileUser.walletAddress}</li>
                      <li>Copy the transaction hash and paste it below</li>
                      <li>Click "Confirm Vouch" to complete the process</li>
                    </ol>
                  </div>

                  {/* Transaction Hash Input */}
                  <div className="space-y-3">
                    <label className="text-white text-sm font-medium">Transaction Hash</label>
                    <input
                      value={transactionHash}
                      onChange={(e) => setTransactionHash(e.target.value)}
                      placeholder="Enter blockchain transaction hash..."
                      className="w-full bg-black/20 border border-white/20 rounded-lg px-3 py-2 text-white placeholder:text-white/40 focus:border-purple-400 focus:outline-none"
                    />
                  </div>

                  {/* Submit Button */}
                  <Button
                    onClick={handleVouchSubmit}
                    disabled={!transactionHash || isProcessing || vouchMutation.isPending}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium"
                  >
                    {isProcessing || vouchMutation.isPending ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Processing Vouch...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        Confirm Vouch ({finalAuraPoints} aura)
                      </div>
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* User Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3 text-center">
            <div className="text-purple-400 text-2xl font-bold">{profileUser.totalAura || 0}</div>
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
            <div className="text-yellow-400 text-2xl font-bold">{vouchStats?.totalEthReceived?.toFixed(4) || "0.0000"}</div>
            <div className="text-white/60 text-sm">ETH Received</div>
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
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}