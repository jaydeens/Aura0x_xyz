import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  Sword, 
  Clock, 
  Coins, 
  Trophy, 
  Crown, 
  Flame, 
  Target, 
  Vote,
  Zap,
  Users,
  Calendar
} from "lucide-react";

interface Battle {
  id: string;
  title?: string;
  challengerId: string;
  opponentId: string;
  challengerStake: number;
  opponentStake: number;
  totalVotes: number;
  challengerVotes: number;
  opponentVotes: number;
  totalVouchAmount: string;
  winnerId?: string;
  status: string;
  votingEndsAt?: string;
  createdAt: string;
  updatedAt: string;
  challenger?: any;
  opponent?: any;
  winner?: any;
}

interface BattleCardProps {
  battle: Battle;
  featured?: boolean;
  showResult?: boolean;
}

export default function BattleCard({ battle, featured = false, showResult = false }: BattleCardProps) {
  const [vouchAmount, setVouchAmount] = useState("");
  const [selectedSide, setSelectedSide] = useState<string | null>(null);
  const [showVoteDialog, setShowVoteDialog] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Battle management states
  const [isAccepting, setIsAccepting] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [isRequestingCancellation, setIsRequestingCancellation] = useState(false);
  const [isApprovingCancellation, setIsApprovingCancellation] = useState(false);
  
  // User role checks
  const isChallenger = user?.id === battle.challengerId;
  const isOpponent = user?.id === battle.opponentId;
  const canWithdraw = isChallenger && (battle.status === 'challenge_sent' || battle.status === 'pending');
  const canAcceptReject = isOpponent && (battle.status === 'challenge_sent' || battle.status === 'pending');
  const canRequestCancellation = (isChallenger || isOpponent) && battle.status === 'accepted';
  const canApproveCancellation = (isChallenger || isOpponent) && battle.status === 'cancellation_requested';

  const voteMutation = useMutation({
    mutationFn: async (data: { battleId: string; votedForId: string; vouchAmount: number }) => {
      return await apiRequest("POST", "/api/battles/vote", data);
    },
    onSuccess: () => {
      toast({
        title: "Vote Cast Successfully!",
        description: "Your vote has been recorded and the battle updated.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/battles"] });
      setShowVoteDialog(false);
      setVouchAmount("");
      setSelectedSide(null);
    },
    onError: (error) => {
      toast({
        title: "Failed to Cast Vote",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  const handleVote = () => {
    if (!selectedSide) {
      toast({
        title: "Select a Side",
        description: "Please choose who you want to vote for",
        variant: "destructive",
      });
      return;
    }

    const amount = parseFloat(vouchAmount);
    if (!amount || amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid USDT amount",
        variant: "destructive",
      });
      return;
    }

    voteMutation.mutate({
      battleId: battle.id,
      votedForId: selectedSide,
      vouchAmount: amount,
    });
  };

  // Battle management handlers
  const handleAcceptChallenge = async () => {
    setIsAccepting(true);
    try {
      await apiRequest("POST", `/api/battles/${battle.id}/accept`);
      queryClient.invalidateQueries({ queryKey: ["/api/battles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/battles/user"] });
      toast({
        title: "Success",
        description: "Challenge accepted successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to accept challenge",
        variant: "destructive",
      });
    } finally {
      setIsAccepting(false);
    }
  };

  const handleRejectChallenge = async () => {
    setIsRejecting(true);
    try {
      await apiRequest("POST", `/api/battles/${battle.id}/reject`);
      queryClient.invalidateQueries({ queryKey: ["/api/battles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/battles/user"] });
      toast({
        title: "Success",
        description: "Challenge rejected successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to reject challenge",
        variant: "destructive",
      });
    } finally {
      setIsRejecting(false);
    }
  };

  const handleWithdrawChallenge = async () => {
    setIsWithdrawing(true);
    try {
      await apiRequest("POST", `/api/battles/${battle.id}/withdraw`);
      queryClient.invalidateQueries({ queryKey: ["/api/battles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/battles/user"] });
      toast({
        title: "Success",
        description: "Challenge withdrawn successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to withdraw challenge",
        variant: "destructive",
      });
    } finally {
      setIsWithdrawing(false);
    }
  };

  const handleRequestCancellation = async () => {
    setIsRequestingCancellation(true);
    try {
      await apiRequest("POST", `/api/battles/${battle.id}/request-cancellation`);
      queryClient.invalidateQueries({ queryKey: ["/api/battles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/battles/user"] });
      toast({
        title: "Success",
        description: "Cancellation request sent",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to request cancellation",
        variant: "destructive",
      });
    } finally {
      setIsRequestingCancellation(false);
    }
  };

  const handleApproveCancellation = async () => {
    setIsApprovingCancellation(true);
    try {
      await apiRequest("POST", `/api/battles/${battle.id}/approve-cancellation`);
      queryClient.invalidateQueries({ queryKey: ["/api/battles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/battles/user"] });
      toast({
        title: "Success",
        description: "Battle cancelled by mutual agreement",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to approve cancellation",
        variant: "destructive",
      });
    } finally {
      setIsApprovingCancellation(false);
    }
  };

  const getTimeRemaining = () => {
    if (!battle.votingEndsAt) return null;
    
    const now = new Date().getTime();
    const endTime = new Date(battle.votingEndsAt).getTime();
    const timeLeft = endTime - now;
    
    if (timeLeft <= 0) return "Voting Ended";
    
    const hours = Math.floor(timeLeft / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const getStatusBadge = () => {
    switch (battle.status) {
      case "active":
        return <Badge className="bg-red-500/20 text-red-400 animate-pulse">Live</Badge>;
      case "pending":
        return <Badge className="bg-yellow-500/20 text-yellow-400">Pending</Badge>;
      case "completed":
        return <Badge className="bg-green-500/20 text-green-400">Completed</Badge>;
      default:
        return <Badge variant="secondary">{battle.status}</Badge>;
    }
  };

  const getVotePercentage = (votes: number) => {
    const total = battle.challengerVotes + battle.opponentVotes;
    if (total === 0) return 0;
    return (votes / total) * 100;
  };

  const challengerPercentage = getVotePercentage(battle.challengerVotes);
  const opponentPercentage = getVotePercentage(battle.opponentVotes);

  const timeRemaining = getTimeRemaining();

  const handleCardClick = () => {
    if (battle.status === 'active') {
      window.location.href = `/battle/${battle.id}`;
    }
  };

  return (
    <Card 
      className={`bg-card border-primary/20 transition-all duration-300 ${
        featured ? "border-warning/40 bg-gradient-to-r from-card to-warning/5 animate-glow" : "hover:border-primary/40 card-hover"
      } ${battle.status === 'active' ? 'cursor-pointer hover:scale-105' : ''}`}
      onClick={handleCardClick}
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold text-white flex items-center">
            <Sword className="w-5 h-5 mr-2 text-primary" />
            {battle.title || `Battle #${battle.id.slice(0, 8)}`}
          </CardTitle>
          {getStatusBadge()}
        </div>
        {timeRemaining && battle.status === "active" && (
          <div className="flex items-center text-accent">
            <Clock className="w-4 h-4 mr-2" />
            <span className="font-mono text-lg">{timeRemaining}</span>
            <span className="text-sm ml-2">remaining</span>
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Battle Participants */}
        <div className="grid grid-cols-3 gap-4 items-center">
          {/* Challenger */}
          <div className="text-center">
            <Avatar className="w-16 h-16 mx-auto mb-3 border border-border">
              <AvatarImage src={battle.challenger?.profileImageUrl} />
              <AvatarFallback className="bg-muted text-muted-foreground">
                <Crown className="w-6 h-6" />
              </AvatarFallback>
            </Avatar>
            <h4 className="font-bold text-foreground truncate">
              {battle.challenger?.firstName || battle.challenger?.username || `User ${battle.challengerId.slice(0, 6)}`}
            </h4>
            <p className="text-xs text-muted-foreground font-medium">Challenger</p>
            <p className="text-sm text-muted-foreground">
              {battle.challenger?.auraPoints?.toLocaleString() || "0"} Aura
            </p>
            <Badge variant="outline" className="mt-1">
              Staked: {battle.challengerStake}
            </Badge>
          </div>

          {/* VS Section */}
          <div className="text-center">
            <div className="text-3xl font-bold text-foreground mb-2">VS</div>
            <Card className="bg-muted border-border">
              <CardContent className="p-3">
                <div className="text-sm text-muted-foreground mb-1">Total Stakes</div>
                <div className="text-xl font-bold text-foreground">
                  {battle.challengerStake + battle.opponentStake} Aura
                </div>
                <div className="text-xs text-muted-foreground flex items-center justify-center mb-2">
                  <Users className="w-3 h-3 mr-1" />
                  {battle.totalVotes} votes
                </div>
                {(battle.battleStartsAt || battle.createdAt) && (
                  <div className="text-xs text-gray-400 space-y-1">
                    <div className="flex items-center justify-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(battle.battleStartsAt || battle.createdAt).toLocaleDateString()}
                    </div>
                    <div className="flex items-center justify-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(battle.battleStartsAt || battle.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Opponent */}
          <div className="text-center">
            <Avatar className="w-16 h-16 mx-auto mb-3 border-2 border-accent">
              <AvatarImage src={battle.opponent?.profileImageUrl} />
              <AvatarFallback className="bg-accent/20 text-accent">
                <Flame className="w-6 h-6" />
              </AvatarFallback>
            </Avatar>
            <h4 className="font-bold text-white truncate">
              {battle.opponent?.firstName || battle.opponent?.username || `User ${battle.opponentId.slice(0, 6)}`}
            </h4>
            <p className="text-xs text-accent font-medium">Opponent</p>
            <p className="text-sm text-gray-400">
              {battle.opponent?.auraPoints?.toLocaleString() || "0"} Aura
            </p>
            <Badge variant="outline" className="mt-1 border-accent text-accent">
              Staked: {battle.opponentStake}
            </Badge>
          </div>
        </div>

        {/* Vote Progress */}
        {battle.status === "active" && (battle.challengerVotes > 0 || battle.opponentVotes > 0) && (
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Vote Distribution</span>
              <span className="text-gray-400">{battle.totalVotes} total votes</span>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-primary">
                  {battle.challenger?.firstName || "Challenger"}
                </span>
                <span className="text-sm font-medium text-primary">
                  {battle.challengerVotes} votes ({challengerPercentage.toFixed(1)}%)
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${challengerPercentage}%` }}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-accent">
                  {battle.opponent?.firstName || "Opponent"}
                </span>
                <span className="text-sm font-medium text-accent">
                  {battle.opponentVotes} votes ({opponentPercentage.toFixed(1)}%)
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-accent h-2 rounded-full transition-all duration-300"
                  style={{ width: `${opponentPercentage}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Battle Result */}
        {showResult && battle.status === "completed" && battle.winnerId && (
          <div className="bg-success/10 border border-success/20 rounded-lg p-4 text-center">
            <Trophy className="w-8 h-8 text-success mx-auto mb-2" />
            <h4 className="font-bold text-success mb-1">Battle Complete!</h4>
            <p className="text-sm text-gray-300">
              {battle.winnerId === battle.challengerId 
                ? battle.challenger?.firstName || "Challenger"
                : battle.opponent?.firstName || "Opponent"
              } won the battle
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Winner received {battle.challengerStake + battle.opponentStake} Aura Points
            </p>
          </div>
        )}

        {/* Action Buttons */}
        {battle.status === "active" && (
          <div className="flex flex-col sm:flex-row gap-3">
            <Dialog open={showVoteDialog} onOpenChange={setShowVoteDialog}>
              <DialogTrigger asChild>
                <Button className="flex-1 bg-gradient-to-r from-[#8000FF] to-[#FF6B00] hover:from-[#8000FF]/90 hover:to-[#FF6B00]/90 text-white font-semibold py-3 rounded-lg border border-[#8000FF]/30 shadow-lg">
                  <Vote className="w-4 h-4 mr-2" />
                  Gift Steeze
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-primary/20">
                <DialogHeader>
                  <DialogTitle className="text-white">Gift Steeze Tokens</DialogTitle>
                  <DialogDescription className="text-gray-400">
                    Support your favorite participant with purchased Steeze tokens. Only purchased Steeze can be gifted.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 mt-6">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Choose Participant to Support
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        variant={selectedSide === battle.challengerId ? "default" : "outline"}
                        className={`p-4 h-auto ${
                          selectedSide === battle.challengerId 
                            ? "bg-primary text-white" 
                            : "border-primary/40 text-primary hover:bg-primary hover:text-white"
                        }`}
                        onClick={() => setSelectedSide(battle.challengerId)}
                      >
                        <div className="text-center">
                          <div className="font-semibold">
                            {battle.challenger?.firstName || "Challenger"}
                          </div>
                          <div className="text-xs opacity-75">
                            {battle.challengerVotes} gifts
                          </div>
                        </div>
                      </Button>
                      
                      <Button
                        variant={selectedSide === battle.opponentId ? "default" : "outline"}
                        className={`p-4 h-auto ${
                          selectedSide === battle.opponentId 
                            ? "bg-accent text-white" 
                            : "border-accent/40 text-accent hover:bg-accent hover:text-white"
                        }`}
                        onClick={() => setSelectedSide(battle.opponentId)}
                      >
                        <div className="text-center">
                          <div className="font-semibold">
                            {battle.opponent?.firstName || "Opponent"}
                          </div>
                          <div className="text-xs opacity-75">
                            {battle.opponentVotes} gifts
                          </div>
                        </div>
                      </Button>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Gift Amount (Steeze)
                    </label>
                    <div className="relative">
                      <Input
                        type="number"
                        placeholder="10"
                        value={vouchAmount}
                        onChange={(e) => setVouchAmount(e.target.value)}
                        className="bg-background border-primary/30 focus:border-primary pr-16"
                      />
                      <span className="absolute right-4 top-3 text-gray-400">Steeze</span>
                    </div>
                  </div>
                  
                  <Button
                    onClick={handleVote}
                    disabled={!selectedSide || !vouchAmount || voteMutation.isPending}
                    className="w-full bg-gradient-to-r from-warning to-red-500 hover:from-warning/80 hover:to-red-500/80 text-black font-semibold"
                  >
                    {voteMutation.isPending ? (
                      <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin mr-2" />
                    ) : (
                      <Coins className="w-4 h-4 mr-2" />
                    )}
                    Send Gift
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            
            <Dialog>
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  className="border-primary/40 text-primary hover:bg-primary hover:text-white"
                >
                  <Target className="w-4 h-4 mr-2" />
                  View Details
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-primary/20 max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-white flex items-center">
                    <Sword className="w-5 h-5 mr-2 text-primary" />
                    Battle Details
                  </DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4 mt-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-primary/10 rounded-lg">
                      <Avatar className="w-12 h-12 mx-auto mb-2">
                        <AvatarImage src={battle.challenger?.profileImageUrl} />
                        <AvatarFallback className="bg-primary/20 text-primary">
                          <Crown className="w-6 h-6" />
                        </AvatarFallback>
                      </Avatar>
                      <p className="font-semibold text-white text-sm">
                        {battle.challenger?.firstName || battle.challenger?.username || `User ${battle.challengerId.slice(0, 6)}`}
                      </p>
                      <p className="text-xs text-gray-400">
                        {battle.challenger?.auraPoints?.toLocaleString() || "0"} Aura
                      </p>
                      <Badge variant="outline" className="mt-1 text-xs border-primary text-primary">
                        Staked: {battle.challengerStake}
                      </Badge>
                    </div>
                    
                    <div className="text-center p-3 bg-accent/10 rounded-lg">
                      <Avatar className="w-12 h-12 mx-auto mb-2">
                        <AvatarImage src={battle.opponent?.profileImageUrl} />
                        <AvatarFallback className="bg-accent/20 text-accent">
                          <Flame className="w-6 h-6" />
                        </AvatarFallback>
                      </Avatar>
                      <p className="font-semibold text-white text-sm">
                        {battle.opponent?.firstName || battle.opponent?.username || `User ${battle.opponentId.slice(0, 6)}`}
                      </p>
                      <p className="text-xs text-gray-400">
                        {battle.opponent?.auraPoints?.toLocaleString() || "0"} Aura
                      </p>
                      <Badge variant="outline" className="mt-1 text-xs border-accent text-accent">
                        Staked: {battle.opponentStake}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="bg-muted/20 p-3 rounded-lg space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Battle ID:</span>
                      <span className="text-white font-mono">#{battle.id.slice(0, 8)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Status:</span>
                      <Badge variant={battle.status === 'active' ? 'default' : 'secondary'}>
                        {battle.status}
                      </Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Scheduled:</span>
                      <span className="text-white">
                        {new Date(battle.battleStartsAt || battle.createdAt).toLocaleDateString()} at {new Date(battle.battleStartsAt || battle.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                    </div>
                    {battle.votingEndsAt && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Voting Ends:</span>
                        <span className="text-white">
                          {new Date(battle.votingEndsAt).toLocaleDateString()} at {new Date(battle.votingEndsAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Total Stakes:</span>
                      <span className="text-warning font-semibold">
                        {battle.challengerStake + battle.opponentStake} Aura
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Total Votes:</span>
                      <span className="text-white">{battle.totalVotes}</span>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}

        {/* Battle Management Actions */}
        {canAcceptReject && (
          <div className="flex gap-2 mt-4">
            <Button 
              onClick={handleAcceptChallenge}
              disabled={isAccepting}
              className="flex-1 bg-[#00FF88] hover:bg-[#00FF88]/80 text-black font-semibold"
            >
              {isAccepting ? "Accepting..." : "Accept Challenge"}
            </Button>
            <Button 
              onClick={handleRejectChallenge}
              disabled={isRejecting}
              variant="outline"
              className="flex-1 border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
            >
              {isRejecting ? "Rejecting..." : "Reject"}
            </Button>
          </div>
        )}

        {canWithdraw && (
          <div className="mt-4">
            <Button 
              onClick={handleWithdrawChallenge}
              disabled={isWithdrawing}
              variant="outline"
              className="w-full border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:text-black"
            >
              {isWithdrawing ? "Withdrawing..." : "Withdraw Challenge"}
            </Button>
          </div>
        )}

        {canRequestCancellation && (
          <div className="mt-4">
            <Button 
              onClick={handleRequestCancellation}
              disabled={isRequestingCancellation}
              variant="outline"
              className="w-full border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-black"
            >
              {isRequestingCancellation ? "Requesting..." : "Request Cancellation"}
            </Button>
          </div>
        )}

        {canApproveCancellation && (
          <div className="mt-4">
            <Button 
              onClick={handleApproveCancellation}
              disabled={isApprovingCancellation}
              className="w-full bg-red-500 hover:bg-red-600 text-white"
            >
              {isApprovingCancellation ? "Approving..." : "Approve Cancellation"}
            </Button>
          </div>
        )}

        {battle.status === "pending" && !canWithdraw && !canAcceptReject && (
          <div className="text-center py-4">
            <Clock className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
            <p className="text-sm text-gray-400">
              Waiting for opponent to accept the challenge
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
