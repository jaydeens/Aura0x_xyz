import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import ModernNavigation from "@/components/ModernNavigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Crown, Users, Flame, Search, User, Medal, Target, TrendingUp } from "lucide-react";
import { Link } from "wouter";

export default function ModernLeaderboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedTab, setSelectedTab] = useState("all-time");

  const { data: leaderboard = [], isLoading: leaderboardLoading } = useQuery({
    queryKey: ["/api/leaderboard", selectedTab],
    enabled: isAuthenticated,
  });

  const { data: stats } = useQuery({
    queryKey: ['/api/stats'],
    enabled: isAuthenticated,
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
      window.location.href = "/";
    }
  }, [isAuthenticated, isLoading]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mx-auto mb-4 animate-pulse">
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
          <div className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Loading...
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-5 h-5 text-yellow-400" />;
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />;
      case 3:
        return <Medal className="w-5 h-5 text-orange-400" />;
      default:
        return <div className="w-6 h-6 bg-gray-700 rounded-full flex items-center justify-center text-xs font-bold text-white">{rank}</div>;
    }
  };

  const getRankBadge = (rank: number) => {
    if (rank <= 3) {
      const colors = {
        1: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
        2: "bg-gray-500/10 text-gray-400 border-gray-500/20",
        3: "bg-orange-500/10 text-orange-400 border-orange-500/20"
      };
      return colors[rank as keyof typeof colors] || "";
    }
    return "bg-gray-600/10 text-gray-400 border-gray-600/20";
  };

  return (
    <div className="min-h-screen bg-black">
      <ModernNavigation />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Leaderboard</h1>
          <p className="text-gray-400">See how you rank against the best in the community</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gray-900/50 border-gray-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Total Users</p>
                  <p className="text-2xl font-bold text-white">{stats?.totalUsers || 0}</p>
                </div>
                <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900/50 border-gray-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Total Aura</p>
                  <p className="text-2xl font-bold text-white">{stats?.totalAura || 0}</p>
                </div>
                <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center">
                  <Flame className="w-5 h-5 text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900/50 border-gray-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Your Rank</p>
                  <p className="text-2xl font-bold text-white">
                    #{Array.isArray(leaderboard) ? leaderboard.findIndex((u: any) => u.id === (user as any)?.id) + 1 || '-' : '-'}
                  </p>
                </div>
                <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
                  <Target className="w-5 h-5 text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900/50 border-gray-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Your Aura</p>
                  <p className="text-2xl font-bold text-white">{(user as any)?.auraPoints || 0}</p>
                </div>
                <div className="w-10 h-10 bg-orange-500/10 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-orange-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search Bar */}
        <Card className="bg-gray-900/50 border-gray-800 mb-8">
          <CardContent className="p-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-gray-800 border-gray-700 text-white"
              />
            </div>
            
            {/* Search Results */}
            {searchQuery && (
              <div className="mt-4 space-y-2 max-h-60 overflow-y-auto">
                {isSearching ? (
                  <div className="text-center py-4">
                    <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  </div>
                ) : searchResults.length > 0 ? (
                  searchResults.map((user: any, index) => (
                    <Link key={user.id} href={`/profile/${user.id}`}>
                      <div className="flex items-center space-x-3 p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors cursor-pointer">
                        <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-white">
                            {user.username || user.twitterDisplayName || `User ${user.id.slice(-4)}`}
                          </p>
                          <p className="text-sm text-gray-400">{user.auraPoints} Aura</p>
                        </div>
                        <Badge variant="outline" className="text-xs border-gray-600">
                          Rank #{index + 1}
                        </Badge>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="text-center py-4 text-gray-400">
                    No users found matching "{searchQuery}"
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Leaderboard Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <TabsList className="bg-gray-900 border-gray-800">
            <TabsTrigger value="all-time" className="data-[state=active]:bg-gray-800">
              All Time
            </TabsTrigger>
            <TabsTrigger value="monthly" className="data-[state=active]:bg-gray-800">
              This Month
            </TabsTrigger>
            <TabsTrigger value="weekly" className="data-[state=active]:bg-gray-800">
              This Week
            </TabsTrigger>
          </TabsList>

          <TabsContent value={selectedTab}>
            <Card className="bg-gray-900/50 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Trophy className="w-5 h-5 mr-2 text-yellow-400" />
                  Top Performers
                </CardTitle>
              </CardHeader>
              <CardContent>
                {leaderboardLoading ? (
                  <div className="space-y-4">
                    {[...Array(10)].map((_, i) => (
                      <div key={i} className="flex items-center space-x-4 p-4 bg-gray-800/50 rounded-lg animate-pulse">
                        <div className="w-12 h-12 bg-gray-700 rounded-full"></div>
                        <div className="flex-1">
                          <div className="h-4 bg-gray-700 rounded w-32 mb-2"></div>
                          <div className="h-3 bg-gray-700 rounded w-20"></div>
                        </div>
                        <div className="h-6 bg-gray-700 rounded w-16"></div>
                      </div>
                    ))}
                  </div>
                ) : Array.isArray(leaderboard) && leaderboard.length > 0 ? (
                  <div className="space-y-2">
                    {leaderboard.map((user: any, index) => (
                      <Link key={user.id} href={`/profile/${user.id}`}>
                        <div className={`flex items-center space-x-4 p-4 rounded-lg transition-colors cursor-pointer hover:bg-gray-800/50 ${
                          index < 3 ? 'bg-gray-800/30' : 'bg-gray-800/20'
                        }`}>
                          <div className="flex items-center justify-center w-12">
                            {getRankIcon(index + 1)}
                          </div>
                          
                          <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-white" />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2">
                              <p className="font-semibold text-white truncate">
                                {user.username || user.twitterDisplayName || `User ${user.id.slice(-4)}`}
                              </p>
                              {index < 3 && (
                                <Badge variant="outline" className={getRankBadge(index + 1)}>
                                  Top {index + 1}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center space-x-4 text-sm text-gray-400">
                              <span>Level {Math.floor((user.auraPoints || 0) / 100) + 1}</span>
                              <span>•</span>
                              <span>{user.totalBattlesWon || 0} wins</span>
                              <span>•</span>
                              <span>{user.currentStreak || 0} day streak</span>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <div className="flex items-center space-x-1">
                              <Flame className="w-4 h-4 text-orange-400" />
                              <span className="font-bold text-white">{user.auraPoints || 0}</span>
                            </div>
                            <p className="text-xs text-gray-400">Aura Points</p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Trophy className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">No Data Available</h3>
                    <p className="text-gray-400">Leaderboard data will appear here once users start earning Aura</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}