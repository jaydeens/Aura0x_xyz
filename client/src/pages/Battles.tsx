import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import Navigation from "@/components/Navigation";
import BattleCard from "@/components/BattleCard";
import Footer from "@/components/Footer";
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
  X,
  Brain,
  Cpu,
  Network
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
        title: "Battle Protocol Initiated!",
        description: "Your challenge has been transmitted to the blockchain.",
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
        description: "Battle protocol failed. Please retry transaction.",
        variant: "destructive",
      });
    },
  });

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
        description: "Please select a target to challenge.",
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

    if (stakeAmountNum > userBalance) {
      setBalanceErrorMessage("Insufficient Dreamz balance to execute this protocol!");
      setShowBalanceError(true);
      return;
    }

    if (stakeAmountNum > opponentBalance) {
      setBalanceErrorMessage("Target lacks sufficient Dreamz reserves to accept this challenge protocol");
      setShowBalanceError(true);
      return;
    }

    if (!battleDate) {
      toast({
        title: "Error",
        description: "Please select a battle timestamp.",
        variant: "destructive",
      });
      return;
    }

    const battleDateTime = new Date(`${battleDate}T${battleTime}:00`);
    if (battleDateTime <= new Date()) {
      toast({
        title: "Error",
        description: "Battle timestamp must be in the future.",
        variant: "destructive",
      });
      return;
    }

    createBattle.mutate({
      title: battleTitle.trim() || null,
      opponentId: selectedOpponent.id,
      stakeAmount: stakeAmountNum,
      description: battleDescription.trim() || "An AI-powered battle of crypto supremacy!",
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
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-cyan-500 via-blue-600 to-blue-800 rounded-lg flex items-center justify-center mx-auto mb-6 animate-pulse shadow-2xl shadow-cyan-500/50">
            <div className="w-10 h-10 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <div className="text-3xl font-black bg-gradient-to-r from-cyan-400 via-blue-500 to-cyan-600 bg-clip-text text-transparent animate-pulse">
            LOADING PROTOCOLS...
          </div>
          <div className="mt-2 text-sm text-cyan-500/60 font-mono">Initializing Battle Matrix</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* AI-Crypto Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-black to-black"></div>
        <div className="absolute top-40 left-20 w-[500px] h-[500px] bg-gradient-to-br from-cyan-500/10 to-blue-600/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-40 right-20 w-[600px] h-[600px] bg-gradient-to-br from-blue-500/10 to-cyan-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-gradient-to-br from-cyan-600/5 to-blue-500/5 rounded-full blur-3xl"></div>
        {/* Grid overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,255,0.03)_1px,transparent_1px)] bg-[size:50px_50px]"></div>
      </div>
      
      <Navigation />
      
      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 pt-20 sm:pt-24">
        {/* Futuristic Header */}
        <div className="mb-12 relative">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-1 h-1 bg-cyan-500 rounded-full animate-pulse" data-testid="indicator-pulse-1"></div>
            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} data-testid="indicator-pulse-2"></div>
            <Badge className="bg-gradient-to-r from-cyan-500/20 to-blue-600/20 text-cyan-400 border border-cyan-500/30 px-6 py-2 font-mono text-xs tracking-widest" data-testid="badge-live-protocol">
              <Brain className="w-3 h-3 mr-2 inline" />
              LIVE BATTLE PROTOCOL
            </Badge>
            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} data-testid="indicator-pulse-3"></div>
            <div className="w-1 h-1 bg-cyan-500 rounded-full animate-pulse" style={{ animationDelay: '0.6s' }} data-testid="indicator-pulse-4"></div>
          </div>
          
          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-center mb-6 leading-none" data-testid="heading-main">
            <span className="block text-white">NEURAL</span>
            <span className="block bg-gradient-to-r from-cyan-400 via-blue-500 to-cyan-600 bg-clip-text text-transparent">
              COMBAT ARENA
            </span>
          </h1>
          
          <p className="text-center text-cyan-100/60 text-base sm:text-lg max-w-3xl mx-auto font-light leading-relaxed mb-4" data-testid="text-description">
            Compete in AI-powered crypto battles. Stake Dreamz, deploy strategies, dominate the blockchain.
          </p>

          {/* Horizontal Stats Bar */}
          <div className="max-w-5xl mx-auto mt-10">
            <div className="bg-gradient-to-r from-blue-950/40 via-blue-900/40 to-blue-950/40 backdrop-blur-sm border border-cyan-500/20 rounded-2xl p-1">
              <div className="flex items-center justify-around py-4">
                <div className="text-center px-4 border-r border-cyan-500/20" data-testid="stat-total">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Network className="w-5 h-5 text-cyan-400" />
                    <span className="text-cyan-400/70 text-xs font-mono uppercase tracking-wider">Network</span>
                  </div>
                  <div className="text-3xl font-black text-white">{stats.total}</div>
                </div>
                
                <div className="text-center px-4 border-r border-cyan-500/20" data-testid="stat-active">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Zap className="w-5 h-5 text-cyan-400" />
                    <span className="text-cyan-400/70 text-xs font-mono uppercase tracking-wider">Active</span>
                  </div>
                  <div className="text-3xl font-black bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">{stats.live}</div>
                </div>
                
                <div className="text-center px-4 border-r border-cyan-500/20" data-testid="stat-scheduled">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Clock className="w-5 h-5 text-cyan-400" />
                    <span className="text-cyan-400/70 text-xs font-mono uppercase tracking-wider">Scheduled</span>
                  </div>
                  <div className="text-3xl font-black text-white">{stats.upcoming}</div>
                </div>
                
                <div className="text-center px-4" data-testid="stat-resolved">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Trophy className="w-5 h-5 text-cyan-400" />
                    <span className="text-cyan-400/70 text-xs font-mono uppercase tracking-wider">Resolved</span>
                  </div>
                  <div className="text-3xl font-black text-white">{stats.completed}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Battle Control Center */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-8">
          <div className="flex flex-col lg:flex-row justify-between items-center gap-6 mb-8">
            <TabsList className="grid grid-cols-4 bg-gradient-to-r from-blue-950/60 via-blue-900/60 to-blue-950/60 border border-cyan-500/20 backdrop-blur-md rounded-xl p-1.5 shadow-lg shadow-cyan-500/10" data-testid="tabs-list">
              <TabsTrigger 
                value="live" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-cyan-500/50 rounded-lg transition-all duration-300 font-mono text-xs px-3 py-2.5 hover:bg-cyan-500/10"
                data-testid="tab-live"
              >
                <Cpu className="w-4 h-4 mr-2" />
                LIVE ({stats.live})
              </TabsTrigger>
              <TabsTrigger 
                value="upcoming" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-cyan-500/50 rounded-lg transition-all duration-300 font-mono text-xs px-3 py-2.5 hover:bg-cyan-500/10"
                data-testid="tab-upcoming"
              >
                <Clock className="w-4 h-4 mr-2" />
                QUEUED ({stats.upcoming})
              </TabsTrigger>
              <TabsTrigger 
                value="completed" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-cyan-500/50 rounded-lg transition-all duration-300 font-mono text-xs px-3 py-2.5 hover:bg-cyan-500/10"
                data-testid="tab-completed"
              >
                <Trophy className="w-4 h-4 mr-2" />
                ARCHIVE ({stats.completed})
              </TabsTrigger>
              <TabsTrigger 
                value="my-battles" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-cyan-500/50 rounded-lg transition-all duration-300 font-mono text-xs px-3 py-2.5 hover:bg-cyan-500/10"
                data-testid="tab-my-battles"
              >
                <Target className="w-4 h-4 mr-2" />
                MY PROTOCOL
              </TabsTrigger>
            </TabsList>

            <Button 
              className="bg-gradient-to-r from-cyan-500 via-blue-600 to-cyan-500 hover:from-cyan-400 hover:via-blue-500 hover:to-cyan-400 text-black font-black shadow-lg shadow-cyan-500/30 hover:shadow-xl hover:shadow-cyan-500/50 transition-all duration-300 px-8 py-6 rounded-xl text-sm tracking-wider"
              onClick={() => setShowCreateBattle(true)}
              data-testid="button-create-battle"
            >
              <Plus className="w-5 h-5 mr-2" />
              INITIATE PROTOCOL
            </Button>
          </div>

          {selectedTab === 'my-battles' && (
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-5 bg-gradient-to-r from-blue-950/30 via-blue-900/30 to-blue-950/30 border border-cyan-500/20 rounded-xl backdrop-blur-sm" data-testid="filter-container">
              <div className="flex items-center gap-4">
                <Label className="text-cyan-400 font-mono text-xs uppercase tracking-wider">Filter Protocol:</Label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-black/50 border border-cyan-500/30 text-cyan-100 rounded-lg px-4 py-2 min-w-[150px] focus:border-cyan-500 focus:outline-none font-mono text-sm"
                  data-testid="select-status-filter"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="accepted">Accepted</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="withdrawn">Withdrawn</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              
              <div className="flex items-center gap-4 text-xs font-mono">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full" data-testid="indicator-pending"></div>
                  <span className="text-cyan-400/60">PENDING: {stats.pending}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-cyan-500 rounded-full" data-testid="indicator-accepted"></div>
                  <span className="text-cyan-400/60">ACCEPTED: {stats.accepted}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-gray-500 rounded-full" data-testid="indicator-withdrawn"></div>
                  <span className="text-cyan-400/60">WITHDRAWN: {stats.withdrawn}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full" data-testid="indicator-cancelled"></div>
                  <span className="text-cyan-400/60">CANCELLED: {stats.cancelled}</span>
                </div>
              </div>
            </div>
          )}

          {/* Live Battles */}
          <TabsContent value="live" className="space-y-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-black text-transparent bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text" data-testid="heading-live-battles">ACTIVE PROTOCOLS</h2>
              <Badge className="bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 font-mono" data-testid="badge-active-count">
                {stats.live} ONLINE
              </Badge>
            </div>

            {battlesLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-72 bg-gradient-to-br from-blue-950/40 to-black border border-cyan-500/20 rounded-xl animate-pulse" data-testid={`skeleton-battle-${i}`} />
                ))}
              </div>
            ) : liveBattles && liveBattles.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {liveBattles.map((battle: any) => (
                  <BattleCard key={battle.id} battle={battle} />
                ))}
              </div>
            ) : (
              <div className="relative" data-testid="empty-live-battles">
                <Card className="bg-gradient-to-br from-blue-950/20 via-black to-blue-950/20 border border-cyan-500/20 shadow-2xl shadow-cyan-500/10">
                  <CardContent className="p-16 text-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-500/5 via-transparent to-transparent"></div>
                    
                    <div className="relative z-10">
                      <div className="w-28 h-28 bg-gradient-to-br from-cyan-500/10 to-blue-600/10 rounded-xl flex items-center justify-center mx-auto mb-8 border border-cyan-500/20">
                        <Cpu className="w-14 h-14 text-cyan-500/60" />
                      </div>
                      <h3 className="text-4xl font-black text-white mb-4">NO ACTIVE PROTOCOLS</h3>
                      <p className="text-cyan-100/50 mb-12 max-w-md mx-auto text-lg font-light">
                        The neural network awaits challengers. Deploy your first battle protocol and stake Dreamz to dominate.
                      </p>
                      <Button 
                        className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-black px-10 py-4 text-base shadow-xl shadow-cyan-500/30 transition-all duration-300 hover:scale-105"
                        onClick={() => setShowCreateBattle(true)}
                        data-testid="button-create-first-battle"
                      >
                        <Plus className="w-5 h-5 mr-2" />
                        DEPLOY PROTOCOL
                      </Button>
                      <div className="flex items-center justify-center space-x-8 text-xs text-cyan-400/40 mt-8 font-mono">
                        <div className="flex items-center space-x-2">
                          <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full"></div>
                          <span>STAKE DREAMZ</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full"></div>
                          <span>AI COMBAT</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full"></div>
                          <span>WIN POTIONS</span>
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
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-black text-transparent bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text" data-testid="heading-upcoming-battles">QUEUED PROTOCOLS</h2>
              <Badge className="bg-blue-500/20 text-blue-400 border border-blue-500/40 font-mono" data-testid="badge-upcoming-count">
                {stats.upcoming} IN QUEUE
              </Badge>
            </div>

            {battlesLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-72 bg-gradient-to-br from-blue-950/40 to-black border border-cyan-500/20 rounded-xl animate-pulse" data-testid={`skeleton-upcoming-${i}`} />
                ))}
              </div>
            ) : upcomingBattles && upcomingBattles.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {upcomingBattles.map((battle: any) => (
                  <BattleCard key={battle.id} battle={battle} />
                ))}
              </div>
            ) : (
              <Card className="bg-gradient-to-br from-blue-950/20 to-black border border-cyan-500/20" data-testid="empty-upcoming-battles">
                <CardContent className="p-14 text-center">
                  <Clock className="w-16 h-16 text-cyan-500/40 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-white mb-2">NO QUEUED PROTOCOLS</h3>
                  <p className="text-cyan-100/50 font-light">
                    No battles scheduled in the pipeline.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Completed Battles */}
          <TabsContent value="completed" className="space-y-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-black text-transparent bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text" data-testid="heading-completed-battles">PROTOCOL ARCHIVE</h2>
              <Badge className="bg-green-500/20 text-green-400 border border-green-500/40 font-mono" data-testid="badge-completed-count">
                {stats.completed} RESOLVED
              </Badge>
            </div>

            {battlesLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-72 bg-gradient-to-br from-blue-950/40 to-black border border-cyan-500/20 rounded-xl animate-pulse" data-testid={`skeleton-completed-${i}`} />
                ))}
              </div>
            ) : completedBattles && completedBattles.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {completedBattles.map((battle: any) => (
                  <BattleCard key={battle.id} battle={battle} showResult={true} />
                ))}
              </div>
            ) : (
              <Card className="bg-gradient-to-br from-blue-950/20 to-black border border-cyan-500/20" data-testid="empty-completed-battles">
                <CardContent className="p-14 text-center">
                  <Trophy className="w-16 h-16 text-cyan-500/40 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-white mb-2">NO ARCHIVED PROTOCOLS</h3>
                  <p className="text-cyan-100/50 font-light">
                    No battles have been resolved yet.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* My Battles */}
          <TabsContent value="my-battles" className="space-y-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-black text-transparent bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text" data-testid="heading-my-battles">MY PROTOCOLS</h2>
              <Badge className="bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 font-mono" data-testid="badge-my-battles-count">
                {userBattles?.length || 0} TOTAL
              </Badge>
            </div>

            {userBattlesLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-72 bg-gradient-to-br from-blue-950/40 to-black border border-cyan-500/20 rounded-xl animate-pulse" data-testid={`skeleton-my-battle-${i}`} />
                ))}
              </div>
            ) : getFilteredBattles('my-battles') && getFilteredBattles('my-battles').length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {getFilteredBattles('my-battles').map((battle: any) => (
                  <BattleCard key={battle.id} battle={battle} showResult={battle.status === 'completed'} />
                ))}
              </div>
            ) : (
              <Card className="bg-gradient-to-br from-blue-950/20 to-black border border-cyan-500/20" data-testid="empty-my-battles">
                <CardContent className="p-14 text-center">
                  <Target className="w-16 h-16 text-cyan-500/40 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-white mb-2">NO PROTOCOLS DEPLOYED</h3>
                  <p className="text-cyan-100/50 mb-8 font-light">
                    You haven't engaged in any battle protocols yet. Initialize your first challenge.
                  </p>
                  <Button 
                    className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-black"
                    onClick={() => setShowCreateBattle(true)}
                    data-testid="button-create-battle-my"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    DEPLOY PROTOCOL
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Create Battle Dialog */}
        <Dialog open={showCreateBattle} onOpenChange={(open) => {
          setShowCreateBattle(open);
          if (!open) resetBattleForm();
        }}>
          <DialogContent className="bg-gradient-to-br from-blue-950 via-black to-blue-950 border-2 border-cyan-500/30 text-white max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="dialog-create-battle">
            <DialogHeader>
              <DialogTitle className="text-4xl font-black bg-gradient-to-r from-cyan-400 via-blue-500 to-cyan-600 bg-clip-text text-transparent">
                <Brain className="w-8 h-8 inline mr-3 text-cyan-400" />
                DEPLOY BATTLE PROTOCOL
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6 py-4">
              <div className="space-y-3">
                <Label className="text-cyan-400 font-mono text-sm uppercase tracking-wider">Protocol Identifier (Optional)</Label>
                <Input
                  type="text"
                  placeholder="Neural Clash Alpha, Crypto Supremacy..."
                  value={battleTitle}
                  onChange={(e) => setBattleTitle(e.target.value.slice(0, 20))}
                  className="bg-black/50 border-cyan-500/30 text-white focus:border-cyan-500 font-mono"
                  maxLength={20}
                  data-testid="input-battle-title"
                />
                <p className="text-cyan-400/50 text-xs font-mono">
                  {battleTitle.length}/20 characters
                </p>
              </div>

              <div className="space-y-3">
                <Label className="text-cyan-400 font-mono text-sm uppercase tracking-wider">Target Selection</Label>
                <div className="relative">
                  <Input
                    placeholder="Search by username or wallet address..."
                    value={opponentSearch}
                    onChange={(e) => {
                      setOpponentSearch(e.target.value);
                      searchOpponents(e.target.value);
                    }}
                    className="bg-black/50 border-cyan-500/30 text-white pr-10 focus:border-cyan-500 font-mono"
                    data-testid="input-opponent-search"
                  />
                  {isSearching && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="w-4 h-4 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin"></div>
                    </div>
                  )}
                </div>
                
                {searchResults.length > 0 && (
                  <div className="max-h-40 overflow-y-auto bg-black/80 border border-cyan-500/30 rounded-lg">
                    {searchResults.map((user) => (
                      <div
                        key={user.id}
                        onClick={() => {
                          setSelectedOpponent(user);
                          setOpponentSearch(user.username || user.walletAddress);
                          setSearchResults([]);
                        }}
                        className="p-4 hover:bg-cyan-500/10 cursor-pointer border-b border-cyan-500/10 last:border-b-0 transition-colors"
                        data-testid={`search-result-${user.id}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center">
                              <span className="text-white font-bold text-sm font-mono">
                                {(user.username || user.walletAddress)?.[0]?.toUpperCase() || 'A'}
                              </span>
                            </div>
                            <div>
                              <p className="text-white font-medium font-mono">{user.username || 'Anonymous'}</p>
                              <p className="text-cyan-400/60 text-sm font-mono">{user.walletAddress?.slice(0, 6)}...{user.walletAddress?.slice(-4)}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-cyan-400 font-bold font-mono">{user.auraPoints || 0} DRZ</p>
                            <p className="text-cyan-400/60 text-sm font-mono">Streak: {user.currentStreak || 0}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {selectedOpponent && (
                  <div className="bg-gradient-to-r from-cyan-500/10 to-blue-600/10 border border-cyan-500/40 rounded-lg p-4" data-testid="selected-opponent">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white font-bold font-mono">TARGET: {selectedOpponent.username || 'Anonymous'}</p>
                        <p className="text-cyan-300/80 text-sm font-mono">{selectedOpponent.walletAddress}</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedOpponent(null);
                          setOpponentSearch("");
                        }}
                        className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                        data-testid="button-remove-opponent"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-cyan-400 font-mono text-sm uppercase tracking-wider">Timestamp</Label>
                  <Input
                    type="date"
                    value={battleDate}
                    onChange={(e) => setBattleDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="bg-black/50 border-cyan-500/30 text-white focus:border-cyan-500 [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:cursor-pointer font-mono"
                    data-testid="input-battle-date"
                  />
                </div>

                <div>
                  <Label className="text-cyan-400 font-mono text-sm uppercase tracking-wider">Time</Label>
                  <Input
                    type="time"
                    value={battleTime}
                    onChange={(e) => setBattleTime(e.target.value)}
                    className="bg-black/50 border-cyan-500/30 text-white focus:border-cyan-500 [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:cursor-pointer font-mono"
                    data-testid="input-battle-time"
                  />
                </div>

                <div>
                  <Label className="text-cyan-400 font-mono text-sm uppercase tracking-wider">Duration (Hrs)</Label>
                  <select
                    value={battleDuration}
                    onChange={(e) => setBattleDuration(e.target.value)}
                    className="w-full bg-black/50 border border-cyan-500/30 text-white rounded-md px-3 py-2 focus:border-cyan-500 focus:outline-none font-mono"
                    data-testid="select-battle-duration"
                  >
                    <option value="3">3 Hours</option>
                    <option value="4">4 Hours</option>
                    <option value="5">5 Hours</option>
                  </select>
                </div>
              </div>

              <div>
                <Label className="text-cyan-400 font-mono text-sm uppercase tracking-wider">Stake Amount (Dreamz)</Label>
                <Input
                  type="number"
                  min="1"
                  max={user?.auraPoints || 0}
                  placeholder="Enter stake amount"
                  value={stakeAmount}
                  onChange={(e) => setStakeAmount(e.target.value)}
                  className="bg-black/50 border-cyan-500/30 text-white focus:border-cyan-500 font-mono"
                  data-testid="input-stake-amount"
                />
                <p className="text-cyan-400/50 text-sm mt-1 font-mono">
                  Available: {user?.auraPoints || 0} DRZ • Both agents must stake equal amounts
                </p>
              </div>

              <div>
                <Label className="text-cyan-400 font-mono text-sm uppercase tracking-wider">Protocol Description (Optional)</Label>
                <Textarea
                  placeholder="Define your challenge parameters..."
                  value={battleDescription}
                  onChange={(e) => setBattleDescription(e.target.value)}
                  className="bg-black/50 border-cyan-500/30 text-white resize-none focus:border-cyan-500 font-mono"
                  rows={3}
                  data-testid="textarea-battle-description"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowCreateBattle(false)}
                  className="flex-1 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 font-mono"
                  data-testid="button-cancel-battle"
                >
                  ABORT
                </Button>
                <Button
                  onClick={handleCreateBattle}
                  disabled={!selectedOpponent}
                  className="flex-1 bg-gradient-to-r from-cyan-500 via-blue-600 to-cyan-500 hover:from-cyan-400 hover:via-blue-500 hover:to-cyan-400 text-black font-black font-mono shadow-lg shadow-cyan-500/30"
                  data-testid="button-submit-battle"
                >
                  DEPLOY PROTOCOL
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Balance Error Modal */}
        <Dialog open={showBalanceError} onOpenChange={setShowBalanceError}>
          <DialogContent className="bg-gradient-to-br from-red-950 via-black to-red-950 border-2 border-red-500/50 max-w-md mx-auto" data-testid="dialog-balance-error">
            <div className="text-center space-y-6 p-6">
              <div className="w-20 h-20 mx-auto bg-gradient-to-br from-red-500/30 to-red-600/30 rounded-xl flex items-center justify-center border border-red-500/50">
                <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              
              <div>
                <h3 className="text-2xl font-bold text-white mb-2 font-mono">PROTOCOL ERROR!</h3>
                <p className="text-red-100/70 leading-relaxed font-mono text-sm">
                  {balanceErrorMessage}
                </p>
              </div>

              <Button 
                onClick={() => setShowBalanceError(false)}
                className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-400 hover:to-red-500 text-white font-black py-3 rounded-lg font-mono"
                data-testid="button-close-error"
              >
                ACKNOWLEDGED
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <Footer />
    </div>
  );
}
