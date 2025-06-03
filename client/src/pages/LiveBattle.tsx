import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  Crown, 
  Clock, 
  Gift, 
  Trophy, 
  Users, 
  Coins,
  Flame,
  Zap,
  Target,
  ArrowLeft,
  Star,
  Heart,
  TrendingUp,
  Radio
} from "lucide-react";

export default function LiveBattle() {
  const [, params] = useRoute("/battle/:id");
  const battleId = params?.id;
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  
  const [timeRemaining, setTimeRemaining] = useState("");
  const [giftAmount, setGiftAmount] = useState("");
  const [selectedParticipant, setSelectedParticipant] = useState<string | null>(null);
  const [showGiftDialog, setShowGiftDialog] = useState(false);
  const [radarPosition, setRadarPosition] = useState(50); // 0-100, 50 is center
  const [giftAnimations, setGiftAnimations] = useState<Array<{id: number, type: string, participant: string}>>([]);
  const [showTopGifters, setShowTopGifters] = useState(true);

  // Mock top gifters data (simulating live gifting activity)
  const topGifters = {
    challenger: [
      { username: "crypto_whale", amount: 1500, avatar: null },
      { username: "aura_master", amount: 850, avatar: null },
      { username: "steeze_king", amount: 720, avatar: null },
      { username: "diamond_hands", amount: 650, avatar: null },
      { username: "moon_rider", amount: 450, avatar: null },
      { username: "hodl_strong", amount: 380, avatar: null },
      { username: "defi_ninja", amount: 320, avatar: null },
      { username: "yield_farmer", amount: 280, avatar: null },
      { username: "nft_collector", amount: 240, avatar: null },
      { username: "web3_builder", amount: 200, avatar: null }
    ],
    opponent: [
      { username: "battle_legend", amount: 1200, avatar: null },
      { username: "steeze_queen", amount: 900, avatar: null },
      { username: "crypto_lord", amount: 750, avatar: null },
      { username: "aura_beast", amount: 600, avatar: null },
      { username: "chain_master", amount: 480, avatar: null },
      { username: "token_hunter", amount: 420, avatar: null },
      { username: "smart_trader", amount: 350, avatar: null },
      { username: "gas_saver", amount: 300, avatar: null },
      { username: "block_explorer", amount: 260, avatar: null },
      { username: "degen_trader", amount: 220, avatar: null }
    ]
  };

  // Fetch battle data
  const { data: battle, isLoading, error } = useQuery({
    queryKey: [`/api/battles/${battleId}`],
    enabled: !!battleId,
    refetchInterval: 5000,
  });

  // Join battle as viewer on mount and maintain presence
  useEffect(() => {
    if (!battleId || !isAuthenticated) return;
    
    const joinBattle = async () => {
      try {
        await apiRequest("POST", `/api/battles/${battleId}/join`);
      } catch (error) {
        console.error("Failed to join battle:", error);
      }
    };

    joinBattle();

    // Send heartbeat every 15 seconds to maintain presence
    const heartbeatInterval = setInterval(async () => {
      try {
        await apiRequest("POST", `/api/battles/${battleId}/heartbeat`);
      } catch (error) {
        console.error("Failed to send heartbeat:", error);
      }
    }, 15000);

    // Cleanup on unmount
    return () => {
      clearInterval(heartbeatInterval);
      apiRequest("POST", `/api/battles/${battleId}/leave`).catch(console.error);
    };
  }, [battleId, isAuthenticated]);

  // Gift Steeze mutation
  const giftSteeze = useMutation({
    mutationFn: async ({ battleId, participantId, amount }: { battleId: string, participantId: string, amount: number }) => {
      const response = await apiRequest("POST", "/api/battles/gift", {
        battleId,
        participantId,
        amount,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Steeze Gifted!",
        description: `Successfully gifted ${giftAmount} Steeze tokens`,
      });
      setShowGiftDialog(false);
      setGiftAmount("");
      queryClient.invalidateQueries({ queryKey: [`/api/battles/${battleId}`] });
    },
    onError: (error: any) => {
      toast({
        title: "Gift Failed",
        description: error.message || "Failed to gift Steeze tokens",
        variant: "destructive",
      });
    },
  });

  // Timer logic
  useEffect(() => {
    if (!battle || (battle as any).status !== 'active') return;

    const updateTimer = () => {
      const endTime = new Date((battle as any).endsAt);
      const now = new Date();
      const timeDiff = endTime.getTime() - now.getTime();
      
      if (timeDiff > 0) {
        const hours = Math.floor(timeDiff / (1000 * 60 * 60));
        const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);
        setTimeRemaining(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      } else {
        setTimeRemaining("00:00:00");
        queryClient.invalidateQueries({ queryKey: [`/api/battles/${battleId}`] });
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [battle, battleId, queryClient]);

  const handleGiftSteeze = () => {
    if (!user || !isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please log in to gift Steeze tokens",
        variant: "destructive",
      });
      return;
    }

    if (!selectedParticipant || !giftAmount || !battleId) return;

    const amount = parseFloat(giftAmount);
    if (amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid gift amount",
        variant: "destructive",
      });
      return;
    }

    giftSteeze.mutate({
      battleId,
      participantId: selectedParticipant,
      amount,
    });
  };

  const getVotePercentage = (votes: number) => {
    const total = ((battle as any)?.challengerVotes || 0) + ((battle as any)?.opponentVotes || 0);
    if (total === 0) return 0;
    return (votes / total) * 100;
  };

  const challengerPercentage = getVotePercentage((battle as any)?.challengerVotes || 0);
  const opponentPercentage = getVotePercentage((battle as any)?.opponentVotes || 0);

  // Dynamic radar animation based on battle performance
  useEffect(() => {
    const total = ((battle as any)?.challengerVotes || 0) + ((battle as any)?.opponentVotes || 0);
    if (total > 0) {
      const newPosition = challengerPercentage; // 0-100 scale
      setRadarPosition(newPosition);
    }
  }, [challengerPercentage, battle]);

  // Simulate gift animations for live feel
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.7) { // 30% chance every 3 seconds
        const newGift = {
          id: Date.now(),
          type: ['heart', 'star', 'flame', 'zap'][Math.floor(Math.random() * 4)],
          participant: Math.random() > 0.5 ? 'challenger' : 'opponent'
        };
        setGiftAnimations(prev => [...prev, newGift]);
        
        // Remove after animation
        setTimeout(() => {
          setGiftAnimations(prev => prev.filter(g => g.id !== newGift.id));
        }, 3000);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // Show loading state while fetching data
  if (isLoading || !battle) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A0A0B] via-[#8000FF]/10 to-[#0A0A0B] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8000FF] mx-auto mb-4"></div>
          <p className="text-white/80">Loading battle details...</p>
        </div>
      </div>
    );
  }

  // Only show error if we explicitly have an error or confirmed empty response
  if (error || (battle && !(battle as any).id)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A0A0B] via-[#8000FF]/10 to-[#0A0A0B] flex items-center justify-center">
        <Card className="bg-[#1A1A1B] border-primary/20">
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-bold text-white mb-2">Battle Not Found</h2>
            <p className="text-gray-400">The battle you're looking for doesn't exist.</p>
            <Button 
              variant="outline" 
              onClick={() => window.history.back()}
              className="mt-4 border-primary/40 text-primary hover:bg-primary hover:text-white"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Extract participant data
  const challenger = (battle as any).challenger;
  const opponent = (battle as any).opponent;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0A0B] via-[#8000FF]/10 to-[#0A0A0B] relative overflow-hidden">
      {/* Animated Background Effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5 animate-pulse"></div>
        {giftAnimations.map((gift) => (
          <div
            key={gift.id}
            className={`absolute animate-bounce ${
              gift.participant === 'challenger' ? 'left-10' : 'right-10'
            } top-1/2 transform -translate-y-1/2 text-3xl opacity-80`}
            style={{
              animation: 'float 3s ease-out forwards',
              animationDelay: '0s'
            }}
          >
            {gift.type === 'heart' && '💖'}
            {gift.type === 'star' && '⭐'}
            {gift.type === 'flame' && '🔥'}
            {gift.type === 'zap' && '⚡'}
          </div>
        ))}
      </div>

      <div className="relative z-10 p-4">
        <div className="max-w-7xl mx-auto space-y-4">
          {/* Header with Live Indicator */}
          <div className="flex items-center justify-between">
            <Button 
              variant="ghost" 
              onClick={() => setLocation('/battles')}
              className="text-white hover:bg-[#8000FF]/20"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Battles
            </Button>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-white/60 text-sm">
                <Users className="w-4 h-4" />
                <span className="font-mono">{(battle as any)?.viewerCount || 1} watching</span>
              </div>
              <Badge 
                className={`px-4 py-2 text-lg font-bold animate-pulse ${
                  (battle as any).status === 'active' 
                    ? 'bg-red-500/20 text-red-400' 
                    : (battle as any).status === 'completed'
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-gray-500/20 text-gray-400'
                }`}
              >
                {(battle as any).status === 'active' ? '🔴 LIVE' : 
                 (battle as any).status === 'completed' ? '✅ COMPLETED' : 
                 '⏳ ' + ((battle as any).status || 'PENDING').toUpperCase()}
              </Badge>
            </div>
          </div>

          {/* Battle Title & Timer */}
          <div className="text-center py-6 relative">
            <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#8000FF] to-[#FF00FF] mb-2 animate-pulse">
              {(battle as any)?.title || "AURA BATTLES"}
            </h1>
            
            {/* Winner Display for Completed Battles */}
            {(battle as any).status === 'completed' && (battle as any).winnerId && (
              <div className="flex items-center justify-center gap-3 text-yellow-400 text-2xl font-bold mb-4 animate-bounce">
                <Crown className="w-8 h-8 text-yellow-400" />
                <span>
                  {(battle as any).winnerId === (battle as any).challengerId 
                    ? `${challenger?.username || 'Challenger'} Wins!`
                    : `${opponent?.username || 'Opponent'} Wins!`}
                </span>
                <Crown className="w-8 h-8 text-yellow-400" />
              </div>
            )}
            
            {/* Draw Display for Completed Battles */}
            {(battle as any).status === 'completed' && !(battle as any).winnerId && (
              <div className="flex items-center justify-center gap-3 text-gray-400 text-2xl font-bold mb-4">
                <span>🤝 Aura Draw - No Winner</span>
              </div>
            )}
            
            {timeRemaining && (battle as any).status === 'active' && (
              <div className="flex items-center justify-center gap-2 text-[#8000FF] text-xl font-bold">
                <Clock className="w-6 h-6 animate-spin" />
                <span className="font-mono bg-black/30 px-3 py-1 rounded-lg">{timeRemaining}</span>
                <span className="text-white/60">remaining</span>
              </div>
            )}
          </div>

          {/* Live Radar Battle Indicator */}
          <Card className="bg-black/40 border-[#8000FF]/30 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Radio className="w-5 h-5 text-[#8000FF] animate-pulse" />
                  Live Aura Radar
                </h3>
                <div className="text-white/60 text-sm">Real-time Aura intensity</div>
              </div>
              
              <div className="relative h-8 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-red-500/20 rounded-full overflow-hidden">
                <div 
                  className="absolute top-0 h-full w-2 bg-[#8000FF] rounded-full transition-all duration-1000 ease-out"
                  style={{ left: `${radarPosition}%` }}
                >
                  <div className="absolute -top-2 -left-1 w-4 h-4 bg-[#8000FF] rounded-full animate-ping"></div>
                </div>
                <div className="absolute top-1/2 left-0 transform -translate-y-1/2 text-xs font-bold text-blue-400 ml-2">
                  {(battle as any)?.challengerName || 'Challenger'}
                </div>
                <div className="absolute top-1/2 right-0 transform -translate-y-1/2 text-xs font-bold text-red-400 mr-2">
                  {(battle as any)?.opponentName || 'Opponent'}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Top Gifters - Challenger */}
            <Card className="bg-black/40 border-blue-500/30 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-blue-400 flex items-center gap-2">
                  <Crown className="w-5 h-5" />
                  Top Gifters - {(battle as any)?.challengerName || 'Challenger'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {topGifters.challenger.map((gifter, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-blue-500/10 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-bold text-blue-400">#{index + 1}</div>
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="bg-blue-500/20 text-blue-400 text-xs">
                          {gifter.username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-white text-sm">{gifter.username}</span>
                    </div>
                    <div className="text-blue-400 font-bold">{gifter.amount}</div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Main Battle Arena */}
            <div className="space-y-4">
              {/* VS Battle Display */}
              <Card className="bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-red-500/10 border-[#8000FF]/30 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="grid grid-cols-3 gap-6 items-center">
                    {/* Challenger */}
                    <div className="text-center space-y-4 relative">
                      {/* Winner Crown */}
                      {(battle as any).status === 'completed' && (battle as any).winnerId === (battle as any).challengerId && (
                        <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 z-10">
                          <Crown className="w-12 h-12 text-yellow-400 animate-bounce" />
                        </div>
                      )}
                      
                      <Avatar className={`w-24 h-24 mx-auto border-4 ${
                        (battle as any).status === 'completed' && (battle as any).winnerId === (battle as any).challengerId
                          ? 'border-yellow-400 shadow-lg shadow-yellow-400/50'
                          : 'border-blue-500'
                      } ${(battle as any).status === 'active' ? 'animate-pulse' : ''}`}>
                        <AvatarImage src={challenger?.profileImageUrl} />
                        <AvatarFallback className="bg-blue-500/20 text-blue-400 text-2xl font-bold">
                          {(challenger?.username || 'C').charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div>
                        <h3 className={`text-xl font-bold ${
                          (battle as any).status === 'completed' && (battle as any).winnerId === (battle as any).challengerId
                            ? 'text-yellow-400'
                            : 'text-blue-400'
                        }`}>
                          {challenger?.username || 'Challenger'}
                          {(battle as any).status === 'completed' && (battle as any).winnerId === (battle as any).challengerId && ' 👑'}
                        </h3>
                        <p className="text-blue-300 text-sm">
                          @{challenger?.username || 'challenger'}
                        </p>
                        <Badge variant="secondary" className={`mt-2 ${
                          (battle as any).status === 'completed' && (battle as any).winnerId === (battle as any).challengerId
                            ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                            : 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                        }`}>
                          {(battle as any).status === 'completed' && (battle as any).winnerId === (battle as any).challengerId 
                            ? 'WINNER' 
                            : 'Challenger'}
                        </Badge>
                      </div>

                      <div className="space-y-2">
                        <div className="text-3xl font-bold text-blue-400">
                          {(battle as any).challengerVotes || 0}
                        </div>
                        <div className="text-sm text-gray-400">Steeze received</div>
                        
                        <Progress 
                          value={challengerPercentage} 
                          className="w-full bg-gray-700"
                          style={{
                            background: `linear-gradient(to right, rgba(59, 130, 246, 0.3) ${challengerPercentage}%, rgba(75, 85, 99, 1) ${challengerPercentage}%)`
                          }}
                        />
                        
                        {(battle as any).status === 'active' ? (
                          <Button
                            onClick={() => {
                              setSelectedParticipant((battle as any).challengerId);
                              setShowGiftDialog(true);
                            }}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 mt-3 rounded-lg text-sm flex items-center justify-center gap-1.5"
                            disabled={!isAuthenticated}
                          >
                            <Gift className="w-4 h-4" />
                            <span>Gift Steeze</span>
                          </Button>
                        ) : (
                          <div className="w-full bg-gray-700 text-gray-400 font-medium py-3 px-4 mt-3 rounded-lg text-sm flex items-center justify-center gap-1.5">
                            <Trophy className="w-4 h-4" />
                            <span>Final Steeze: {(battle as any).challengerVotes || 0}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* VS Center */}
                    <div className="text-center">
                      <div className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#8000FF] to-[#FF00FF] animate-pulse mb-4">
                        VS
                      </div>
                      <div className="space-y-2 text-white/60">
                        <div className="flex items-center justify-center gap-2">
                          <Target className="w-4 h-4" />
                          <span className="text-sm">Total Stakes</span>
                        </div>
                        <div className="text-xl font-bold text-[#8000FF]">
                          {((battle as any)?.challengerStake || 0) + ((battle as any)?.opponentStake || 0)} AP
                        </div>
                        <div className="flex items-center justify-center gap-2">
                          <Gift className="w-4 h-4" />
                          <span className="text-sm">Total Gifts</span>
                        </div>
                        <div className="text-lg font-bold text-white">
                          {((battle as any)?.challengerVotes || 0) + ((battle as any)?.opponentVotes || 0)}
                        </div>

                      </div>
                    </div>

                    {/* Opponent */}
                    <div className="text-center space-y-4 relative">
                      {/* Winner Crown */}
                      {(battle as any).status === 'completed' && (battle as any).winnerId === (battle as any).opponentId && (
                        <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 z-10">
                          <Crown className="w-12 h-12 text-yellow-400 animate-bounce" />
                        </div>
                      )}
                      
                      <Avatar className={`w-24 h-24 mx-auto border-4 ${
                        (battle as any).status === 'completed' && (battle as any).winnerId === (battle as any).opponentId
                          ? 'border-yellow-400 shadow-lg shadow-yellow-400/50'
                          : 'border-red-500'
                      } ${(battle as any).status === 'active' ? 'animate-pulse' : ''}`}>
                        <AvatarImage src={opponent?.profileImageUrl} />
                        <AvatarFallback className="bg-red-500/20 text-red-400 text-2xl font-bold">
                          {(opponent?.username || 'O').charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div>
                        <h3 className={`text-xl font-bold ${
                          (battle as any).status === 'completed' && (battle as any).winnerId === (battle as any).opponentId
                            ? 'text-yellow-400'
                            : 'text-red-400'
                        }`}>
                          {opponent?.username || 'Opponent'}
                          {(battle as any).status === 'completed' && (battle as any).winnerId === (battle as any).opponentId && ' 👑'}
                        </h3>
                        <p className="text-red-300 text-sm">
                          @{opponent?.username || 'opponent'}
                        </p>
                        <Badge variant="secondary" className={`mt-2 ${
                          (battle as any).status === 'completed' && (battle as any).winnerId === (battle as any).opponentId
                            ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                            : 'bg-red-500/20 text-red-400 border-red-500/30'
                        }`}>
                          {(battle as any).status === 'completed' && (battle as any).winnerId === (battle as any).opponentId 
                            ? 'WINNER' 
                            : 'Opponent'}
                        </Badge>
                      </div>

                      <div className="space-y-2">
                        <div className="text-3xl font-bold text-red-400">
                          {(battle as any).opponentVotes || 0}
                        </div>
                        <div className="text-sm text-gray-400">Steeze received</div>
                        
                        <Progress 
                          value={opponentPercentage} 
                          className="w-full bg-gray-700"
                          style={{
                            background: `linear-gradient(to right, rgba(239, 68, 68, 0.3) ${opponentPercentage}%, rgba(75, 85, 99, 1) ${opponentPercentage}%)`
                          }}
                        />
                        
                        {(battle as any).status === 'active' ? (
                          <Button
                            onClick={() => {
                              setSelectedParticipant((battle as any).opponentId);
                              setShowGiftDialog(true);
                            }}
                            className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-4 mt-3 rounded-lg text-sm flex items-center justify-center gap-1.5"
                            disabled={!isAuthenticated}
                          >
                            <Gift className="w-4 h-4" />
                            <span>Gift Steeze</span>
                          </Button>
                        ) : (
                          <div className="w-full bg-gray-700 text-gray-400 font-medium py-3 px-4 mt-3 rounded-lg text-sm flex items-center justify-center gap-1.5">
                            <Trophy className="w-4 h-4" />
                            <span>Final Steeze: {(battle as any).opponentVotes || 0}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Battle Stats */}
              <Card className="bg-[#1A1A1B] border-primary/20">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-[#8000FF]" />
                    Aura Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-gray-400 text-sm mb-2">Started At</h4>
                    <p className="text-white font-mono">
                      {(battle as any).battleStartsAt ? new Date((battle as any).battleStartsAt).toLocaleString() : 
                       (battle as any).createdAt ? new Date((battle as any).createdAt).toLocaleString() : 'Now'}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-gray-400 text-sm mb-2">Ends At</h4>
                    <p className="text-white font-mono">
                      {(battle as any).votingEndsAt ? new Date((battle as any).votingEndsAt).toLocaleString() : 'TBD'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Top Gifters - Opponent */}
            <Card className="bg-black/40 border-red-500/30 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-red-400 flex items-center gap-2">
                  <Crown className="w-5 h-5" />
                  Top Gifters - {(battle as any)?.opponentName || 'Opponent'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {topGifters.opponent.map((gifter, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-red-500/10 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-bold text-red-400">#{index + 1}</div>
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="bg-red-500/20 text-red-400 text-xs">
                          {gifter.username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-white text-sm">{gifter.username}</span>
                    </div>
                    <div className="text-red-400 font-bold">{gifter.amount}</div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Gift Dialog */}
          <Dialog open={showGiftDialog} onOpenChange={setShowGiftDialog}>
            <DialogContent className="bg-[#1A1A1B] border-primary/20">
              <DialogHeader>
                <DialogTitle className="text-white">Gift Steeze Tokens</DialogTitle>
                <DialogDescription className="text-gray-400">
                  Support your favorite participant by gifting Steeze tokens
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-[#8000FF]/10 rounded-lg border border-[#8000FF]/20">
                  <div className="flex items-center gap-2">
                    <Coins className="w-5 h-5 text-[#8000FF]" />
                    <span className="text-white font-medium">Your Steeze Balance</span>
                  </div>
                  <div className="text-[#8000FF] font-bold text-lg">
                    {(user as any)?.steezeBalance || 0} STEEZE
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-white mb-2 block">
                    Amount (Steeze Tokens)
                  </label>
                  <Input
                    type="number"
                    value={giftAmount}
                    onChange={(e) => setGiftAmount(e.target.value)}
                    placeholder="Enter amount"
                    className="bg-gray-800 border-gray-600 text-white"
                    min="1"
                    max={(user as any)?.steezeBalance || 0}
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Maximum: {(user as any)?.steezeBalance || 0} STEEZE
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleGiftSteeze}
                    disabled={giftSteeze.isPending || !giftAmount}
                    className="flex-1 bg-primary hover:bg-primary/80"
                  >
                    {giftSteeze.isPending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Gifting...
                      </>
                    ) : (
                      <>
                        <Gift className="w-4 h-4 mr-2" />
                        Gift Steeze
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowGiftDialog(false)}
                    className="flex-1 border-primary/30 text-white hover:bg-primary/10"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}