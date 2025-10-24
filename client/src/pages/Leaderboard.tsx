import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trophy, Crown, Users, Zap, Target, Flame, Search, User, Cpu, BrainCircuit, Database } from "lucide-react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";

export default function Leaderboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedTab, setSelectedTab] = useState("all-time");

  const { data: leaderboard, isLoading: leaderboardLoading } = useQuery({
    queryKey: ["/api/leaderboard", selectedTab],
    queryFn: () => fetch(`/api/leaderboard?type=${selectedTab}`).then(res => res.json()),
    retry: false,
  });

  const { data: auraLevels } = useQuery({
    queryKey: ["/api/aura-levels"],
    retry: false,
  });

  const { data: stats } = useQuery({
    queryKey: ['/api/stats'],
    retry: false,
  });

  const searchUsers = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(query.trim())}`);
      if (response.ok) {
        const users = await response.json();
        setSearchResults(users);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      searchUsers(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

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

  const getDreamzLevel = (currentStreak: number) => {
    if (currentStreak >= 30) return { name: 'Neural Master', color: 'text-[#00D9FF]', bg: 'bg-[#00D9FF]/20', glow: 'shadow-[0_0_20px_#00D9FF]' };
    if (currentStreak >= 15) return { name: 'Quantum Miner', color: 'text-[#0099FF]', bg: 'bg-[#0099FF]/20', glow: 'shadow-[0_0_15px_#0099FF]' };
    if (currentStreak >= 10) return { name: 'Smart Contract Dev', color: 'text-[#00CCFF]', bg: 'bg-[#00CCFF]/20', glow: 'shadow-[0_0_12px_#00CCFF]' };
    if (currentStreak >= 5) return { name: 'Token Trader', color: 'text-[#3B82F6]', bg: 'bg-[#3B82F6]/20', glow: 'shadow-[0_0_10px_#3B82F6]' };
    return { name: 'Genesis Node', color: 'text-[#64748B]', bg: 'bg-[#64748B]/20', glow: '' };
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    } else {
      return num.toString();
    }
  };

  const getUserRank = () => {
    if (!user || !leaderboard) return null;
    const rank = leaderboard.findIndex((u: any) => u.id === user.id) + 1;
    return rank > 0 ? rank : null;
  };

  const userRank = getUserRank();

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-[#0A0F1C] to-[#001F3F] flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-[#00D9FF] to-[#0099FF] rounded-2xl flex items-center justify-center mx-auto mb-6 animate-pulse shadow-[0_0_30px_#00D9FF]">
            <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
          <div className="text-3xl font-black bg-gradient-to-r from-[#00D9FF] to-[#0099FF] bg-clip-text text-transparent animate-pulse" data-testid="text-loading-leaderboard">
            INITIALIZING NEURAL NETWORK...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-[#0A0F1C] to-[#001F3F] relative overflow-hidden">
      {/* Futuristic Grid Pattern Overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(#00D9FF 1px, transparent 1px),
            linear-gradient(90deg, #00D9FF 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
          opacity: 0.1
        }}></div>
      </div>

      {/* Animated Cyber Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-[#00D9FF]/20 to-[#0099FF]/20 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute top-1/2 right-1/4 w-64 h-64 bg-gradient-to-br from-[#0066FF]/15 to-[#00D9FF]/15 rounded-full blur-2xl animate-float"></div>
        <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 rounded-full blur-3xl animate-pulse-slow delay-1000"></div>
      </div>

      <Navigation />
      
      {/* REDESIGNED LAYOUT: Add sidebar spacing + floating search */}
      <main className="relative md:pl-64 md:pt-0 pt-16 pb-12 px-4 sm:px-6 lg:px-8">
        {/* Floating Search - TOP RIGHT */}
        <div className="fixed top-20 md:top-6 right-6 z-50 w-80 max-w-[calc(100vw-3rem)]">
          <div className="bg-gradient-to-br from-[#0A1929] to-black border border-[#00D9FF]/40 rounded-2xl p-4 shadow-2xl shadow-[#00D9FF]/20 backdrop-blur-xl" data-testid="panel-floating-search">
            <div className="flex items-center gap-2 mb-3">
              <Search className="w-4 h-4 text-[#00D9FF]" />
              <h3 className="text-sm font-black text-[#00D9FF] uppercase tracking-wider">Node Scanner</h3>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#00D9FF]/60 w-4 h-4" />
              <Input
                type="text"
                placeholder="Scan nodes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-black/60 border-[#00D9FF]/30 text-white placeholder-gray-500 focus:border-[#00D9FF] focus:ring-[#00D9FF]"
                data-testid="input-floating-search"
              />
            </div>
            
            {searchQuery && (
              <div className="mt-3 max-h-60 overflow-y-auto">
                {isSearching ? (
                  <div className="text-center py-4">
                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-[#00D9FF]"></div>
                    <p className="text-gray-400 mt-2 text-xs" data-testid="text-scanning">Scanning...</p>
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="space-y-2">
                    {searchResults.map((searchUser: any) => (
                      <Link key={searchUser.id} href={`/user/${searchUser.id}`}>
                        <div className="bg-black/60 border border-[#00D9FF]/20 rounded-lg p-3 hover:border-[#00D9FF]/50 hover:scale-102 transition-all cursor-pointer" data-testid={`result-node-${searchUser.id}`}>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-[#00D9FF] to-[#0099FF] rounded-lg flex items-center justify-center flex-shrink-0">
                              <User className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-white font-bold text-sm truncate" data-testid={`text-scan-name-${searchUser.id}`}>
                                {searchUser.username || 'Anonymous'}
                              </h3>
                              <div className="flex items-center gap-2 text-xs text-gray-400">
                                <span data-testid={`text-scan-dreamz-${searchUser.id}`}>{searchUser.auraPoints?.toLocaleString() || 0} DRZ</span>
                                {searchUser.currentStreak > 0 && (
                                  <span className="text-[#00D9FF]" data-testid={`text-scan-streak-${searchUser.id}`}>🔥{searchUser.currentStreak}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-gray-500 text-xs" data-testid="text-no-scan-results">No nodes found</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="max-w-7xl mx-auto">
          {/* Header - Compact */}
          <div className="mb-8">
            <Badge className="bg-[#00D9FF]/20 text-[#00D9FF] border-[#00D9FF]/40 text-xs uppercase tracking-widest px-4 py-1 mb-4" data-testid="badge-ranking-system">
              ⚡ Neural Ranking v2.0
            </Badge>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black bg-gradient-to-r from-[#00D9FF] via-[#0099FF] to-cyan-300 bg-clip-text text-transparent mb-3" data-testid="heading-dreamz-leaderboard">
              DREAMZ MATRIX
            </h1>
            <p className="text-lg text-cyan-300/80 font-bold max-w-2xl" data-testid="text-matrix-desc">
              Blockchain miners ranked by Dreamz harvested
            </p>
          </div>

          {/* REDESIGNED: Horizontal Stats Bar */}
          <div className="mb-8 bg-gradient-to-r from-blue-950/40 via-blue-900/40 to-blue-950/40 backdrop-blur-sm border border-cyan-500/20 rounded-2xl p-6">
            <div className="grid grid-cols-3 gap-6">
              <div className="text-center" data-testid="stat-nodes-online">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Cpu className="w-5 h-5 text-cyan-400" />
                  <span className="text-cyan-400/70 text-xs font-mono uppercase">Nodes</span>
                </div>
                <div className="text-3xl font-black text-white">{stats?.totalUsers || 0}</div>
                <div className="text-xs text-cyan-400/60 font-mono">Online</div>
              </div>
              
              <div className="text-center border-l border-r border-cyan-500/20" data-testid="stat-total-supply">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <BrainCircuit className="w-5 h-5 text-blue-400" />
                  <span className="text-blue-400/70 text-xs font-mono uppercase">Supply</span>
                </div>
                <div className="text-3xl font-black bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                  {formatNumber(stats?.totalAura || 0)}
                </div>
                <div className="text-xs text-blue-400/60 font-mono">DRZ Tokens</div>
              </div>
              
              <div className="text-center" data-testid="stat-avg-balance">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Database className="w-5 h-5 text-cyan-400" />
                  <span className="text-cyan-400/70 text-xs font-mono uppercase">Average</span>
                </div>
                <div className="text-3xl font-black text-white">{stats?.averageAuraPerUser?.toLocaleString() || "0"}</div>
                <div className="text-xs text-cyan-400/60 font-mono">Per Node</div>
              </div>
            </div>
          </div>

          {/* User Position Banner - If ranked */}
          {userRank && (
            <Card className="bg-gradient-to-r from-[#0A1929] to-black border-[#00D9FF]/40 mb-8 shadow-[0_0_20px_#00D9FF]" data-testid="banner-user-rank">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-[#00D9FF] to-[#0099FF] rounded-2xl flex items-center justify-center shadow-[0_0_20px_#00D9FF]">
                      <Crown className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-[#00D9FF]" data-testid="heading-your-position">Your Neural Rank</h3>
                      <p className="text-gray-300">
                        Position #{userRank} • {user?.auraPoints?.toLocaleString() || "0"} DRZ
                      </p>
                    </div>
                  </div>
                  <Badge className="bg-[#00D9FF]/20 text-[#00D9FF] border-[#00D9FF]/40 text-2xl px-6 py-2" data-testid="badge-rank-number">
                    #{userRank}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {/* REDESIGNED: Card-Based Grid Leaderboard */}
          <div className="mb-10">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black text-[#00D9FF] uppercase tracking-wider" data-testid="heading-top-miners">
                ⚡ Top Miners
              </h2>
              <Badge className="bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 font-mono" data-testid="badge-total-nodes">
                {leaderboard?.length || 0} Nodes
              </Badge>
            </div>

            {leaderboardLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(9)].map((_, i) => (
                  <div key={i} className="bg-black/40 border border-[#00D9FF]/20 rounded-xl p-6 animate-pulse h-40" data-testid={`skeleton-rank-${i}`}>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-[#00D9FF]/20 rounded-lg"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-[#00D9FF]/20 rounded w-2/3 mb-2"></div>
                        <div className="h-3 bg-[#00D9FF]/20 rounded w-1/2"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : leaderboard && leaderboard.length > 0 ? (
              <div>
                {/* REDESIGNED: Top 3 as Large Feature Cards */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                  {leaderboard.slice(0, 3).map((user: any, index: number) => (
                    <Link key={user.id} href={`/user/${user.id}`}>
                      <Card className={cn(
                        "h-full transition-all duration-300 hover:scale-105 cursor-pointer overflow-hidden",
                        index === 0 ? 'bg-gradient-to-br from-[#FFD700]/20 to-[#FFA500]/20 border-2 border-[#FFD700] shadow-[0_0_30px_#FFD700]' :
                        index === 1 ? 'bg-gradient-to-br from-[#C0C0C0]/20 to-[#808080]/20 border-2 border-[#C0C0C0] shadow-[0_0_25px_#C0C0C0]' :
                        'bg-gradient-to-br from-[#CD7F32]/20 to-[#8B4513]/20 border-2 border-[#CD7F32] shadow-[0_0_25px_#CD7F32]'
                      )} data-testid={`card-top-${index + 1}`}>
                        <CardContent className="p-8 text-center">
                          {/* Rank Badge */}
                          <div className="mb-4 flex justify-center">
                            <div className={cn(
                              "w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-black",
                              index === 0 ? 'bg-gradient-to-br from-[#FFD700] to-[#FFA500] text-black shadow-[0_0_20px_#FFD700]' :
                              index === 1 ? 'bg-gradient-to-br from-[#C0C0C0] to-[#808080] text-black shadow-[0_0_15px_#C0C0C0]' :
                              'bg-gradient-to-br from-[#CD7F32] to-[#8B4513] text-white shadow-[0_0_15px_#CD7F32]'
                            )} data-testid={`badge-top-rank-${index + 1}`}>
                              {index === 0 ? '👑' : index === 1 ? '🥈' : '🥉'}
                            </div>
                          </div>
                          
                          {/* Username */}
                          <h3 className="text-2xl font-black text-white mb-2" data-testid={`text-top-name-${user.id}`}>
                            {user.username?.substring(0, 15) || 'Anonymous'}
                            {index === 0 && ' 👑'}
                          </h3>
                          
                          {/* Dreamz Count */}
                          <div className="mb-4">
                            <div className="text-4xl font-black bg-gradient-to-r from-white to-cyan-200 bg-clip-text text-transparent" data-testid={`text-top-dreamz-${user.id}`}>
                              {user.auraPoints?.toLocaleString() || 0}
                            </div>
                            <div className="text-sm text-cyan-400 font-mono uppercase">DRZ Tokens</div>
                          </div>
                          
                          {/* Streak */}
                          {user.currentStreak > 0 && (
                            <div className="flex items-center justify-center gap-2 mb-4">
                              <Flame className="w-5 h-5 text-cyan-400" />
                              <span className="text-cyan-400 font-bold" data-testid={`text-top-streak-${user.id}`}>{user.currentStreak} day streak</span>
                            </div>
                          )}
                          
                          {/* Level Badge */}
                          {(() => {
                            const dreamzLevel = getDreamzLevel(user.currentStreak || 0);
                            return (
                              <Badge className={`${dreamzLevel.bg} ${dreamzLevel.color} border border-current/30 ${dreamzLevel.glow} font-bold`} data-testid={`badge-top-level-${user.id}`}>
                                {dreamzLevel.name.toUpperCase()}
                              </Badge>
                            );
                          })()}
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>

                {/* REDESIGNED: Rest as Compact Grid Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {leaderboard.slice(3).map((user: any, index: number) => {
                    const actualIndex = index + 3;
                    const dreamzLevel = getDreamzLevel(user.currentStreak || 0);
                    
                    return (
                      <Link key={user.id} href={`/user/${user.id}`}>
                        <Card className="bg-black/40 border-[#00D9FF]/30 hover:border-[#00D9FF]/60 hover:shadow-[0_0_15px_#00D9FF]/30 transition-all hover:scale-105 cursor-pointer h-full" data-testid={`card-rank-${actualIndex + 1}`}>
                          <CardContent className="p-5">
                            {/* Rank & Username */}
                            <div className="flex items-center gap-3 mb-3">
                              <div className="w-12 h-12 bg-gradient-to-br from-[#00D9FF] to-[#0099FF] rounded-lg flex items-center justify-center font-black text-black flex-shrink-0" data-testid={`badge-grid-rank-${actualIndex + 1}`}>
                                #{actualIndex + 1}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="text-white font-bold truncate text-sm" data-testid={`text-grid-name-${user.id}`}>
                                  {user.username?.substring(0, 12) || 'Anonymous'}
                                </h3>
                              </div>
                            </div>
                            
                            {/* Dreamz Count */}
                            <div className="mb-3">
                              <div className="text-2xl font-black text-[#00D9FF]" data-testid={`text-grid-dreamz-${user.id}`}>
                                {user.auraPoints?.toLocaleString() || 0}
                              </div>
                              <div className="text-xs text-cyan-400/60 font-mono">DRZ</div>
                            </div>
                            
                            {/* Streak & Level */}
                            <div className="flex items-center justify-between gap-2">
                              {user.currentStreak > 0 ? (
                                <div className="flex items-center gap-1">
                                  <Flame className="w-3 h-3 text-cyan-400" />
                                  <span className="text-xs text-cyan-400" data-testid={`text-grid-streak-${user.id}`}>{user.currentStreak}d</span>
                                </div>
                              ) : (
                                <div></div>
                              )}
                              <Badge className={`${dreamzLevel.bg} ${dreamzLevel.color} border border-current/30 text-xs px-2 py-0.5`} data-testid={`badge-grid-level-${user.id}`}>
                                {dreamzLevel.name.split(' ')[0]}
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ) : (
              <Card className="bg-black/40 border-[#00D9FF]/20" data-testid="card-empty-leaderboard">
                <CardContent className="p-16 text-center">
                  <Trophy className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-400 mb-2" data-testid="heading-network-empty">Network Empty</h3>
                  <p className="text-gray-600" data-testid="text-first-node">Be the first to mine Dreamz!</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Neural Tier System */}
          {auraLevels && auraLevels.length > 0 && (
            <Card className="bg-[#0A1929] border-[#00D9FF]/30 mb-10 shadow-[0_0_20px_#00D9FF]/20" data-testid="card-tier-system">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-[#00D9FF]" data-testid="heading-tier-protocol">
                  ⚡ Neural Tier Protocol
                </CardTitle>
                <p className="text-gray-400">
                  Advance through neural tiers via daily mining operations. Unlock exponential vouch multipliers.
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                  {[
                    { name: 'Genesis Node', minStreak: 0, color: '#64748B', multiplier: 'Standard' },
                    { name: 'Token Trader', minStreak: 5, color: '#3B82F6', multiplier: '1.3x' },
                    { name: 'Smart Contract Dev', minStreak: 10, color: '#00CCFF', multiplier: '1.5x' },
                    { name: 'Quantum Miner', minStreak: 15, color: '#0099FF', multiplier: '2.0x' },
                    { name: 'Neural Master', minStreak: 30, color: '#00D9FF', multiplier: '3.0x' }
                  ].map((tier) => (
                    <div 
                      key={tier.name} 
                      className="text-center p-4 rounded-xl border bg-gradient-to-br from-black/60 to-black/40 hover:scale-105 transition-all duration-300"
                      style={{
                        borderColor: `${tier.color}40`,
                        backgroundColor: `${tier.color}10`
                      }}
                      data-testid={`card-tier-${tier.name.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      <div 
                        className="w-12 h-12 mx-auto mb-3 rounded-xl flex items-center justify-center"
                        style={{
                          backgroundColor: `${tier.color}20`,
                          boxShadow: tier.name === 'Neural Master' ? `0 0 20px ${tier.color}` : 'none'
                        }}
                      >
                        <BrainCircuit 
                          className="w-6 h-6"
                          style={{ color: tier.color }}
                        />
                      </div>
                      <h4 
                        className="font-black mb-2 text-sm"
                        style={{ color: tier.color }}
                        data-testid={`heading-tier-${tier.name.toLowerCase().replace(/\s+/g, '-')}`}
                      >
                        {tier.name}
                      </h4>
                      <p className="text-xs text-gray-400 mb-3" data-testid={`text-requirement-${tier.name.toLowerCase().replace(/\s+/g, '-')}`}>
                        {tier.minStreak === 0 ? '0 days' : `${tier.minStreak}d+`}
                      </p>
                      <Badge 
                        variant="outline" 
                        className="text-xs font-bold"
                        style={{
                          color: tier.color,
                          borderColor: `${tier.color}40`,
                          backgroundColor: `${tier.color}20`
                        }}
                        data-testid={`badge-multiplier-${tier.name.toLowerCase().replace(/\s+/g, '-')}`}
                      >
                        {tier.multiplier}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Network Operations CTA */}
          <Card className="bg-gradient-to-r from-[#0A1929] to-black border-[#00D9FF]/40 shadow-[0_0_25px_#00D9FF]/30 overflow-hidden" data-testid="card-operations-cta">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0" style={{
                backgroundImage: `
                  linear-gradient(#00D9FF 1px, transparent 1px),
                  linear-gradient(90deg, #00D9FF 1px, transparent 1px)
                `,
                backgroundSize: '40px 40px'
              }}></div>
            </div>
            <CardContent className="p-8 text-center relative">
              <h3 className="text-2xl sm:text-3xl font-black text-[#00D9FF] mb-4" data-testid="heading-ready-mine">
                Ready to Mine the Network?
              </h3>
              <p className="text-gray-300 mb-6 max-w-2xl mx-auto" data-testid="text-mine-description">
                Execute smart contracts, decode blockchain mysteries, and harvest Dreamz tokens to dominate the neural rankings
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  className="bg-gradient-to-r from-[#00D9FF] to-[#0099FF] hover:from-[#00B8E6] hover:to-[#0080E6] text-black font-black shadow-[0_0_20px_#00D9FF] hover:shadow-[0_0_30px_#00D9FF] transition-all"
                  onClick={() => window.location.href = "/"}
                  data-testid="button-start-mining-cta"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Start Mining
                </Button>
                <Button 
                  variant="outline"
                  className="border-cyan-400 text-cyan-400 hover:bg-cyan-400 hover:text-black font-black"
                  onClick={() => window.location.href = "/battles"}
                  data-testid="button-enter-arena-cta"
                >
                  <Trophy className="w-4 h-4 mr-2" />
                  Enter Battle Arena
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
