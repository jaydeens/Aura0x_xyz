import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import Navigation from "@/components/Navigation";
import BattleCard from "@/components/BattleCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Sword, 
  Trophy, 
  Users, 
  Zap, 
  Clock,
  Target,
  Plus,
  Filter,
  X
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

export default function Battles() {
  const [location] = useLocation();
  const urlParams = new URLSearchParams(window.location.search);
  const initialTab = urlParams.get('tab') || 'upcoming';
  
  const [activeTab, setActiveTab] = useState(initialTab);
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();
  
  // Update active tab when URL changes
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tabFromUrl = urlParams.get('tab');
    if (tabFromUrl && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
  }, [location, activeTab]);
  const queryClient = useQueryClient();
  const [selectedTab, setSelectedTab] = useState("live");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showCreateBattle, setShowCreateBattle] = useState(false);
  const [opponentSearch, setOpponentSearch] = useState("");
  const [selectedOpponent, setSelectedOpponent] = useState<any>(null);
  const [stakeAmount, setStakeAmount] = useState("");
  const [battleTitle, setBattleTitle] = useState("");
  const [battleDescription, setBattleDescription] = useState("");
  const [battleDate, setBattleDate] = useState("");
  const [battleTime, setBattleTime] = useState("12:00");
  const [battleDuration, setBattleDuration] = useState("4");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showBalanceError, setShowBalanceError] = useState(false);
  const [balanceErrorMessage, setBalanceErrorMessage] = useState("");

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: battles, isLoading: battlesLoading } = useQuery({
    queryKey: ["/api/battles"],
    retry: false,
  });

  const { data: userBattles, isLoading: userBattlesLoading } = useQuery({
    queryKey: ["/api/battles/user"],
    retry: false,
  });

  const createBattle = useMutation({
    mutationFn: async (battleData: any) => {
      const response = await apiRequest('POST', '/api/battles', battleData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Battle Created!",
        description: "Your battle challenge has been sent successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/battles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/battles/user"] });
      setShowCreateBattle(false);
      resetBattleForm();
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to create battle. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Search for opponents
  const searchOpponents = async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }
    
    setIsSearching(true);
    try {
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(searchTerm.trim())}`);
      const results = await response.json();
      setSearchResults(results || []);
    } catch (error) {
      console.error("Search failed:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleCreateBattle = () => {
    if (!selectedOpponent) {
      toast({
        title: "Error",
        description: "Please select an opponent to challenge.",
        variant: "destructive",
      });
      return;
    }

    if (!stakeAmount || parseFloat(stakeAmount) <= 0) {
      toast({
        title: "Error", 
        description: "Please enter a valid stake amount.",
        variant: "destructive",
      });
      return;
    }

    const stakeAmountNum = parseFloat(stakeAmount);
    const userBalance = user?.auraPoints || 0;
    const opponentBalance = selectedOpponent.auraPoints || 0;

    // Check if user has enough balance
    if (stakeAmountNum > userBalance) {
      setBalanceErrorMessage("You don't have enough Aura Points to stake this amount!");
      setShowBalanceError(true);
      return;
    }

    // Check if opponent has enough balance
    if (stakeAmountNum > opponentBalance) {
      setBalanceErrorMessage("Why are you trying to rob this farmer of all their Aura? This user does not have enough balance to join this battle");
      setShowBalanceError(true);
      return;
    }

    if (!battleDate) {
      toast({
        title: "Error",
        description: "Please select a battle date.",
        variant: "destructive",
      });
      return;
    }

    const battleDateTime = new Date(`${battleDate}T${battleTime}:00`);
    if (battleDateTime <= new Date()) {
      toast({
        title: "Error",
        description: "Battle date and time must be in the future.",
        variant: "destructive",
      });
      return;
    }

    createBattle.mutate({
      title: battleTitle.trim() || null,
      opponentId: selectedOpponent.id,
      stakeAmount: stakeAmountNum,
      description: battleDescription.trim() || "A battle of Web3 aura and reputation!",
      battleDate: battleDateTime.toISOString(),
      duration: parseInt(battleDuration),
    });
  };

  const resetBattleForm = () => {
    setOpponentSearch("");
    setSelectedOpponent(null);
    setStakeAmount("");
    setBattleTitle("");
    setBattleDescription("");
    setBattleDate("");
    setBattleTime("12:00");
    setBattleDuration("4");
    setSearchResults([]);
  };

  const getBattleStats = () => {
    if (!battles) return { total: 0, live: 0, upcoming: 0, completed: 0, pending: 0, accepted: 0, withdrawn: 0, cancelled: 0 };
    
    const total = battles.length;
    const live = battles.filter((b: any) => b.status === 'active').length;
    const upcoming = battles.filter((b: any) => b.status === 'accepted' || b.status === 'pending').length;
    const completed = battles.filter((b: any) => b.status === 'completed').length;
    const pending = battles.filter((b: any) => b.status === 'pending').length;
    const accepted = battles.filter((b: any) => b.status === 'accepted').length;
    const withdrawn = battles.filter((b: any) => b.status === 'withdrawn').length;
    const cancelled = battles.filter((b: any) => b.status === 'cancelled').length;
    
    return { total, live, upcoming, completed, pending, accepted, withdrawn, cancelled };
  };

  const stats = getBattleStats();

  const getFilteredBattles = (tabType: string) => {
    if (!battles) return [];
    
    let filteredBattles = battles;
    
    // Filter by tab type first
    switch (tabType) {
      case 'live':
        filteredBattles = battles.filter((b: any) => b.status === 'active');
        break;
      case 'upcoming':
        filteredBattles = battles.filter((b: any) => b.status === 'accepted' || b.status === 'pending');
        break;
      case 'completed':
        filteredBattles = battles.filter((b: any) => b.status === 'completed');
        break;
      case 'my-battles':
        filteredBattles = userBattles || [];
        break;
      default:
        filteredBattles = battles;
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filteredBattles = filteredBattles.filter((b: any) => b.status === statusFilter);
    }
    
    return filteredBattles;
  };

  const liveBattles = getFilteredBattles('live');
  const upcomingBattles = getFilteredBattles('upcoming');
  const completedBattles = getFilteredBattles('completed');

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A0A0B] via-[#1A1A1B] to-[#2A2A2B] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8000FF]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8 pt-24">
        {/* Enhanced Header */}
        <div className="text-center mb-20 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 rounded-[3rem] blur-3xl"></div>
          <div className="relative z-10 py-12">
            <div className="flex items-center justify-center mb-8 gap-6">
              <div className="relative">
                <Sword className="w-16 h-16 text-primary animate-pulse" />
                <div className="absolute inset-0 bg-primary/30 rounded-full blur-lg"></div>
              </div>
              <h1 className="text-6xl md:text-8xl font-black bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
                Battle Arena
              </h1>
              <div className="relative">
                <Zap className="w-16 h-16 text-primary animate-pulse" />
                <div className="absolute inset-0 bg-primary/30 rounded-full blur-lg"></div>
              </div>
            </div>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed font-medium">
              Enter the ultimate proving ground where warriors stake their aura and clash for dominance
            </p>
            <div className="mt-8 flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
          </div>
        </div>

        {/* Enhanced Battle Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-16">
          <Card className="bg-card border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-1 group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium mb-2">Total Battles</p>
                  <p className="text-4xl font-black text-foreground group-hover:text-primary transition-colors">
                    {stats.total}
                  </p>
                </div>
                <div className="p-3 bg-primary/10 rounded-xl group-hover:bg-primary/20 transition-colors">
                  <Sword className="w-8 h-8 text-primary group-hover:scale-110 transition-transform" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-1 group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium mb-2">Live Battles</p>
                  <p className="text-4xl font-black text-primary group-hover:scale-105 transition-transform">
                    {stats.live}
                  </p>
                </div>
                <div className="p-3 bg-primary/10 rounded-xl group-hover:bg-primary/20 transition-colors">
                  <Zap className="w-8 h-8 text-primary group-hover:scale-110 transition-transform" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-1 group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium mb-2">Upcoming</p>
                  <p className="text-4xl font-black text-foreground group-hover:text-primary transition-colors">
                    {stats.upcoming}
                  </p>
                </div>
                <div className="p-3 bg-primary/10 rounded-xl group-hover:bg-primary/20 transition-colors">
                  <Clock className="w-8 h-8 text-primary group-hover:scale-110 transition-transform" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-1 group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium mb-2">Completed</p>
                  <p className="text-4xl font-black text-foreground group-hover:text-primary transition-colors">
                    {stats.completed}
                  </p>
                </div>
                <div className="p-3 bg-primary/10 rounded-xl group-hover:bg-primary/20 transition-colors">
                  <Trophy className="w-8 h-8 text-primary group-hover:scale-110 transition-transform" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Battle Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <div className="flex flex-col lg:flex-row justify-between items-center gap-6">
            <div className="flex justify-center w-full lg:w-auto">
              <TabsList className="grid grid-cols-4 bg-card/50 border border-border/50 backdrop-blur-sm rounded-2xl p-2 shadow-lg">
                <TabsTrigger 
                  value="live" 
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md rounded-xl transition-all duration-300 font-medium px-4 py-3 hover:bg-primary/10"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Live ({stats.live})
                </TabsTrigger>
                <TabsTrigger 
                  value="upcoming" 
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md rounded-xl transition-all duration-300 font-medium px-4 py-3 hover:bg-primary/10"
                >
                  <Clock className="w-4 h-4 mr-2" />
                  Upcoming ({stats.upcoming})
                </TabsTrigger>
                <TabsTrigger 
                  value="completed" 
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md rounded-xl transition-all duration-300 font-medium px-4 py-3 hover:bg-primary/10"
                >
                  <Trophy className="w-4 h-4 mr-2" />
                  Completed ({stats.completed})
                </TabsTrigger>
                <TabsTrigger 
                  value="my-battles" 
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md rounded-xl transition-all duration-300 font-medium px-4 py-3 hover:bg-primary/10"
                >
                  <Target className="w-4 h-4 mr-2" />
                  My Battles
                </TabsTrigger>
              </TabsList>
            </div>

            <Button 
              className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 px-6 py-3 rounded-xl font-semibold"
              onClick={() => setShowCreateBattle(true)}
            >
              <Plus className="w-5 h-5 mr-2" />
              Create Battle
            </Button>
          </div>

          {/* Status Filter - Only show on My Battles tab */}
          {selectedTab === 'my-battles' && (
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 bg-card border border-border rounded-lg">
              <div className="flex items-center gap-4">
                <Label className="text-foreground font-medium">Filter by Status:</Label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-input border border-border text-foreground rounded-md px-3 py-2 min-w-[150px] focus:border-primary focus:outline-none"
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="accepted">Accepted</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="withdrawn">Withdrawn</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-warning rounded-full"></div>
                  <span className="text-muted-foreground">Pending: {stats.pending}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-primary rounded-full"></div>
                  <span className="text-muted-foreground">Accepted: {stats.accepted}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-muted-foreground rounded-full"></div>
                  <span className="text-muted-foreground">Withdrawn: {stats.withdrawn}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-destructive rounded-full"></div>
                  <span className="text-muted-foreground">Cancelled: {stats.cancelled}</span>
                </div>
              </div>
            </div>
          )}

          {/* Live Battles */}
          <TabsContent value="live" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Live Battles</h2>
              <Badge className="bg-[#00FF88]/20 text-[#00FF88]">
                {stats.live} Active
              </Badge>
            </div>

            {battlesLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-64 bg-[#1A1A1B] rounded-lg animate-pulse" />
                ))}
              </div>
            ) : liveBattles && liveBattles.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {liveBattles.map((battle: any) => (
                  <BattleCard key={battle.id} battle={battle} />
                ))}
              </div>
            ) : (
              <div className="relative">
                <Card className="bg-gradient-to-br from-[#1A1A1B] via-[#2A1A2A] to-[#1A1A1B] border-primary/20 shadow-xl">
                  <CardContent className="p-20 text-center relative overflow-hidden">
                    {/* Background decoration */}
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10"></div>
                    <div className="absolute top-8 left-8 w-32 h-32 bg-primary/10 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-8 right-8 w-24 h-24 bg-primary/15 rounded-full blur-2xl"></div>
                    
                    {/* Content */}
                    <div className="relative z-10">
                      <div className="w-24 h-24 bg-gradient-to-br from-primary/20 to-primary/30 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-lg">
                        <Sword className="w-12 h-12 text-primary" />
                      </div>
                      <h3 className="text-3xl font-bold text-white mb-4">No Live Battles</h3>
                      <p className="text-gray-300 mb-10 max-w-lg mx-auto text-lg leading-relaxed">
                        The arena awaits a champion. Step forward and prove your aura dominance in epic Web3 battles!
                      </p>
                      <div className="space-y-4">
                        <Button 
                          className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white px-8 py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                          onClick={() => setShowCreateBattle(true)}
                        >
                          <Plus className="w-5 h-5 mr-2" />
                          Create Your First Battle
                        </Button>
                        <div className="flex items-center justify-center space-x-6 text-sm text-gray-400 mt-6">
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-primary rounded-full"></div>
                            <span>Stake Aura Points</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-primary rounded-full"></div>
                            <span>Challenge Warriors</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-primary rounded-full"></div>
                            <span>Win Rewards</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* Upcoming Battles */}
          <TabsContent value="upcoming" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Upcoming Battles</h2>
              <Badge className="bg-[#9933FF]/20 text-[#9933FF]">
                {stats.upcoming} Scheduled
              </Badge>
            </div>

            {battlesLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-64 bg-[#1A1A1B] rounded-lg animate-pulse" />
                ))}
              </div>
            ) : upcomingBattles && upcomingBattles.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {upcomingBattles.map((battle: any) => (
                  <BattleCard key={battle.id} battle={battle} />
                ))}
              </div>
            ) : (
              <Card className="bg-card border-border">
                <CardContent className="p-12 text-center">
                  <Clock className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-foreground mb-2">No Upcoming Battles</h3>
                  <p className="text-muted-foreground">
                    No battles are scheduled yet.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Completed Battles */}
          <TabsContent value="completed" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Completed Battles</h2>
              <Badge className="bg-[#FFD700]/20 text-[#FFD700]">
                {stats.completed} Finished
              </Badge>
            </div>

            {battlesLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-64 bg-[#1A1A1B] rounded-lg animate-pulse" />
                ))}
              </div>
            ) : completedBattles && completedBattles.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {completedBattles.map((battle: any) => (
                  <BattleCard key={battle.id} battle={battle} showResult={true} />
                ))}
              </div>
            ) : (
              <Card className="bg-card border-border">
                <CardContent className="p-12 text-center">
                  <Trophy className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-foreground mb-2">No Completed Battles</h3>
                  <p className="text-muted-foreground">
                    No battles have been completed yet.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* My Battles */}
          <TabsContent value="my-battles" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">My Battles</h2>
              <Badge className="bg-[#8000FF]/20 text-[#8000FF]">
                {userBattles?.length || 0} Total
              </Badge>
            </div>

            {userBattlesLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-64 bg-[#1A1A1B] rounded-lg animate-pulse" />
                ))}
              </div>
            ) : getFilteredBattles('my-battles') && getFilteredBattles('my-battles').length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {getFilteredBattles('my-battles').map((battle: any) => (
                  <BattleCard key={battle.id} battle={battle} showResult={battle.status === 'completed'} />
                ))}
              </div>
            ) : (
              <Card className="bg-card border-border">
                <CardContent className="p-12 text-center">
                  <Target className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-foreground mb-2">No Battles Yet</h3>
                  <p className="text-muted-foreground mb-6">
                    You haven't participated in any battles yet. Start your journey!
                  </p>
                  <Button 
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                    onClick={() => setShowCreateBattle(true)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Battle
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Enhanced Create Battle Dialog */}
        <Dialog open={showCreateBattle} onOpenChange={(open) => {
          setShowCreateBattle(open);
          if (!open) resetBattleForm();
        }}>
          <DialogContent className="bg-gradient-to-br from-[#1A1A1B] to-[#0A0A0B] border-2 border-[#8000FF]/30 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-3xl font-black bg-gradient-to-r from-[#8000FF] via-[#9933FF] to-[#FF3366] bg-clip-text text-transparent">⚔️ INITIATE AURA CHALLENGE</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6 py-4">
              {/* Battle Title */}
              <div className="space-y-3">
                <Label className="text-white font-semibold">Battle Title (Optional)</Label>
                <Input
                  type="text"
                  placeholder="Epic Showdown, Final Face-off..."
                  value={battleTitle}
                  onChange={(e) => setBattleTitle(e.target.value.slice(0, 20))}
                  className="bg-[#0A0A0B] border-[#8000FF]/30 text-white"
                  maxLength={20}
                />
                <p className="text-gray-400 text-sm">
                  {battleTitle.length}/20 characters
                </p>
              </div>

              {/* Opponent Search */}
              <div className="space-y-3">
                <Label className="text-white font-semibold">Find Your Opponent</Label>
                <div className="relative">
                  <Input
                    placeholder="Search by username or wallet address..."
                    value={opponentSearch}
                    onChange={(e) => {
                      setOpponentSearch(e.target.value);
                      searchOpponents(e.target.value);
                    }}
                    className="bg-[#0A0A0B] border-[#8000FF]/30 text-white pr-10"
                  />
                  {isSearching && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="w-4 h-4 border-2 border-[#8000FF]/30 border-t-[#8000FF] rounded-full animate-spin"></div>
                    </div>
                  )}
                </div>
                
                {/* Search Results */}
                {searchResults.length > 0 && (
                  <div className="max-h-40 overflow-y-auto bg-[#0A0A0B] border border-[#8000FF]/20 rounded-lg">
                    {searchResults.map((user) => (
                      <div
                        key={user.id}
                        onClick={() => {
                          setSelectedOpponent(user);
                          setOpponentSearch(user.username || user.walletAddress);
                          setSearchResults([]);
                        }}
                        className="p-4 hover:bg-[#8000FF]/10 cursor-pointer border-b border-[#8000FF]/10 last:border-b-0 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-r from-[#8000FF] to-[#9933FF] rounded-full flex items-center justify-center">
                              <span className="text-white font-bold text-sm">
                                {(user.username || user.walletAddress)?.[0]?.toUpperCase() || 'A'}
                              </span>
                            </div>
                            <div>
                              <p className="text-white font-medium">{user.username || 'Anonymous'}</p>
                              <p className="text-gray-400 text-sm">{user.walletAddress?.slice(0, 6)}...{user.walletAddress?.slice(-4)}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-[#8000FF] font-bold">{user.auraPoints || 0} AP</p>
                            <p className="text-gray-400 text-sm">Streak: {user.currentStreak || 0}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Selected Opponent */}
                {selectedOpponent && (
                  <div className="bg-gradient-to-r from-[#8000FF]/10 to-[#9933FF]/10 border border-[#8000FF]/30 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white font-bold">Challenging: {selectedOpponent.username || 'Anonymous'}</p>
                        <p className="text-gray-300 text-sm">{selectedOpponent.walletAddress}</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedOpponent(null);
                          setOpponentSearch("");
                        }}
                        className="border-[#FF3366]/50 text-[#FF3366] hover:bg-[#FF3366]/10"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Battle Settings */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-white font-semibold">Battle Date</Label>
                  <Input
                    type="date"
                    value={battleDate}
                    onChange={(e) => setBattleDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="bg-[#0A0A0B] border-[#8000FF]/30 text-white [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                  />
                </div>

                <div>
                  <Label className="text-white font-semibold">Battle Time</Label>
                  <Input
                    type="time"
                    value={battleTime}
                    onChange={(e) => setBattleTime(e.target.value)}
                    className="bg-[#0A0A0B] border-[#8000FF]/30 text-white [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                  />
                </div>

                <div>
                  <Label className="text-white font-semibold">Duration (Hours)</Label>
                  <select
                    value={battleDuration}
                    onChange={(e) => setBattleDuration(e.target.value)}
                    className="w-full bg-[#0A0A0B] border border-[#8000FF]/30 text-white rounded-md px-3 py-2"
                  >
                    <option value="3">3 Hours</option>
                    <option value="4">4 Hours</option>
                    <option value="5">5 Hours</option>
                  </select>
                </div>
              </div>

              <div>
                <Label className="text-white font-semibold">Stake Amount (Aura Points)</Label>
                <Input
                  type="number"
                  min="1"
                  max={user?.auraPoints || 0}
                  placeholder="Enter stake amount"
                  value={stakeAmount}
                  onChange={(e) => setStakeAmount(e.target.value)}
                  className="bg-[#0A0A0B] border-[#8000FF]/30 text-white"
                />
                <p className="text-gray-400 text-sm mt-1">
                  Available: {user?.auraPoints || 0} AP • Both players must stake the same amount
                </p>
              </div>

              <div>
                <Label className="text-white font-semibold">Battle Description (Optional)</Label>
                <Textarea
                  placeholder="Describe the challenge or add a message..."
                  value={battleDescription}
                  onChange={(e) => setBattleDescription(e.target.value)}
                  className="bg-[#0A0A0B] border-[#8000FF]/30 text-white resize-none"
                  rows={3}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowCreateBattle(false)}
                  className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateBattle}
                  disabled={!selectedOpponent}
                  className="flex-1 bg-gradient-to-r from-[#8000FF] via-[#9933FF] to-[#FF3366] hover:from-[#8000FF]/80 hover:via-[#9933FF]/80 hover:to-[#FF3366]/80 font-bold"
                >
                  SEND BATTLE REQUEST
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Balance Error Modal */}
        <Dialog open={showBalanceError} onOpenChange={setShowBalanceError}>
          <DialogContent className="bg-gradient-to-br from-[#1A0033] to-[#330066] border-2 border-[#FF3366] max-w-md mx-auto">
            <div className="text-center space-y-6 p-6">
              <div className="w-20 h-20 mx-auto bg-gradient-to-br from-[#FF3366] to-[#FF6B9D] rounded-full flex items-center justify-center">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Balance Insufficient!</h3>
                <p className="text-gray-300 leading-relaxed">
                  {balanceErrorMessage}
                </p>
              </div>

              <Button 
                onClick={() => setShowBalanceError(false)}
                className="w-full bg-gradient-to-r from-[#8000FF] via-[#9933FF] to-[#FF3366] hover:from-[#8000FF]/80 hover:via-[#9933FF]/80 hover:to-[#FF3366]/80 text-white font-bold py-3 rounded-xl"
              >
                Got it!
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}