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

  // Fetch battle votes/gifts data
  const { data: battleVotes } = useQuery({
    queryKey: [`/api/battles/${battleId}/votes`],
    enabled: !!battleId,
    refetchInterval: 3000,
  });

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
    <div className="min-h-screen bg-gradient-to-br from-black via-purple-900/20 to-black relative overflow-hidden">
      {/* Floating Gradient Orbs Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-96 h-96 bg-gradient-to-r from-purple-500/30 to-pink-500/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-pink-500/20 to-purple-500/20 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      <div className="relative z-10 p-4">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <Button
              onClick={() => setLocation("/battles")}
              variant="ghost"
              className="text-white hover:bg-white/10 flex items-center gap-2 bg-black/20 backdrop-blur-sm border border-white/10 rounded-2xl px-6 py-3"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Battles
            </Button>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-white/70 text-sm bg-black/20 backdrop-blur-sm px-4 py-2 rounded-2xl border border-white/10">
                <Users className="w-4 h-4" />
                <span>{(battle as any)?.viewerCount || 1} watching</span>
              </div>
              <div className={`px-4 py-2 text-sm font-bold backdrop-blur-sm border rounded-2xl ${
                (battle as any).status === 'completed' 
                  ? 'bg-green-500/20 text-green-400 border-green-500/30' 
                  : 'bg-gray-500/20 text-gray-400 border-gray-500/30'
              }`}>
                {(battle as any).status === 'completed' ? 'COMPLETED' : 'LIVE'}
              </div>
            </div>
          </div>

          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 mb-4">
              SHOWDOWN
            </h1>
            
            {/* Battle Status */}
            {(battle as any).status === 'completed' && (battle as any).winnerId && (
              <div className="flex items-center justify-center gap-2 text-orange-400 text-xl font-bold mb-4">
                <span>🥇 {(battle as any).winnerId === (battle as any).challengerId 
                  ? `${challenger?.username || 'Challenger'} Wins!`
                  : `${opponent?.username || 'Opponent'} Wins!`}
                </span>
              </div>
            )}
            
            {(battle as any).status === 'completed' && !(battle as any).winnerId && (
              <div className="flex items-center justify-center gap-2 text-orange-400 text-xl font-bold mb-4">
                <span>🤝 Aura Draw - No Winner</span>
              </div>
            )}
          </div>

          {/* Live Aura Radar */}
          <div className="bg-black/20 backdrop-blur-sm border border-white/10 rounded-3xl p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Radio className="w-5 h-5 text-purple-400 animate-pulse" />
                Live Aura Radar
              </h3>
              <div className="text-white/60 text-sm">Real-time Aura intensity</div>
            </div>
            
            <div className="relative h-8 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 rounded-full overflow-hidden border border-white/10">
              <div 
                className="absolute top-0 h-full w-2 bg-purple-400 rounded-full transition-all duration-1000 ease-out"
                style={{ left: `${radarPosition}%` }}
              >
                <div className="absolute -top-2 -left-1 w-4 h-4 bg-purple-400 rounded-full animate-ping"></div>
              </div>
              <div className="absolute top-1/2 left-0 transform -translate-y-1/2 text-xs font-bold text-blue-400 ml-2">
                Challenger
              </div>
              <div className="absolute top-1/2 right-0 transform -translate-y-1/2 text-xs font-bold text-pink-400 mr-2">
                Opponent
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Top Gifters - Challenger */}
            <div className="bg-black/20 backdrop-blur-sm border border-blue-500/30 rounded-3xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Crown className="w-5 h-5 text-blue-400" />
                <h3 className="text-blue-400 font-bold">Top Gifters - Challenger</h3>
              </div>
              <div className="space-y-3">
                {battleVotes && Array.isArray(battleVotes) ? (
                  battleVotes
                    .filter((vote: any) => vote.participantId === (battle as any).challengerId)
                    .sort((a: any, b: any) => b.amount - a.amount)
                    .slice(0, 10)
                    .map((vote: any, index: number) => (
                      <div key={vote.id || index} className="flex items-center justify-between p-3 bg-blue-500/10 rounded-xl border border-blue-500/20">
                        <div className="flex items-center gap-2">
                          <div className="text-sm font-bold text-blue-400">#{index + 1}</div>
                          <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-400 text-xs font-bold">
                            {(vote.voterUsername || 'U').charAt(0).toUpperCase()}
                          </div>
                          <span className="text-white text-sm">{vote.voterUsername || 'Anonymous'}</span>
                        </div>
                        <div className="text-blue-400 font-bold">{vote.amount || 0}</div>
                      </div>
                    ))
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <Gift className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No gifts yet</p>
                  </div>
                )}
              </div>
            </div>

            {/* Main Battle Arena */}
            <div className="space-y-6">
              {/* VS Battle Display */}
              <div className="bg-black/20 backdrop-blur-sm border border-purple-500/30 rounded-3xl p-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5"></div>
                <div className="relative z-10">
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
                </div>
              </div>

              {/* Aura Information */}
              <div className="bg-black/20 backdrop-blur-sm border border-purple-500/30 rounded-3xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Trophy className="w-5 h-5 text-purple-400" />
                  <h3 className="text-white font-bold">Aura Information</h3>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-white/60 text-sm mb-2">Started At</h4>
                    <p className="text-white font-mono text-sm">
                      {(battle as any).battleStartsAt ? new Date((battle as any).battleStartsAt).toLocaleString() : 
                       (battle as any).createdAt ? new Date((battle as any).createdAt).toLocaleString() : '6/6/2025, 2:38:00 PM'}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-white/60 text-sm mb-2">Ends At</h4>
                    <p className="text-white font-mono text-sm">
                      {(battle as any).votingEndsAt ? new Date((battle as any).votingEndsAt).toLocaleString() : '6/6/2025, 6:38:00 PM'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Top Gifters - Opponent */}
            <div className="bg-black/20 backdrop-blur-sm border border-pink-500/30 rounded-3xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Crown className="w-5 h-5 text-pink-400" />
                <h3 className="text-pink-400 font-bold">Top Gifters - Opponent</h3>
              </div>
              <div className="space-y-3">
                {battleVotes && Array.isArray(battleVotes) ? (
                  battleVotes
                    .filter((vote: any) => vote.participantId === (battle as any).opponentId)
                    .sort((a: any, b: any) => b.amount - a.amount)
                    .slice(0, 10)
                    .map((vote: any, index: number) => (
                      <div key={vote.id || index} className="flex items-center justify-between p-3 bg-pink-500/10 rounded-xl border border-pink-500/20">
                        <div className="flex items-center gap-2">
                          <div className="text-sm font-bold text-pink-400">#{index + 1}</div>
                          <div className="w-8 h-8 bg-pink-500/20 rounded-full flex items-center justify-center text-pink-400 text-xs font-bold">
                            {(vote.voterUsername || 'U').charAt(0).toUpperCase()}
                          </div>
                          <span className="text-white text-sm">{vote.voterUsername || 'Anonymous'}</span>
                        </div>
                        <div className="text-pink-400 font-bold">{vote.amount || 0}</div>
                      </div>
                    ))
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <Gift className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No gifts yet</p>
                  </div>
                )}
              </div>
            </div>
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