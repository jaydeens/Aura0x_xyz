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
  ExternalLink
} from "lucide-react";

interface VouchFormProps {
  preselectedUserId?: string;
}

export default function VouchForm({ preselectedUserId }: VouchFormProps) {
  const [selectedUserId, setSelectedUserId] = useState(preselectedUserId || "");
  const [usdtAmount, setUsdtAmount] = useState("");
  const [transactionHash, setTransactionHash] = useState("");
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: leaderboard } = useQuery({
    queryKey: ["/api/leaderboard"],
    retry: false,
  });

  const vouchMutation = useMutation({
    mutationFn: async (data: { toUserId: string; usdtAmount: number; transactionHash: string }) => {
      return await apiRequest("POST", "/api/vouch", data);
    },
    onSuccess: (data) => {
      toast({
        title: "Vouch Successful!",
        description: `${data.auraAwarded} Aura Points awarded with ${data.multiplier}x multiplier!`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/leaderboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setUsdtAmount("");
      setTransactionHash("");
      setSelectedUserId(preselectedUserId || "");
    },
    onError: (error) => {
      toast({
        title: "Vouch Failed",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  const getStreakLevel = (streak: number) => {
    if (streak >= 30) return { name: "Aura Vader", color: "#FFD700", icon: Crown, multiplier: 2.0 };
    if (streak >= 15) return { name: "Grinder", color: "#00FF88", icon: Trophy, multiplier: 1.5 };
    if (streak >= 5) return { name: "Attention Seeker", color: "#9933FF", icon: Star, multiplier: 1.25 };
    return { name: "Clout Chaser", color: "#8000FF", icon: Zap, multiplier: 1.0 };
  };

  const getUserDisplayName = (targetUser: any) => {
    return targetUser?.firstName || targetUser?.username || `User ${targetUser?.id?.slice(0, 6)}`;
  };

  const selectedUser = leaderboard?.find((u: any) => u.id === selectedUserId);
  const userStreakLevel = getStreakLevel(user?.currentStreak || 0);
  const amount = parseFloat(usdtAmount) || 0;
  const baseAuraPoints = amount * 10; // 1 USDT = 10 Aura Points
  const finalAuraPoints = Math.floor(baseAuraPoints * userStreakLevel.multiplier);
  const userAmount = (amount * 0.6).toFixed(2);
  const platformFee = (amount * 0.4).toFixed(2);

  const handleVouch = () => {
    if (!selectedUserId) {
      toast({
        title: "Select a User",
        description: "Please choose a user to vouch for",
        variant: "destructive",
      });
      return;
    }

    if (!amount || amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid USDT amount",
        variant: "destructive",
      });
      return;
    }

    if (!transactionHash.trim()) {
      toast({
        title: "Transaction Hash Required",
        description: "Please provide the transaction hash from your USDT transfer",
        variant: "destructive",
      });
      return;
    }

    vouchMutation.mutate({
      toUserId: selectedUserId,
      usdtAmount: amount,
      transactionHash: transactionHash.trim(),
    });
  };

  const openPolygonScan = () => {
    if (transactionHash.trim()) {
      window.open(`https://mumbai.polygonscan.com/tx/${transactionHash.trim()}`, "_blank");
    }
  };

  return (
    <Card className="bg-card border-primary/20 max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-white flex items-center">
          <Coins className="w-6 h-6 mr-2 text-warning" />
          Vouch for a KOL
        </CardTitle>
        <p className="text-gray-400">
          Support your favorite KOLs with USDT and boost their Aura Points
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* User Selection */}
        <div className="space-y-2">
          <Label className="text-white font-medium">Select User to Vouch For</Label>
          <Select value={selectedUserId} onValueChange={setSelectedUserId}>
            <SelectTrigger className="bg-background border-primary/30 focus:border-primary">
              <SelectValue placeholder="Choose a user..." />
            </SelectTrigger>
            <SelectContent className="bg-card border-primary/20">
              {leaderboard?.map((targetUser: any) => {
                const level = getStreakLevel(targetUser.currentStreak);
                const LevelIcon = level.icon;
                
                return (
                  <SelectItem key={targetUser.id} value={targetUser.id}>
                    <div className="flex items-center space-x-3 py-1">
                      <Avatar className="w-8 h-8 border border-primary/20">
                        <AvatarImage src={targetUser.profileImageUrl} />
                        <AvatarFallback className="bg-primary/20 text-primary text-xs">
                          <User className="w-4 h-4" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="font-medium text-white">
                          {getUserDisplayName(targetUser)}
                        </div>
                        <div className="text-xs text-gray-400 flex items-center">
                          <LevelIcon className="w-3 h-3 mr-1" />
                          {targetUser.auraPoints?.toLocaleString()} Aura • {level.name}
                        </div>
                      </div>
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        {/* Selected User Preview */}
        {selectedUser && (
          <Card className="bg-muted/50 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center space-x-4">
                <Avatar className="w-16 h-16 border-2 border-primary/20">
                  <AvatarImage src={selectedUser.profileImageUrl} />
                  <AvatarFallback className="bg-primary/20 text-primary">
                    <User className="w-8 h-8" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="font-bold text-white text-lg">
                    {getUserDisplayName(selectedUser)}
                  </h3>
                  <div className="flex items-center space-x-4 text-sm text-gray-400">
                    <div className="flex items-center">
                      <Coins className="w-4 h-4 mr-1 text-primary" />
                      {selectedUser.auraPoints?.toLocaleString()} Aura
                    </div>
                    <div className="flex items-center">
                      <TrendingUp className="w-4 h-4 mr-1 text-green-400" />
                      +{selectedUser.portfolioGrowth}%
                    </div>
                    <Badge 
                      variant="outline"
                      style={{ 
                        color: getStreakLevel(selectedUser.currentStreak).color,
                        borderColor: `${getStreakLevel(selectedUser.currentStreak).color}40`,
                        backgroundColor: `${getStreakLevel(selectedUser.currentStreak).color}20`
                      }}
                    >
                      {selectedUser.currentStreak} day streak
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* USDT Amount */}
        <div className="space-y-2">
          <Label className="text-white font-medium">Vouch Amount (USDT)</Label>
          <div className="relative">
            <Input
              type="number"
              placeholder="10"
              value={usdtAmount}
              onChange={(e) => setUsdtAmount(e.target.value)}
              className="bg-background border-primary/30 focus:border-primary pr-16"
            />
            <span className="absolute right-4 top-3 text-gray-400">USDT</span>
          </div>
          <p className="text-xs text-gray-500">
            Minimum: 1 USDT • 1 USDT = 10 Base Aura Points
          </p>
        </div>

        {/* Transaction Hash */}
        <div className="space-y-2">
          <Label className="text-white font-medium">Transaction Hash</Label>
          <div className="flex space-x-2">
            <Input
              placeholder="0x..."
              value={transactionHash}
              onChange={(e) => setTransactionHash(e.target.value)}
              className="flex-1 bg-background border-primary/30 focus:border-primary"
            />
            {transactionHash.trim() && (
              <Button
                variant="outline"
                size="icon"
                onClick={openPolygonScan}
                className="border-primary/40 text-primary hover:bg-primary hover:text-white"
              >
                <ExternalLink className="w-4 h-4" />
              </Button>
            )}
          </div>
          <p className="text-xs text-gray-500">
            Paste the transaction hash from your USDT transfer on Polygon Mumbai testnet
          </p>
        </div>

        {/* Vouch Breakdown */}
        {amount > 0 && (
          <Card className="bg-primary/10 border-primary/20">
            <CardContent className="p-4">
              <h4 className="font-semibold text-white mb-3 flex items-center">
                <CheckCircle className="w-4 h-4 mr-2 text-success" />
                Vouch Breakdown
              </h4>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Base Aura Points:</span>
                  <span className="text-white">{baseAuraPoints}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-400">Your Multiplier ({userStreakLevel.name}):</span>
                  <span 
                    className="font-semibold"
                    style={{ color: userStreakLevel.color }}
                  >
                    {userStreakLevel.multiplier}x
                  </span>
                </div>
                
                <Separator className="bg-primary/20" />
                
                <div className="flex justify-between font-semibold">
                  <span className="text-gray-300">KOL receives:</span>
                  <span className="text-success">{finalAuraPoints} Aura Points</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-400">USDT to User (60%):</span>
                  <span className="text-white">${userAmount}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-400">Platform fee (40%):</span>
                  <span className="text-gray-400">${platformFee}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Submit Button */}
        <Button
          onClick={handleVouch}
          disabled={!selectedUserId || !amount || !transactionHash.trim() || vouchMutation.isPending}
          className="w-full bg-gradient-to-r from-warning to-orange-500 hover:from-warning/80 hover:to-orange-500/80 text-black font-semibold py-3"
        >
          {vouchMutation.isPending ? (
            <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin mr-2" />
          ) : (
            <Coins className="w-5 h-5 mr-2" />
          )}
          {vouchMutation.isPending ? "Processing Vouch..." : "Submit Vouch"}
        </Button>

        {/* Instructions */}
        <Card className="bg-muted/30 border-accent/20">
          <CardContent className="p-4">
            <h4 className="font-semibold text-accent mb-2">How to Vouch:</h4>
            <ol className="text-sm text-gray-400 space-y-1 list-decimal list-inside">
              <li>Send USDT to the KOL's wallet address on Polygon Mumbai testnet</li>
              <li>Copy the transaction hash from the blockchain explorer</li>
              <li>Paste the transaction hash above and submit your vouch</li>
              <li>The KOL will receive Aura Points with your streak multiplier applied</li>
            </ol>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
}
