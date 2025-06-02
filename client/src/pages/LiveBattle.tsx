import { useState, useEffect } from "react";
import { useRoute } from "wouter";
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
  ArrowLeft
} from "lucide-react";

export default function LiveBattle() {
  const [, params] = useRoute("/battle/:id");
  const battleId = params?.id;
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [timeRemaining, setTimeRemaining] = useState("");
  const [giftAmount, setGiftAmount] = useState("");
  const [selectedParticipant, setSelectedParticipant] = useState<string | null>(null);
  const [showGiftDialog, setShowGiftDialog] = useState(false);

  // Fetch battle data
  const { data: battle, isLoading, error } = useQuery({
    queryKey: [`/api/battles/${battleId}`],
    enabled: !!battleId,
    refetchInterval: 5000, // Refresh every 5 seconds for live updates
  });

  // Update countdown timer
  useEffect(() => {
    if (!(battle as any)?.votingEndsAt) return;

    const updateTimer = () => {
      const now = new Date().getTime();
      const endTime = new Date((battle as any).votingEndsAt).getTime();
      const timeLeft = endTime - now;

      if (timeLeft <= 0) {
        setTimeRemaining("Battle Ended");
        return;
      }

      const hours = Math.floor(timeLeft / (1000 * 60 * 60));
      const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

      setTimeRemaining(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [(battle as any)?.votingEndsAt]);

  // Gift Steeze mutation
  const giftSteeze = useMutation({
    mutationFn: async (data: { battleId: string; participantId: string; amount: number }) => {
      return apiRequest("POST", "/api/battles/gift", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/battles", battleId] });
      toast({
        title: "Gift Sent!",
        description: "Your Steeze gift has been sent successfully.",
      });
      setShowGiftDialog(false);
      setGiftAmount("");
      setSelectedParticipant(null);
    },
    onError: (error: any) => {
      toast({
        title: "Gift Failed",
        description: error.message || "Failed to send gift",
        variant: "destructive",
      });
    },
  });

  const handleGiftSteeze = () => {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0A0B] via-[#8000FF]/10 to-[#0A0A0B] p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button 
            variant="ghost" 
            onClick={() => window.history.back()}
            className="text-white hover:bg-[#8000FF]/20"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Battles
          </Button>
          
          <Badge 
            className={`px-4 py-2 text-lg font-bold animate-pulse ${
              (battle as any).status === 'active' 
                ? 'bg-red-500/20 text-red-400' 
                : 'bg-green-500/20 text-green-400'
            }`}
          >
            {(battle as any).status === 'active' ? '🔴 LIVE' : '✅ COMPLETED'}
          </Badge>
        </div>

        {/* Battle Title & Timer */}
        <Card className="bg-[#1A1A1B] border-primary/20">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold text-white mb-4">
              {(battle as any).title || `Battle #${(battle as any).id?.slice(0, 8)}`}
            </CardTitle>
            
            {(battle as any).status === 'active' && (
              <div className="flex items-center justify-center text-accent">
                <Clock className="w-6 h-6 mr-3" />
                <span className="font-mono text-2xl font-bold">{timeRemaining}</span>
                <span className="text-lg ml-3">remaining</span>
              </div>
            )}
          </CardHeader>
        </Card>

        {/* Live Scoreboard */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Challenger */}
          <Card className="bg-[#1A1A1B] border-primary/20 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-transparent"></div>
            <CardContent className="p-6 relative z-10">
              <div className="text-center space-y-4">
                <Avatar className="w-20 h-20 mx-auto border-2 border-blue-400">
                  <AvatarImage src={(battle as any).challenger?.profileImageUrl} />
                  <AvatarFallback className="bg-blue-500/20 text-blue-400 text-xl">
                    {(battle as any).challenger?.username?.[0]?.toUpperCase() || 'C'}
                  </AvatarFallback>
                </Avatar>
                
                <div>
                  <h3 className="text-xl font-bold text-white">
                    {(battle as any).challenger?.firstName || (battle as any).challenger?.username || `User ${(battle as any).challengerId?.slice(0, 6)}`}
                  </h3>
                  <p className="text-sm text-gray-400">
                    @{(battle as any).challenger?.username || `user_${(battle as any).challengerId?.slice(0, 6)}`}
                  </p>
                  <Badge variant="secondary" className="mt-1">
                    Challenger
                  </Badge>
                </div>

                <div className="space-y-2">
                  <div className="text-3xl font-bold text-blue-400">
                    {(battle as any).challengerVotes || 0}
                  </div>
                  <div className="text-sm text-gray-400">gifts received</div>
                  
                  <Progress 
                    value={challengerPercentage} 
                    className="w-full bg-gray-700"
                  />
                  <div className="text-sm font-medium text-blue-400">
                    {challengerPercentage.toFixed(1)}%
                  </div>
                </div>

                {(battle as any).status === 'active' && isAuthenticated && (
                  <Button
                    onClick={() => {
                      setSelectedParticipant((battle as any).challengerId);
                      setShowGiftDialog(true);
                    }}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                  >
                    <Gift className="w-4 h-4 mr-2" />
                    Gift Steeze
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* VS & Stats */}
          <Card className="bg-[#1A1A1B] border-primary/20">
            <CardContent className="p-6">
              <div className="text-center space-y-6">
                <div className="text-4xl font-bold text-primary animate-pulse">VS</div>
                
                <Separator className="bg-primary/20" />
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Total Stakes</span>
                    <span className="text-white font-bold">
                      {((battle as any).challengerStake + (battle as any).opponentStake).toLocaleString()} AP
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Total Gifts</span>
                    <span className="text-white font-bold">
                      {(((battle as any).challengerVotes || 0) + ((battle as any).opponentVotes || 0)).toLocaleString()}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Battle ID</span>
                    <span className="text-white font-mono">
                      #{(battle as any).id?.slice(0, 8)}
                    </span>
                  </div>
                </div>
                
                <Separator className="bg-primary/20" />
                
                {(battle as any).winnerId && (
                  <div className="flex items-center justify-center space-x-2">
                    <Crown className="w-5 h-5 text-yellow-400" />
                    <span className="text-yellow-400 font-bold">
                      {(battle as any).winnerId === (battle as any).challengerId ? 'Challenger Wins!' : 'Opponent Wins!'}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Opponent */}
          <Card className="bg-[#1A1A1B] border-primary/20 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-l from-red-500/10 to-transparent"></div>
            <CardContent className="p-6 relative z-10">
              <div className="text-center space-y-4">
                <Avatar className="w-20 h-20 mx-auto border-2 border-red-400">
                  <AvatarImage src={(battle as any).opponent?.profileImageUrl} />
                  <AvatarFallback className="bg-red-500/20 text-red-400 text-xl">
                    {(battle as any).opponent?.username?.[0]?.toUpperCase() || 'O'}
                  </AvatarFallback>
                </Avatar>
                
                <div>
                  <h3 className="text-xl font-bold text-white">
                    {(battle as any).opponent?.firstName || (battle as any).opponent?.username || `User ${(battle as any).opponentId?.slice(0, 6)}`}
                  </h3>
                  <p className="text-sm text-gray-400">
                    @{(battle as any).opponent?.username || `user_${(battle as any).opponentId?.slice(0, 6)}`}
                  </p>
                  <Badge variant="secondary" className="mt-1">
                    Opponent
                  </Badge>
                </div>

                <div className="space-y-2">
                  <div className="text-3xl font-bold text-red-400">
                    {(battle as any).opponentVotes || 0}
                  </div>
                  <div className="text-sm text-gray-400">gifts received</div>
                  
                  <Progress 
                    value={opponentPercentage} 
                    className="w-full bg-gray-700"
                  />
                  <div className="text-sm font-medium text-red-400">
                    {opponentPercentage.toFixed(1)}%
                  </div>
                </div>

                {(battle as any).status === 'active' && isAuthenticated && (
                  <Button
                    onClick={() => {
                      setSelectedParticipant((battle as any).opponentId);
                      setShowGiftDialog(true);
                    }}
                    className="w-full bg-red-500 hover:bg-red-600 text-white"
                  >
                    <Gift className="w-4 h-4 mr-2" />
                    Gift Steeze
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Battle Details */}
        <Card className="bg-[#1A1A1B] border-primary/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Target className="w-5 h-5 mr-2" />
              Battle Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <span className="text-gray-400 text-sm">Started At</span>
                <p className="text-white">
                  {new Date((battle as any).battleStartsAt || (battle as any).createdAt).toLocaleDateString()} at{' '}
                  {new Date((battle as any).battleStartsAt || (battle as any).createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
              
              {(battle as any).votingEndsAt && (
                <div className="space-y-2">
                  <span className="text-gray-400 text-sm">Ends At</span>
                  <p className="text-white">
                    {new Date((battle as any).votingEndsAt).toLocaleDateString()} at{' '}
                    {new Date((battle as any).votingEndsAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gift Dialog */}
      <Dialog open={showGiftDialog} onOpenChange={setShowGiftDialog}>
        <DialogContent className="bg-[#1A1A1B] border-primary/20">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center">
              <Gift className="w-5 h-5 mr-2 text-primary" />
              Gift Steeze
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Support your favorite participant by gifting them Steeze tokens from your purchased stack.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-white">Gift Amount (Steeze)</label>
              <Input
                type="number"
                min="1"
                placeholder="Enter amount to gift"
                value={giftAmount}
                onChange={(e) => setGiftAmount(e.target.value)}
                className="bg-[#0A0A0B] border-primary/30 text-white mt-1"
              />
              <p className="text-xs text-gray-400 mt-1">
                Only purchased Steeze can be gifted • Available: {(user as any)?.steezeBalance || 0} Steeze
              </p>
            </div>
            
            <div className="flex space-x-2">
              <Button
                onClick={handleGiftSteeze}
                disabled={giftSteeze.isPending || !giftAmount}
                className="flex-1 bg-primary hover:bg-primary/90"
              >
                {giftSteeze.isPending ? "Sending..." : "Send Gift"}
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
  );
}