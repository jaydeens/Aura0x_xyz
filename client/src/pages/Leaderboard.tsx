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
          <div className="text-3xl font-black bg-gradient-to-r from-[#00D9FF] to-[#0099FF] bg-clip-text text-transparent animate-pulse" data-testid="text-loading">
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
      
      <main className="relative pt-16 sm:pt-20 pb-8 sm:pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Hero Section - Redesigned */}
          <div className="text-center mb-10 sm:mb-16">
            <div className="inline-block mb-4">
              <Badge className="bg-[#00D9FF]/20 text-[#00D9FF] border-[#00D9FF]/40 text-xs uppercase tracking-widest px-4 py-1" data-testid="badge-neural-system">
                ⚡ Neural Ranking System v2.0
              </Badge>
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black bg-gradient-to-r from-[#00D9FF] via-[#0099FF] to-cyan-300 bg-clip-text text-transparent mb-4 sm:mb-6 leading-tight tracking-tight" data-testid="heading-dreamz-matrix">
              ⚡ DREAMZ MATRIX ⚡
            </h1>
            <p className="text-xl sm:text-2xl text-cyan-300/90 font-bold max-w-3xl mx-auto" data-testid="text-matrix-subtitle">
              Decode the blockchain. Ascend the neural network. Harvest Dreamz.
            </p>
          </div>

          {/* Blockchain Stats Grid - Reorganized */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-10">
            {/* Total Nodes */}
            <div className="relative bg-gradient-to-br from-[#0A1929] to-black border border-[#00D9FF]/30 rounded-2xl p-6 text-white group hover:scale-105 transition-all duration-300 hover:shadow-[0_0_30px_#00D9FF] overflow-hidden" data-testid="card-total-nodes">
              <div className="absolute inset-0 bg-gradient-to-br from-[#00D9FF]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-black uppercase tracking-wider text-[#00D9FF]">
                    <Cpu className="w-4 h-4 inline mr-2" />
                    Active Nodes
                  </h3>
                  <Users className="w-6 h-6 text-[#00D9FF]/60" />
                </div>
                <div className="text-4xl font-black mb-1 bg-gradient-to-r from-white to-cyan-200 bg-clip-text text-transparent" data-testid="text-total-users">
                  {stats?.totalUsers || 0}
                </div>
                <div className="text-[#00D9FF]/70 text-sm font-semibold">synchronized</div>
              </div>
            </div>

            {/* Total Dreamz */}
            <div className="relative bg-gradient-to-br from-[#0A1929] to-black border border-[#0099FF]/30 rounded-2xl p-6 text-white group hover:scale-105 transition-all duration-300 hover:shadow-[0_0_30px_#0099FF] overflow-hidden" data-testid="card-total-dreamz">
              <div className="absolute inset-0 bg-gradient-to-br from-[#0099FF]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-black uppercase tracking-wider text-[#0099FF]">
                    <BrainCircuit className="w-4 h-4 inline mr-2" />
                    Dreamz Supply
                  </h3>
                  <Zap className="w-6 h-6 text-[#0099FF]/60" />
                </div>
                <div className="text-4xl font-black mb-1 bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent" data-testid="text-total-dreamz">
                  {formatNumber(stats?.totalAura || 0)}
                </div>
                <div className="text-[#0099FF]/70 text-sm font-semibold">DRZ tokens</div>
              </div>
            </div>

            {/* Network Average */}
            <div className="relative bg-gradient-to-br from-[#0A1929] to-black border border-cyan-500/30 rounded-2xl p-6 text-white group hover:scale-105 transition-all duration-300 hover:shadow-[0_0_30px_cyan] overflow-hidden" data-testid="card-network-average">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-black uppercase tracking-wider text-cyan-400">
                    <Database className="w-4 h-4 inline mr-2" />
                    Network Avg
                  </h3>
                  <Target className="w-6 h-6 text-cyan-400/60" />
                </div>
                <div className="text-4xl font-black mb-1 bg-gradient-to-r from-white to-cyan-200 bg-clip-text text-transparent" data-testid="text-average-dreamz">
                  {stats?.averageAuraPerUser?.toLocaleString() || "0"}
                </div>
                <div className="text-cyan-400/70 text-sm font-semibold">per node</div>
              </div>
            </div>
          </div>

          {/* User Neural Position Card */}
          {userRank && (
            <Card className="bg-gradient-to-r from-[#0A1929] to-black border-[#00D9FF]/40 mb-8 shadow-[0_0_20px_#00D9FF] overflow-hidden" data-testid="card-user-position">
              <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0" style={{
                  backgroundImage: `
                    linear-gradient(#00D9FF 1px, transparent 1px),
                    linear-gradient(90deg, #00D9FF 1px, transparent 1px)
                  `,
                  backgroundSize: '30px 30px'
                }}></div>
              </div>
              <CardContent className="p-6 relative">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-[#00D9FF] to-[#0099FF] rounded-xl flex items-center justify-center shadow-[0_0_20px_#00D9FF]">
                      <Crown className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-[#00D9FF]" data-testid="heading-neural-rank">Neural Rank Status</h3>
                      <p className="text-gray-300">
                        Position #{userRank} with {user?.auraPoints?.toLocaleString() || "0"} Dreamz Tokens
                      </p>
                    </div>
                  </div>
                  <div className="text-center sm:text-right">
                    <Badge className="bg-[#00D9FF]/20 text-[#00D9FF] border-[#00D9FF]/40 mb-2 text-lg px-4 py-1" data-testid="badge-user-rank">
                      #{userRank}
                    </Badge>
                    <div className="text-sm text-cyan-300 font-semibold" data-testid="text-user-streak">
                      {user?.currentStreak || 0} day neural streak
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Node Discovery System */}
          <Card className="bg-[#0A1929] border-[#00D9FF]/30 mb-8 shadow-[0_0_15px_#00D9FF]/50" data-testid="card-node-discovery">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-[#00D9FF] flex items-center" data-testid="heading-node-discovery">
                <Search className="w-5 h-5 mr-2" />
                Node Discovery System
              </CardTitle>
              <p className="text-gray-400">
                Scan the blockchain network for connected nodes
              </p>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#00D9FF]/60 w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Search nodes by identifier..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-black/60 border-[#00D9FF]/30 text-white placeholder-gray-500 focus:border-[#00D9FF] focus:ring-[#00D9FF]"
                  data-testid="input-search-nodes"
                />
              </div>
              
              {searchQuery && (
                <div className="mt-4">
                  {isSearching ? (
                    <div className="text-center py-4">
                      <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-[#00D9FF]"></div>
                      <p className="text-gray-400 mt-2" data-testid="text-searching">Scanning network...</p>
                    </div>
                  ) : searchResults.length > 0 ? (
                    <div className="space-y-3">
                      <h4 className="text-[#00D9FF] font-semibold" data-testid="heading-scan-results">Scan Results</h4>
                      {searchResults.map((searchUser: any) => (
                        <div key={searchUser.id} className="bg-black/60 border border-[#00D9FF]/20 rounded-xl p-4 transition-all duration-300 hover:scale-105 hover:border-[#00D9FF]/50 hover:shadow-[0_0_15px_#00D9FF]/30" data-testid={`card-search-user-${searchUser.id}`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div className="w-12 h-12 bg-gradient-to-br from-[#00D9FF] to-[#0099FF] rounded-lg flex items-center justify-center shadow-[0_0_10px_#00D9FF]">
                                <User className="w-6 h-6 text-white" />
                              </div>
                              <div>
                                <h3 className="text-white font-bold text-lg" data-testid={`text-search-username-${searchUser.id}`}>
                                  {searchUser.username || 'Anonymous Node'}
                                </h3>
                                <div className="flex items-center space-x-4 text-sm text-gray-400">
                                  <span data-testid={`text-search-dreamz-${searchUser.id}`}>{searchUser.auraPoints?.toLocaleString() || 0} DRZ</span>
                                  {searchUser.currentStreak > 0 && (
                                    <div className="flex items-center">
                                      <Flame className="w-4 h-4 text-[#00D9FF] mr-1" />
                                      <span className="text-[#00D9FF]" data-testid={`text-search-streak-${searchUser.id}`}>{searchUser.currentStreak} streak</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-3">
                              {(() => {
                                const dreamzLevel = getDreamzLevel(searchUser.currentStreak || 0);
                                return (
                                  <div className={`px-3 py-1 rounded-lg text-xs font-bold ${dreamzLevel.bg} ${dreamzLevel.color} border border-current/30`} data-testid={`badge-search-level-${searchUser.id}`}>
                                    {dreamzLevel.name.toUpperCase()}
                                  </div>
                                );
                              })()}
                              <Link href={`/user/${searchUser.id}`}>
                                <Button size="sm" className="bg-gradient-to-r from-[#00D9FF] to-[#0099FF] hover:from-[#00B8E6] hover:to-[#0080E6] text-black font-bold shadow-[0_0_10px_#00D9FF]" data-testid={`button-view-profile-${searchUser.id}`}>
                                  Access Node
                                </Button>
                              </Link>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : searchQuery.length > 0 ? (
                    <div className="text-center py-8">
                      <Users className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                      <h4 className="text-gray-300 font-semibold mb-1" data-testid="heading-no-nodes">No nodes detected</h4>
                      <p className="text-gray-500" data-testid="text-try-different">Try a different search query</p>
                    </div>
                  ) : null}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Neural Rankings Matrix - Main Leaderboard */}
          <div className="bg-gradient-to-br from-[#0A1929] to-black rounded-3xl overflow-hidden border border-[#00D9FF]/40 shadow-[0_0_30px_#00D9FF]/30" data-testid="card-neural-rankings">
            <div className="bg-gradient-to-r from-[#00D9FF] via-[#0099FF] to-cyan-500 p-4 sm:p-6 relative overflow-hidden">
              <div className="absolute inset-0 opacity-20">
                <div className="absolute inset-0" style={{
                  backgroundImage: `
                    linear-gradient(white 1px, transparent 1px),
                    linear-gradient(90deg, white 1px, transparent 1px)
                  `,
                  backgroundSize: '20px 20px'
                }}></div>
              </div>
              <div className="relative">
                <h2 className="text-2xl sm:text-3xl font-black text-black text-center uppercase tracking-wider" data-testid="heading-neural-rankings">
                  ⚡ Neural Rankings ⚡
                </h2>
                <p className="text-black/80 text-center mt-2 text-sm sm:text-base font-bold" data-testid="text-top-miners">Top blockchain miners in the network</p>
              </div>
            </div>
            
            <div className="p-4 sm:p-6">
              {leaderboardLoading ? (
                <div className="space-y-3">
                  {[...Array(10)].map((_, i) => (
                    <div key={i} className="bg-black/40 border border-[#00D9FF]/20 rounded-xl p-4 animate-pulse">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-[#00D9FF]/20 rounded-lg"></div>
                        <div className="flex-1">
                          <div className="h-4 bg-[#00D9FF]/20 rounded w-1/3 mb-2"></div>
                          <div className="h-3 bg-[#00D9FF]/20 rounded w-1/4"></div>
                        </div>
                        <div className="h-6 bg-[#00D9FF]/20 rounded w-20"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : leaderboard && leaderboard.length > 0 ? (
                <div className="space-y-3">
                  {leaderboard.map((user: any, index: number) => (
                    <Link key={user.id} href={`/user/${user.id}`}>
                      <div className={`rounded-xl p-4 transition-all duration-300 hover:scale-105 cursor-pointer border ${
                        index === 0 ? 'bg-gradient-to-r from-[#FFD700]/20 to-[#FFA500]/20 border-[#FFD700]/50 shadow-[0_0_20px_#FFD700]' :
                        index === 1 ? 'bg-gradient-to-r from-[#C0C0C0]/20 to-[#808080]/20 border-[#C0C0C0]/50 shadow-[0_0_15px_#C0C0C0]' :
                        index === 2 ? 'bg-gradient-to-r from-[#CD7F32]/20 to-[#8B4513]/20 border-[#CD7F32]/50 shadow-[0_0_15px_#CD7F32]' :
                        'bg-black/40 border-[#00D9FF]/30 hover:border-[#00D9FF]/60 hover:shadow-[0_0_15px_#00D9FF]/30'
                      }`} data-testid={`card-leaderboard-user-${user.id}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3 flex-1 min-w-0">
                            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center font-black text-sm sm:text-lg flex-shrink-0 ${
                              index === 0 ? 'bg-gradient-to-br from-[#FFD700] to-[#FFA500] text-black shadow-[0_0_15px_#FFD700]' :
                              index === 1 ? 'bg-gradient-to-br from-[#C0C0C0] to-[#808080] text-black shadow-[0_0_10px_#C0C0C0]' :
                              index === 2 ? 'bg-gradient-to-br from-[#CD7F32] to-[#8B4513] text-white shadow-[0_0_10px_#CD7F32]' :
                              'bg-gradient-to-br from-[#00D9FF] to-[#0099FF] text-black'
                            }`} data-testid={`badge-rank-${index + 1}`}>
                              {index < 3 ? (index === 0 ? '👑' : index === 1 ? '🥈' : '🥉') : `#${index + 1}`}
                            </div>
                            <div className="min-w-0 flex-1">
                              <h3 className="text-white font-bold text-base sm:text-lg truncate" data-testid={`text-username-${user.id}`}>
                                {user.username?.substring(0, 15) || 'Anonymous Node'}
                                {index === 0 && ' 👑'}
                              </h3>
                              <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-3 text-xs sm:text-sm text-gray-400">
                                <span className="whitespace-nowrap text-[#00D9FF] font-semibold" data-testid={`text-dreamz-${user.id}`}>{user.auraPoints?.toLocaleString() || 0} DRZ</span>
                                {user.currentStreak > 0 && (
                                  <div className="flex items-center">
                                    <Flame className="w-3 h-3 sm:w-4 sm:h-4 text-cyan-400 mr-1" />
                                    <span className="text-cyan-400 whitespace-nowrap" data-testid={`text-streak-${user.id}`}>{user.currentStreak} streak</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0 ml-2">
                            {(() => {
                              const dreamzLevel = getDreamzLevel(user.currentStreak || 0);
                              return (
                                <div className={`px-2 py-1 sm:px-3 sm:py-1 rounded-lg text-xs font-bold ${dreamzLevel.bg} ${dreamzLevel.color} border border-current/30 ${dreamzLevel.glow}`} data-testid={`badge-level-${user.id}`}>
                                  <span className="hidden lg:inline">{dreamzLevel.name.toUpperCase()}</span>
                                  <span className="lg:hidden">{dreamzLevel.name.substring(0, 8).toUpperCase()}</span>
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <Trophy className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-400 mb-2" data-testid="heading-no-rankings">Network Empty</h3>
                  <p className="text-gray-600" data-testid="text-first-miner">Be the first miner to harvest Dreamz and claim neural supremacy!</p>
                </div>
              )}
            </div>
          </div>

          {/* Neural Tier System */}
          {auraLevels && auraLevels.length > 0 && (
            <Card className="bg-[#0A1929] border-[#00D9FF]/30 mt-10 shadow-[0_0_20px_#00D9FF]/20" data-testid="card-neural-tiers">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-[#00D9FF]" data-testid="heading-neural-tiers">
                  ⚡ Neural Tier Protocol
                </CardTitle>
                <p className="text-gray-400">
                  Advance through neural tiers via daily mining operations. Unlock exponential vouch multipliers.
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                        className="font-black mb-2 text-sm sm:text-base"
                        style={{ color: tier.color }}
                        data-testid={`heading-tier-${tier.name.toLowerCase().replace(/\s+/g, '-')}`}
                      >
                        {tier.name}
                      </h4>
                      <p className="text-xs text-gray-400 mb-3" data-testid={`text-tier-requirement-${tier.name.toLowerCase().replace(/\s+/g, '-')}`}>
                        {tier.minStreak === 0 ? 'Default tier (0 days)' : `${tier.minStreak}-day neural streak`}
                      </p>
                      <Badge 
                        variant="outline" 
                        className="text-xs font-bold"
                        style={{
                          color: tier.color,
                          borderColor: `${tier.color}40`,
                          backgroundColor: `${tier.color}20`
                        }}
                        data-testid={`badge-tier-multiplier-${tier.name.toLowerCase().replace(/\s+/g, '-')}`}
                      >
                        {tier.multiplier} vouch power
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Network Operations CTA */}
          <Card className="bg-gradient-to-r from-[#0A1929] to-black border-[#00D9FF]/40 mt-10 shadow-[0_0_25px_#00D9FF]/30 overflow-hidden" data-testid="card-network-operations">
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
              <h3 className="text-2xl sm:text-3xl font-black text-[#00D9FF] mb-4" data-testid="heading-ready-to-mine">
                Ready to Mine the Network?
              </h3>
              <p className="text-gray-300 mb-6 max-w-2xl mx-auto" data-testid="text-mining-description">
                Execute smart contracts, decode blockchain mysteries, and harvest Dreamz tokens to dominate the neural rankings
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  className="bg-gradient-to-r from-[#00D9FF] to-[#0099FF] hover:from-[#00B8E6] hover:to-[#0080E6] text-black font-black shadow-[0_0_20px_#00D9FF] hover:shadow-[0_0_30px_#00D9FF] transition-all"
                  onClick={() => window.location.href = "/"}
                  data-testid="button-start-mining"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Start Mining
                </Button>
                <Button 
                  variant="outline"
                  className="border-cyan-400 text-cyan-400 hover:bg-cyan-400 hover:text-black font-black"
                  onClick={() => window.location.href = "/battles"}
                  data-testid="button-enter-arena"
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
