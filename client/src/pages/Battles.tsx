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
      <div className="min-h-screen bg-black relative overflow-hidden flex items-center justify-center">
        {/* Circuit Board Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(0,217,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(0,217,255,0.1)_1px,transparent_1px)] bg-[size:40px_40px]"></div>
        </div>
        
        <div className="relative z-10 text-center px-4">
          {/* Rotating Diamond Grid */}
          <div className="relative w-24 h-24 mx-auto mb-6">
            <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 gap-2 animate-pulse">
              {[...Array(9)].map((_, i) => (
                <div 
                  key={i} 
                  className={`w-full h-full border border-cyan-400/30 ${i === 4 ? 'bg-cyan-400/20' : 'bg-cyan-400/5'}`}
                  style={{ 
                    animationDelay: `${i * 0.1}s`,
                    transform: 'rotate(45deg)'
                  }}
                ></div>
              ))}
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="text-3xl font-black font-mono tracking-wider bg-gradient-to-r from-cyan-300 to-blue-400 bg-clip-text text-transparent">
              &lt; LOADING COMBAT ARENA /&gt;
            </div>
            <div className="flex items-center justify-center gap-1 text-cyan-400/60 font-mono text-xs">
              <span className="animate-pulse">[</span>
              <span className="animate-pulse" style={{ animationDelay: '0.2s' }}>■</span>
              <span className="animate-pulse" style={{ animationDelay: '0.4s' }}>■</span>
              <span className="animate-pulse" style={{ animationDelay: '0.6s' }}>■</span>
              <span className="animate-pulse">]</span>
              <span className="ml-2">PROTOCOL SYNC</span>
            </div>
          </div>
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
      
      {/* REDESIGNED LAYOUT: Add sidebar spacing + new structure */}
      <div className="relative z-10 md:pt-0 pt-16 px-4 sm:px-6 lg:px-8 py-8">
        {/* Floating Initiate Protocol Button - TOP RIGHT */}
        <div className="fixed top-20 md:top-6 right-6 z-50">
          <Button 
            className="bg-gradient-to-r from-cyan-500 via-blue-600 to-cyan-500 hover:from-cyan-400 hover:via-blue-500 hover:to-cyan-400 text-black font-black shadow-2xl shadow-cyan-500/50 hover:shadow-cyan-500/70 transition-all duration-300 px-6 py-6 rounded-2xl text-sm tracking-wider hover:scale-105"
            onClick={() => setShowCreateBattle(true)}
            data-testid="button-initiate-protocol-floating"
          >
            <Plus className="w-5 h-5 mr-2" />
            INITIATE PROTOCOL
          </Button>
        </div>

        {/* Header Section - Redesigned */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse" data-testid="pulse-indicator-1"></div>
            <Badge className="bg-gradient-to-r from-cyan-500/20 to-blue-600/20 text-cyan-400 border border-cyan-500/30 px-4 py-1 font-mono text-xs tracking-widest" data-testid="badge-protocol-status">
              <Brain className="w-3 h-3 mr-2 inline" />
              NEURAL COMBAT SYSTEM
            </Badge>
            <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse" style={{ animationDelay: '0.3s' }} data-testid="pulse-indicator-2"></div>
          </div>
          
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black mb-3 leading-none" data-testid="heading-battle-arena">
            <span className="block bg-gradient-to-r from-cyan-400 via-blue-500 to-cyan-600 bg-clip-text text-transparent">
              BATTLE ARENA
            </span>
          </h1>
          
          <p className="text-cyan-100/60 text-base max-w-2xl font-light leading-relaxed" data-testid="text-arena-description">
            AI-powered combat protocols. Stake Dreamz. Deploy strategies. Dominate the network.
          </p>
        </div>

        {/* REDESIGNED: Vertical Stats Grid (2x2) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-blue-950/60 to-black border border-cyan-500/30 hover:scale-105 transition-all duration-300 hover:shadow-[0_0_25px_rgba(0,217,255,0.3)]" data-testid="stat-card-network">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <Network className="w-6 h-6 text-cyan-400" />
                <span className="text-xs text-cyan-400/70 font-mono uppercase">Total</span>
              </div>
              <div className="text-4xl font-black text-white mb-1">{stats.total}</div>
              <div className="text-cyan-400/60 text-xs font-mono">Network Battles</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-950/60 to-black border border-green-500/30 hover:scale-105 transition-all duration-300 hover:shadow-[0_0_25px_rgba(34,197,94,0.3)]" data-testid="stat-card-active">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <Zap className="w-6 h-6 text-green-400 animate-pulse" />
                <span className="text-xs text-green-400/70 font-mono uppercase">Live</span>
              </div>
              <div className="text-4xl font-black bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent mb-1">{stats.live}</div>
              <div className="text-green-400/60 text-xs font-mono">Active Protocols</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-950/60 to-black border border-yellow-500/30 hover:scale-105 transition-all duration-300 hover:shadow-[0_0_25px_rgba(234,179,8,0.3)]" data-testid="stat-card-queued">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <Clock className="w-6 h-6 text-yellow-400" />
                <span className="text-xs text-yellow-400/70 font-mono uppercase">Queue</span>
              </div>
              <div className="text-4xl font-black text-white mb-1">{stats.upcoming}</div>
              <div className="text-yellow-400/60 text-xs font-mono">Scheduled</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-950/60 to-black border border-purple-500/30 hover:scale-105 transition-all duration-300 hover:shadow-[0_0_25px_rgba(168,85,247,0.3)]" data-testid="stat-card-completed">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <Trophy className="w-6 h-6 text-purple-400" />
                <span className="text-xs text-purple-400/70 font-mono uppercase">Archive</span>
              </div>
              <div className="text-4xl font-black text-white mb-1">{stats.completed}</div>
              <div className="text-purple-400/60 text-xs font-mono">Resolved</div>
            </CardContent>
          </Card>
        </div>

        {/* REDESIGNED: Side-by-side Tabs and Content Layout */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* REDESIGNED: Vertical Tab List - LEFT SIDE */}
            <div className="lg:w-64 flex-shrink-0">
              <TabsList className="flex flex-col w-full bg-gradient-to-b from-blue-950/80 to-black border border-cyan-500/30 p-2 rounded-xl space-y-2 h-auto" data-testid="tabs-vertical-list">
                <TabsTrigger 
                  value="live" 
                  className="w-full justify-start data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-blue-600 data-[state=active]:text-black data-[state=active]:shadow-lg rounded-lg py-4 px-4 text-left font-mono hover:bg-cyan-500/10 transition-all"
                  data-testid="tab-vertical-live"
                >
                  <Cpu className="w-5 h-5 mr-3" />
                  <div className="flex-1">
                    <div className="font-bold">LIVE</div>
                    <div className="text-xs opacity-70">{stats.live} Active</div>
                  </div>
                </TabsTrigger>
                
                <TabsTrigger 
                  value="upcoming" 
                  className="w-full justify-start data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-blue-600 data-[state=active]:text-black data-[state=active]:shadow-lg rounded-lg py-4 px-4 text-left font-mono hover:bg-cyan-500/10 transition-all"
                  data-testid="tab-vertical-upcoming"
                >
                  <Clock className="w-5 h-5 mr-3" />
                  <div className="flex-1">
                    <div className="font-bold">QUEUED</div>
                    <div className="text-xs opacity-70">{stats.upcoming} Pending</div>
                  </div>
                </TabsTrigger>
                
                <TabsTrigger 
                  value="completed" 
                  className="w-full justify-start data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-blue-600 data-[state=active]:text-black data-[state=active]:shadow-lg rounded-lg py-4 px-4 text-left font-mono hover:bg-cyan-500/10 transition-all"
                  data-testid="tab-vertical-completed"
                >
                  <Trophy className="w-5 h-5 mr-3" />
                  <div className="flex-1">
                    <div className="font-bold">ARCHIVE</div>
                    <div className="text-xs opacity-70">{stats.completed} Done</div>
                  </div>
                </TabsTrigger>
                
                <TabsTrigger 
                  value="my-battles" 
                  className="w-full justify-start data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-blue-600 data-[state=active]:text-black data-[state=active]:shadow-lg rounded-lg py-4 px-4 text-left font-mono hover:bg-cyan-500/10 transition-all"
                  data-testid="tab-vertical-my-battles"
                >
                  <Target className="w-5 h-5 mr-3" />
                  <div className="flex-1">
                    <div className="font-bold">MY BATTLES</div>
                    <div className="text-xs opacity-70">{userBattles?.length || 0} Total</div>
                  </div>
                </TabsTrigger>
              </TabsList>

              {/* Filter Section for My Battles */}
              {selectedTab === 'my-battles' && (
                <Card className="mt-4 bg-gradient-to-br from-blue-950/40 to-black border border-cyan-500/20" data-testid="card-status-filter">
                  <CardHeader>
                    <CardTitle className="text-sm text-cyan-400 font-mono uppercase flex items-center">
                      <Filter className="w-4 h-4 mr-2" />
                      Status Filter
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full bg-black/50 border border-cyan-500/30 text-cyan-100 rounded-lg px-3 py-2 focus:border-cyan-500 focus:outline-none font-mono text-sm"
                      data-testid="select-vertical-status"
                    >
                      <option value="all">All Status</option>
                      <option value="pending">Pending</option>
                      <option value="accepted">Accepted</option>
                      <option value="active">Active</option>
                      <option value="completed">Completed</option>
                      <option value="withdrawn">Withdrawn</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                    
                    <div className="space-y-2 text-xs font-mono">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-yellow-500 rounded-full" data-testid="dot-pending"></div>
                          <span className="text-cyan-400/80">Pending</span>
                        </div>
                        <span className="text-white font-bold">{stats.pending}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-cyan-500 rounded-full" data-testid="dot-accepted"></div>
                          <span className="text-cyan-400/80">Accepted</span>
                        </div>
                        <span className="text-white font-bold">{stats.accepted}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-gray-500 rounded-full" data-testid="dot-withdrawn"></div>
                          <span className="text-cyan-400/80">Withdrawn</span>
                        </div>
                        <span className="text-white font-bold">{stats.withdrawn}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-red-500 rounded-full" data-testid="dot-cancelled"></div>
                          <span className="text-cyan-400/80">Cancelled</span>
                        </div>
                        <span className="text-white font-bold">{stats.cancelled}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* REDESIGNED: Content Area - RIGHT SIDE (Asymmetric) */}
            <div className="flex-1 min-w-0">
              {/* Live Battles */}
              <TabsContent value="live" className="mt-0 space-y-4">
                <div className="flex items-center justify-between mb-6 bg-gradient-to-r from-green-500/10 to-transparent border-l-4 border-green-500 pl-4 py-2" data-testid="header-live-protocols">
                  <h2 className="text-2xl font-black text-transparent bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text">ACTIVE PROTOCOLS</h2>
                  <Badge className="bg-green-500/20 text-green-400 border border-green-500/40 font-mono px-3 py-1" data-testid="badge-live-count">
                    {stats.live} LIVE
                  </Badge>
                </div>

                {battlesLoading ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="h-64 bg-gradient-to-br from-blue-950/40 to-black border border-cyan-500/20 rounded-xl animate-pulse" data-testid={`skeleton-live-${i}`} />
                    ))}
                  </div>
                ) : liveBattles && liveBattles.length > 0 ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                    {liveBattles.map((battle: any) => (
                      <BattleCard key={battle.id} battle={battle} />
                    ))}
                  </div>
                ) : (
                  <Card className="bg-gradient-to-br from-blue-950/20 via-black to-blue-950/20 border border-cyan-500/20" data-testid="empty-live-section">
                    <CardContent className="p-12 text-center">
                      <div className="w-20 h-20 bg-gradient-to-br from-cyan-500/10 to-blue-600/10 rounded-xl flex items-center justify-center mx-auto mb-6 border border-cyan-500/20">
                        <Cpu className="w-10 h-10 text-cyan-500/60" />
                      </div>
                      <h3 className="text-3xl font-black text-white mb-3">NO ACTIVE PROTOCOLS</h3>
                      <p className="text-cyan-100/50 mb-8 max-w-md mx-auto">
                        Neural network awaits challengers. Deploy a battle protocol.
                      </p>
                      <Button 
                        className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-black px-8 py-3 shadow-xl shadow-cyan-500/30"
                        onClick={() => setShowCreateBattle(true)}
                        data-testid="button-deploy-live"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        DEPLOY NOW
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Upcoming Battles */}
              <TabsContent value="upcoming" className="mt-0 space-y-4">
                <div className="flex items-center justify-between mb-6 bg-gradient-to-r from-yellow-500/10 to-transparent border-l-4 border-yellow-500 pl-4 py-2" data-testid="header-queued-protocols">
                  <h2 className="text-2xl font-black text-transparent bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text">QUEUED PROTOCOLS</h2>
                  <Badge className="bg-yellow-500/20 text-yellow-400 border border-yellow-500/40 font-mono px-3 py-1" data-testid="badge-queued-count">
                    {stats.upcoming} QUEUED
                  </Badge>
                </div>

                {battlesLoading ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="h-64 bg-gradient-to-br from-blue-950/40 to-black border border-cyan-500/20 rounded-xl animate-pulse" data-testid={`skeleton-queued-${i}`} />
                    ))}
                  </div>
                ) : upcomingBattles && upcomingBattles.length > 0 ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                    {upcomingBattles.map((battle: any) => (
                      <BattleCard key={battle.id} battle={battle} />
                    ))}
                  </div>
                ) : (
                  <Card className="bg-gradient-to-br from-blue-950/20 to-black border border-cyan-500/20" data-testid="empty-queued-section">
                    <CardContent className="p-12 text-center">
                      <Clock className="w-14 h-14 text-cyan-500/40 mx-auto mb-4" />
                      <h3 className="text-2xl font-bold text-white mb-2">NO QUEUED PROTOCOLS</h3>
                      <p className="text-cyan-100/50">No battles scheduled.</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Completed Battles */}
              <TabsContent value="completed" className="mt-0 space-y-4">
                <div className="flex items-center justify-between mb-6 bg-gradient-to-r from-purple-500/10 to-transparent border-l-4 border-purple-500 pl-4 py-2" data-testid="header-archive">
                  <h2 className="text-2xl font-black text-transparent bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text">PROTOCOL ARCHIVE</h2>
                  <Badge className="bg-purple-500/20 text-purple-400 border border-purple-500/40 font-mono px-3 py-1" data-testid="badge-archive-count">
                    {stats.completed} RESOLVED
                  </Badge>
                </div>

                {battlesLoading ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="h-64 bg-gradient-to-br from-blue-950/40 to-black border border-cyan-500/20 rounded-xl animate-pulse" data-testid={`skeleton-archive-${i}`} />
                    ))}
                  </div>
                ) : completedBattles && completedBattles.length > 0 ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                    {completedBattles.map((battle: any) => (
                      <BattleCard key={battle.id} battle={battle} showResult={true} />
                    ))}
                  </div>
                ) : (
                  <Card className="bg-gradient-to-br from-blue-950/20 to-black border border-cyan-500/20" data-testid="empty-archive-section">
                    <CardContent className="p-12 text-center">
                      <Trophy className="w-14 h-14 text-cyan-500/40 mx-auto mb-4" />
                      <h3 className="text-2xl font-bold text-white mb-2">NO ARCHIVED PROTOCOLS</h3>
                      <p className="text-cyan-100/50">No battles resolved yet.</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* My Battles */}
              <TabsContent value="my-battles" className="mt-0 space-y-4">
                <div className="flex items-center justify-between mb-6 bg-gradient-to-r from-cyan-500/10 to-transparent border-l-4 border-cyan-500 pl-4 py-2" data-testid="header-my-protocols">
                  <h2 className="text-2xl font-black text-transparent bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text">MY PROTOCOLS</h2>
                  <Badge className="bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 font-mono px-3 py-1" data-testid="badge-my-count">
                    {userBattles?.length || 0} TOTAL
                  </Badge>
                </div>

                {userBattlesLoading ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="h-64 bg-gradient-to-br from-blue-950/40 to-black border border-cyan-500/20 rounded-xl animate-pulse" data-testid={`skeleton-my-${i}`} />
                    ))}
                  </div>
                ) : getFilteredBattles('my-battles') && getFilteredBattles('my-battles').length > 0 ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                    {getFilteredBattles('my-battles').map((battle: any) => (
                      <BattleCard key={battle.id} battle={battle} showResult={battle.status === 'completed'} />
                    ))}
                  </div>
                ) : (
                  <Card className="bg-gradient-to-br from-blue-950/20 to-black border border-cyan-500/20" data-testid="empty-my-section">
                    <CardContent className="p-12 text-center">
                      <Target className="w-14 h-14 text-cyan-500/40 mx-auto mb-4" />
                      <h3 className="text-2xl font-bold text-white mb-2">NO PROTOCOLS DEPLOYED</h3>
                      <p className="text-cyan-100/50 mb-6">
                        You haven't engaged in any battles yet.
                      </p>
                      <Button 
                        className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-black px-8 py-3"
                        onClick={() => setShowCreateBattle(true)}
                        data-testid="button-deploy-my"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        DEPLOY PROTOCOL
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </div>
          </div>
        </Tabs>

        {/* Create Battle Dialog */}
        <Dialog open={showCreateBattle} onOpenChange={(open) => {
          setShowCreateBattle(open);
          if (!open) resetBattleForm();
        }}>
          <DialogContent className="bg-gradient-to-br from-blue-950 via-black to-blue-950 border-2 border-cyan-500/30 text-white max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="dialog-create-protocol">
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
                  data-testid="input-protocol-name"
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
                    data-testid="input-target-search"
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
                        data-testid={`result-target-${user.id}`}
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
                  <div className="bg-gradient-to-r from-cyan-500/10 to-blue-600/10 border border-cyan-500/40 rounded-lg p-4" data-testid="panel-selected-target">
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
                        data-testid="button-clear-target"
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
                    data-testid="input-protocol-date"
                  />
                </div>

                <div>
                  <Label className="text-cyan-400 font-mono text-sm uppercase tracking-wider">Time</Label>
                  <Input
                    type="time"
                    value={battleTime}
                    onChange={(e) => setBattleTime(e.target.value)}
                    className="bg-black/50 border-cyan-500/30 text-white focus:border-cyan-500 [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:cursor-pointer font-mono"
                    data-testid="input-protocol-time"
                  />
                </div>

                <div>
                  <Label className="text-cyan-400 font-mono text-sm uppercase tracking-wider">Duration (Hrs)</Label>
                  <select
                    value={battleDuration}
                    onChange={(e) => setBattleDuration(e.target.value)}
                    className="w-full bg-black/50 border border-cyan-500/30 text-white rounded-md px-3 py-2 focus:border-cyan-500 focus:outline-none font-mono"
                    data-testid="select-protocol-duration"
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
                  data-testid="input-protocol-stake"
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
                  data-testid="textarea-protocol-desc"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowCreateBattle(false)}
                  className="flex-1 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 font-mono"
                  data-testid="button-abort-protocol"
                >
                  ABORT
                </Button>
                <Button
                  onClick={handleCreateBattle}
                  disabled={!selectedOpponent}
                  className="flex-1 bg-gradient-to-r from-cyan-500 via-blue-600 to-cyan-500 hover:from-cyan-400 hover:via-blue-500 hover:to-cyan-400 text-black font-black font-mono shadow-lg shadow-cyan-500/30"
                  data-testid="button-execute-protocol"
                >
                  DEPLOY PROTOCOL
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Balance Error Modal */}
        <Dialog open={showBalanceError} onOpenChange={setShowBalanceError}>
          <DialogContent className="bg-gradient-to-br from-red-950 via-black to-red-950 border-2 border-red-500/50 max-w-md mx-auto" data-testid="dialog-error-balance">
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
                data-testid="button-acknowledge-error"
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
