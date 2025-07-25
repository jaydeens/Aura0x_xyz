import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Coins, 
  User, 
  TrendingUp, 
  Zap, 
  Crown, 
  Trophy, 
  Star,
  CheckCircle,
  ExternalLink,
  Wallet
} from "lucide-react";

interface VouchFormProps {
  preselectedUserId?: string;
}

export default function VouchForm({ preselectedUserId }: VouchFormProps) {
  const [selectedUserId, setSelectedUserId] = useState(preselectedUserId || "");
  const [transactionHash, setTransactionHash] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fixed ETH amount for vouching
  const REQUIRED_ETH_AMOUNT = 0.0001;

  const { data: leaderboard } = useQuery({
    queryKey: ["/api/leaderboard"],
    retry: false,
  });

  const { data: auraLevels } = useQuery({
    queryKey: ["/api/aura-levels"],
    retry: false,
  });

  const { data: contractInfo } = useQuery({
    queryKey: ["/api/vouch/contract-info"],
    retry: false,
  });

  // Get current user's aura level and multiplier
  const getUserLevel = () => {
    if (!user || !auraLevels || !Array.isArray(auraLevels)) return null;
    return auraLevels.find((level: any) => 
      (user.currentStreak || 0) >= level.minDays && 
      (level.maxDays === null || (user.currentStreak || 0) <= level.maxDays)
    ) || auraLevels[0];
  };

  const userLevel = getUserLevel();
  const baseAuraPoints = 50;
  const finalAuraPoints = userLevel ? Math.round(baseAuraPoints * parseFloat(userLevel.vouchingMultiplier || "1.0")) : baseAuraPoints;

  const vouchMutation = useMutation({
    mutationFn: async (data: { vouchedUserId: string; ethAmount: number; transactionHash: string }) => {
      return await apiRequest("POST", "/api/vouch/create", data);
    },
    onSuccess: (data) => {
      toast({
        title: "Vouch Successful!",
        description: `Awarded ${data.auraAwarded} aura points (${data.multiplier}x multiplier)`,
      });
      setSelectedUserId("");
      setTransactionHash("");
      queryClient.invalidateQueries({ queryKey: ["/api/leaderboard"] });
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

  const handleSubmit = async () => {
    if (!selectedUserId || !transactionHash) {
      toast({
        title: "Missing Information",
        description: "Please select a user and enter transaction hash",
        variant: "destructive",
      });
      return;
    }

    if (!user?.walletAddress) {
      toast({
        title: "Wallet Required",
        description: "Please connect your wallet to vouch for users",
        variant: "destructive",
      });
      return;
    }

    const selectedUser = leaderboard?.find((u: any) => u.id === selectedUserId);
    if (!selectedUser) {
      toast({
        title: "User Not Found",
        description: "Please select a valid user",
        variant: "destructive",
      });
      return;
    }

    // Calculate final aura points for preview
    const userAuraLevel = auraLevels?.find((level: any) => 
      (user.currentStreak || 0) >= level.minDays && 
      (level.maxDays === null || (user.currentStreak || 0) <= level.maxDays)
    ) || auraLevels?.[0];
    
    const finalAura = userAuraLevel ? 
      Math.round(50 * parseFloat(userAuraLevel.vouchingMultiplier || "1.0")) : 50;

    setIsProcessing(true);
    try {
      await vouchMutation.mutateAsync({
        vouchedUserId: selectedUserId,
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

  if (!user || !user.walletAddress) {
    return (
      <Card className="bg-black/40 border border-purple-500/20">
        <CardContent className="pt-6">
          <div className="text-center text-white/60">
            <Wallet className="w-12 h-12 mx-auto mb-4 text-purple-400" />
            <p>Connect your wallet to vouch for other users</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-black/40 border border-purple-500/20">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Coins className="w-5 h-5 text-purple-400" />
          Vouch with ETH
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Vouching Info */}
        <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-white/80">Required Amount:</span>
            <Badge variant="outline" className="text-purple-400 border-purple-400">
              {REQUIRED_ETH_AMOUNT} ETH
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-white/80">Base Aura Points:</span>
            <span className="text-white">{baseAuraPoints}</span>
          </div>
          {userLevel && (
            <div className="flex items-center justify-between">
              <span className="text-white/80">Your Level:</span>
              <div className="flex items-center gap-2">
                <span className={`${getLevelColor(userLevel.name)}`}>
                  {getLevelIcon(userLevel.name)}
                </span>
                <span className="text-white">{userLevel.name}</span>
                <Badge variant="outline" className="text-green-400 border-green-400">
                  {parseFloat(userLevel.vouchingMultiplier || "1.0")}x
                </Badge>
              </div>
            </div>
          )}
          <div className="flex items-center justify-between pt-2 border-t border-purple-500/20">
            <span className="text-white font-medium">Final Aura Award:</span>
            <span className="text-purple-400 font-bold">{finalAuraPoints} points</span>
          </div>
        </div>

        {/* User Selection */}
        <div className="space-y-3">
          <Label className="text-white">Select User to Vouch For</Label>
          <Select value={selectedUserId} onValueChange={setSelectedUserId}>
            <SelectTrigger className="bg-black/20 border-white/20 text-white">
              <SelectValue placeholder="Choose a user..." />
            </SelectTrigger>
            <SelectContent className="bg-black/90 border-white/20">
              {leaderboard && Array.isArray(leaderboard) && leaderboard.map((userData: any) => {
                if (userData.id === user.id) return null; // Don't allow self-vouching
                return (
                  <SelectItem key={userData.id} value={userData.id} className="text-white hover:bg-white/10">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-6 h-6">
                        <AvatarImage src={userData.profileImageUrl} />
                        <AvatarFallback className="bg-purple-500 text-white text-xs">
                          {userData.username?.[0]?.toUpperCase() || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <span className="font-medium">{userData.username || "Anonymous"}</span>
                        <span className="text-purple-400 ml-2">
                          {userData.totalAura} aura
                        </span>
                      </div>
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        {/* Transaction Hash */}
        <div className="space-y-3">
          <Label className="text-white">Transaction Hash</Label>
          <Input
            value={transactionHash}
            onChange={(e) => setTransactionHash(e.target.value)}
            placeholder="Enter blockchain transaction hash..."
            className="bg-black/20 border-white/20 text-white placeholder:text-white/40"
          />
          <p className="text-white/60 text-sm">
            Send exactly {REQUIRED_ETH_AMOUNT} ETH to the selected user's wallet, then paste the transaction hash here.
          </p>
        </div>

        <Separator className="bg-white/20" />

        {/* Submit Button */}
        <Button
          onClick={handleSubmit}
          disabled={!selectedUserId || !transactionHash || isProcessing || vouchMutation.isPending}
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

        {/* Info Note */}
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
          <p className="text-blue-300 text-sm">
            <strong>How it works:</strong> You send {REQUIRED_ETH_AMOUNT} ETH directly to another user's wallet. 
            They receive 60% ({(REQUIRED_ETH_AMOUNT * 0.6).toFixed(6)} ETH) while 40% goes to the platform. 
            They also get {finalAuraPoints} aura points based on your level multiplier.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}