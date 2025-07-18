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
import { Trophy, Crown, Users, Zap, Target, Flame, Search, User } from "lucide-react";
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

  // Search for users
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

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      searchUsers(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

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

  // Function to get user's Aura level based on streak
  const getUserAuraLevel = (currentStreak: number) => {
    if (currentStreak >= 30) return { name: 'Aura Vader', color: 'text-[#8B5CF6]', bg: 'bg-[#8B5CF6]/20' };
    if (currentStreak >= 15) return { name: 'Grinder', color: 'text-[#3B82F6]', bg: 'bg-[#3B82F6]/20' };
    if (currentStreak >= 10) return { name: 'Dedicated', color: 'text-[#34D399]', bg: 'bg-[#34D399]/20' };
    if (currentStreak >= 5) return { name: 'Attention Seeker', color: 'text-[#F97316]', bg: 'bg-[#F97316]/20' };
    return { name: 'Clout Chaser', color: 'text-[#9CA3AF]', bg: 'bg-[#9CA3AF]/20' };
  };

  // Function to format numbers intelligently
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
      <div className="min-h-screen bg-gradient-to-br from-black via-purple-900 to-pink-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-pink-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-6 animate-pulse">
            <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
          <div className="text-3xl font-black bg-gradient-to-r from-pink-400 to-purple-500 bg-clip-text text-transparent animate-pulse">
            LOADING HALL OF FAME...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-purple-900 to-pink-900">
      {/* Animated background orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-br from-purple-600/30 to-pink-600/30 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute top-1/2 right-1/4 w-48 h-48 bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-full blur-2xl animate-float"></div>
        <div className="absolute bottom-1/4 left-1/3 w-56 h-56 bg-gradient-to-br from-pink-600/25 to-orange-600/25 rounded-full blur-3xl animate-pulse-slow delay-1000"></div>
      </div>

      <Navigation />
      
      <main className="relative pt-16 sm:pt-20 pb-8 sm:pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Mobile-Optimized Hero Section */}
          <div className="text-center mb-8 sm:mb-12">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black bg-gradient-to-r from-pink-400 via-purple-500 to-cyan-400 bg-clip-text text-transparent mb-3 sm:mb-4 leading-tight">
              🏆 AURA LEADERBOARD 🏆
            </h1>
            <p className="text-2xl text-white/80 font-semibold">
              Rise through the ranks and claim your spot among the elite
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Total Users */}
            <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl p-6 text-white group hover:scale-105 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-black uppercase tracking-wider">👥 Creators</h3>
                <Users className="w-6 h-6 text-white/80" />
              </div>
              <div className="text-3xl font-black mb-1">{stats?.totalUsers || 0}</div>
              <div className="text-white/80 text-sm">registered</div>
            </div>

            {/* Total Aura */}
            <div className="bg-gradient-to-br from-yellow-500 to-orange-500 rounded-3xl p-6 text-white group hover:scale-105 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-black uppercase tracking-wider">⚡ Aura</h3>
                <Zap className="w-6 h-6 text-white/80" />
              </div>
              <div className="text-3xl font-black mb-1">{formatNumber(stats?.totalAura || 0)}</div>
              <div className="text-white/80 text-sm">APs</div>
            </div>

            {/* Average */}
            <div className="bg-gradient-to-br from-green-500 to-cyan-500 rounded-3xl p-6 text-white group hover:scale-105 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-black uppercase tracking-wider">🎯 Average</h3>
                <Target className="w-6 h-6 text-white/80" />
              </div>
              <div className="text-3xl font-black mb-1">{stats?.averageAuraPerUser?.toLocaleString() || "0"}</div>
              <div className="text-white/80 text-sm">per creator</div>
            </div>
          </div>

          {/* User Rank Card */}
          {userRank && (
            <Card className="bg-gradient-to-r from-[#1A1A1B] to-[#8000FF]/5 border-[#8000FF]/30 mb-8">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-[#8000FF] to-[#9933FF] rounded-full flex items-center justify-center">
                      <Crown className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">Your Position</h3>
                      <p className="text-gray-400">
                        Rank #{userRank} with {user?.auraPoints?.toLocaleString() || "0"} Aura Points
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className="bg-[#8000FF]/20 text-[#8000FF] border-[#8000FF]/40 mb-2">
                      #{userRank}
                    </Badge>
                    <div className="text-sm text-gray-400">
                      {user?.currentStreak || 0} day streak
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* User Search Section */}
          <Card className="bg-[#1A1A1B] border-[#8000FF]/20 mb-8">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-white flex items-center">
                <Search className="w-5 h-5 mr-2" />
                Find Creators
              </CardTitle>
              <p className="text-gray-400">
                Search for other creators in the community
              </p>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Search by username..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-[#8000FF] focus:ring-[#8000FF]"
                />
              </div>
              
              {/* Search Results */}
              {searchQuery && (
                <div className="mt-4">
                  {isSearching ? (
                    <div className="text-center py-4">
                      <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-[#8000FF]"></div>
                      <p className="text-gray-400 mt-2">Searching...</p>
                    </div>
                  ) : searchResults.length > 0 ? (
                    <div className="space-y-3">
                      <h4 className="text-white font-semibold">Search Results</h4>
                      {searchResults.map((searchUser: any) => (
                        <div key={searchUser.id} className="bg-gray-800/50 rounded-2xl p-4 transition-all duration-300 hover:scale-105 hover:bg-gray-800/70">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div className="w-12 h-12 bg-gradient-to-br from-[#8000FF] to-[#9933FF] rounded-full flex items-center justify-center">
                                <User className="w-6 h-6 text-white" />
                              </div>
                              <div>
                                <h3 className="text-white font-bold text-lg">
                                  {searchUser.username || 'Anonymous Creator'}
                                </h3>
                                <div className="flex items-center space-x-4 text-sm text-gray-400">
                                  <span>{searchUser.auraPoints?.toLocaleString() || 0} Aura</span>
                                  {searchUser.currentStreak > 0 && (
                                    <div className="flex items-center">
                                      <Flame className="w-4 h-4 text-orange-400 mr-1" />
                                      <span className="text-orange-400">{searchUser.currentStreak} streak</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-3">
                              {(() => {
                                const auraLevel = getUserAuraLevel(searchUser.currentStreak || 0);
                                return (
                                  <div className={`px-3 py-1 rounded-full text-xs font-bold ${auraLevel.bg} ${auraLevel.color}`}>
                                    {auraLevel.name.toUpperCase()}
                                  </div>
                                );
                              })()}
                              <Link href={`/user/${searchUser.id}`}>
                                <Button size="sm" className="bg-[#8000FF] hover:bg-[#6B00E6] text-white">
                                  View Profile
                                </Button>
                              </Link>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : searchQuery.length > 0 ? (
                    <div className="text-center py-8">
                      <Users className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                      <h4 className="text-gray-300 font-semibold mb-1">No creators found</h4>
                      <p className="text-gray-500">Try a different search term</p>
                    </div>
                  ) : null}
                </div>
              )}
            </CardContent>
          </Card>

          {/* TikTok-Style Leaderboard */}
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl overflow-hidden border border-gray-700">
            <div className="bg-gradient-to-r from-pink-500 to-purple-600 p-6">
              <h2 className="text-3xl font-black text-white text-center">🏆 Aura Leaderboard 🏆</h2>
              <p className="text-white/80 text-center mt-2">The most viral creators in our community</p>
            </div>
            
            <div className="p-6">
              {leaderboardLoading ? (
                <div className="space-y-4">
                  {[...Array(10)].map((_, i) => (
                    <div key={i} className="bg-gray-800/50 rounded-2xl p-4 animate-pulse">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gray-700 rounded-full"></div>
                        <div className="flex-1">
                          <div className="h-4 bg-gray-700 rounded w-1/3 mb-2"></div>
                          <div className="h-3 bg-gray-700 rounded w-1/4"></div>
                        </div>
                        <div className="h-6 bg-gray-700 rounded w-16"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : leaderboard && leaderboard.length > 0 ? (
                <div className="space-y-3">
                  {leaderboard.map((user: any, index: number) => (
                    <Link key={user.id} href={`/user/${user.id}`}>
                      <div className={`rounded-2xl p-4 transition-all duration-300 hover:scale-105 cursor-pointer ${
                        index === 0 ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30' :
                        index === 1 ? 'bg-gradient-to-r from-gray-400/20 to-gray-500/20 border border-gray-400/30' :
                        index === 2 ? 'bg-gradient-to-r from-amber-600/20 to-amber-700/20 border border-amber-600/30' :
                        'bg-gray-800/50 border border-gray-700/50'
                      }`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3 flex-1 min-w-0">
                            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center font-black text-sm sm:text-lg flex-shrink-0 ${
                              index === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-white' :
                              index === 1 ? 'bg-gradient-to-br from-gray-400 to-gray-600 text-white' :
                              index === 2 ? 'bg-gradient-to-br from-amber-600 to-amber-800 text-white' :
                              'bg-gradient-to-br from-pink-500 to-purple-600 text-white'
                            }`}>
                              {index < 3 ? (index === 0 ? '👑' : index === 1 ? '🥈' : '🥉') : `#${index + 1}`}
                            </div>
                            <div className="min-w-0 flex-1">
                              <h3 className="text-white font-bold text-base sm:text-lg truncate">
                                {user.username?.substring(0, 15) || 'Anonymous Creator'}
                                {index === 0 && ' 👑'}
                              </h3>
                              <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 text-xs sm:text-sm text-gray-400">
                                <span className="whitespace-nowrap">{user.auraPoints?.toLocaleString() || 0} Aura</span>
                                {user.currentStreak > 0 && (
                                  <div className="flex items-center">
                                    <Flame className="w-3 h-3 sm:w-4 sm:h-4 text-orange-400 mr-1" />
                                    <span className="text-orange-400 whitespace-nowrap">{user.currentStreak} streak</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0 ml-2">
                            {(() => {
                              const auraLevel = getUserAuraLevel(user.currentStreak || 0);
                              return (
                                <div className={`px-2 py-1 sm:px-3 sm:py-1 rounded-full text-xs font-bold ${auraLevel.bg} ${auraLevel.color}`}>
                                  <span className="hidden sm:inline">{auraLevel.name.toUpperCase()}</span>
                                  <span className="sm:hidden">{auraLevel.name.substring(0, 8).toUpperCase()}</span>
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
                  <Trophy className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-300 mb-2">No Rankings Yet</h3>
                  <p className="text-gray-500">Be the first to earn Aura points and claim the top spot!</p>
                </div>
              )}
            </div>
          </div>

          {/* Aura Levels Reference */}
          {auraLevels && auraLevels.length > 0 && (
            <Card className="bg-[#1A1A1B] border-[#8000FF]/20 mt-8">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-white">
                  Aura Level System
                </CardTitle>
                <p className="text-gray-400">
                  Achieve higher levels through daily lesson streaks. Unlock vouching multipliers!
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {auraLevels && auraLevels.length > 0 ? 
                    [...new Map(auraLevels.map((level: any) => [level.name, level])).values()]
                    .sort((a: any, b: any) => a.minDays - b.minDays)
                    .map((level: any) => (
                      <div key={level.name} className={cn(
                        "text-center p-3 sm:p-4 rounded-lg border",
                        level.name === 'Clout Chaser' && 'border-[#9CA3AF]/40 bg-[#9CA3AF]/10',
                        level.name === 'Attention Seeker' && 'border-[#F97316]/40 bg-[#F97316]/10',
                        level.name === 'Dedicated' && 'border-[#34D399]/40 bg-[#34D399]/10',
                        level.name === 'Grinder' && 'border-[#3B82F6]/40 bg-[#3B82F6]/10',
                        level.name === 'Aura Vader' && 'border-[#8B5CF6]/40 bg-[#8B5CF6]/10 animate-pulse-glow'
                      )}
                      style={level.name === 'Aura Vader' ? {
                        boxShadow: '0 0 20px #8B5CF6, 0 0 40px #8B5CF6, 0 0 80px #8B5CF6'
                      } : {}}>
                        <div className={cn(
                          "w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-3 rounded-full flex items-center justify-center",
                          level.name === 'Clout Chaser' && 'bg-[#9CA3AF]/20',
                          level.name === 'Attention Seeker' && 'bg-[#F97316]/20',
                          level.name === 'Dedicated' && 'bg-[#34D399]/20',
                          level.name === 'Grinder' && 'bg-[#3B82F6]/20',
                          level.name === 'Aura Vader' && 'bg-[#8B5CF6]/20'
                        )}>
                          <Crown className={cn(
                            "w-5 h-5 sm:w-6 sm:h-6",
                            level.name === 'Clout Chaser' && 'text-[#9CA3AF]',
                            level.name === 'Attention Seeker' && 'text-[#F97316]',
                            level.name === 'Dedicated' && 'text-[#34D399]',
                            level.name === 'Grinder' && 'text-[#3B82F6]',
                            level.name === 'Aura Vader' && 'text-[#8B5CF6]'
                          )} />
                        </div>
                        <h4 className={cn(
                          "font-bold mb-1 text-sm sm:text-base",
                          level.name === 'Clout Chaser' && 'text-[#9CA3AF]',
                          level.name === 'Attention Seeker' && 'text-[#F97316]',
                          level.name === 'Dedicated' && 'text-[#34D399]',
                          level.name === 'Grinder' && 'text-[#3B82F6]',
                          level.name === 'Aura Vader' && 'text-[#8B5CF6]'
                        )}>
                          {level.name}
                        </h4>
                        <p className="text-xs sm:text-sm text-gray-400 mb-2">
                          {level.name === 'Clout Chaser' ? 'Default level (0 days)' :
                           level.name === 'Attention Seeker' ? '5-day streak' :
                           level.name === 'Dedicated' ? '10-day streak' :
                           level.name === 'Grinder' ? '15-day streak' :
                           level.name === 'Aura Vader' ? '30-day streak' :
                           `${level.minDays}${level.maxDays ? `-${level.maxDays}` : '+'} days`}
                        </p>
                        <div className="text-center">
                          <Badge 
                            variant="outline" 
                            className={cn(
                              "text-xs",
                              level.name === 'Clout Chaser' && 'text-[#9CA3AF] border-[#9CA3AF]/40 bg-[#9CA3AF]/20',
                              level.name === 'Attention Seeker' && 'text-[#F97316] border-[#F97316]/40 bg-[#F97316]/20',
                              level.name === 'Dedicated' && 'text-[#34D399] border-[#34D399]/40 bg-[#34D399]/20',
                              level.name === 'Grinder' && 'text-[#3B82F6] border-[#3B82F6]/40 bg-[#3B82F6]/20',
                              level.name === 'Aura Vader' && 'text-[#8B5CF6] border-[#8B5CF6]/40 bg-[#8B5CF6]/20'
                            )}
                          >
                            {level.name === 'Clout Chaser' ? 'No vouch bonus' : 
                             level.name === 'Attention Seeker' ? '1.3x vouching' :
                             level.name === 'Dedicated' ? '1.5x vouching' :
                             level.name === 'Grinder' ? '2.0x vouching' :
                             level.name === 'Aura Vader' ? '3.0x vouching' : 
                             'No bonus'}
                          </Badge>
                        </div>
                      </div>
                    )) : null}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Call to Action */}
          <Card className="bg-gradient-to-r from-[#8000FF]/20 to-[#9933FF]/20 border-[#8000FF]/30 mt-8">
            <CardContent className="p-8 text-center">
              <h3 className="text-2xl font-bold text-white mb-4">
                Ready to Climb the Ranks?
              </h3>
              <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
                Complete daily lessons, engage in battles, and build your Web3 expertise to rise in the leaderboard
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  className="bg-gradient-to-r from-[#8000FF] to-[#9933FF] hover:from-[#6B00E6] hover:to-[#8000FF] text-white"
                  onClick={() => window.location.href = "/"}
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Start Learning
                </Button>
                <Button 
                  variant="outline"
                  className="border-[#FFD700] text-[#FFD700] hover:bg-[#FFD700] hover:text-black"
                  onClick={() => window.location.href = "/battles"}
                >
                  <Trophy className="w-4 h-4 mr-2" />
                  Enter Battle
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