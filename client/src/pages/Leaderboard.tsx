import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { isUnauthorizedError } from "@/lib/authUtils";
import Navigation from "@/components/Navigation";
import LeaderboardTable from "@/components/LeaderboardTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Crown, TrendingUp, Users, Zap, Target } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Leaderboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();

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

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A0A0B] via-[#8000FF]/10 to-[#0A0A0B] flex items-center justify-center">
        <div className="animate-pulse">
          <div className="w-16 h-16 bg-gradient-to-br from-[#8000FF] to-[#9933FF] rounded-2xl flex items-center justify-center">
            <Trophy className="w-8 h-8 text-white" />
          </div>
        </div>
      </div>
    );
  }

  const getUserRank = () => {
    if (!user || !leaderboard) return null;
    const rank = leaderboard.findIndex((u: any) => u.id === user.id) + 1;
    return rank > 0 ? rank : null;
  };

  const getLeaderboardStats = () => {
    if (!leaderboard || leaderboard.length === 0) return null;
    
    const totalAura = leaderboard.reduce((sum: number, user: any) => sum + (user.auraPoints || 0), 0);
    const avgAura = Math.floor(totalAura / leaderboard.length);
    const totalBattles = leaderboard.reduce((sum: number, user: any) => 
      sum + (user.totalBattlesWon || 0) + (user.totalBattlesLost || 0), 0);
    
    return {
      totalUsers: leaderboard.length,
      totalAura,
      avgAura,
      totalBattles,
    };
  };

  const userRank = getUserRank();
  const stats = getLeaderboardStats();

  // Filter leaderboard by different criteria
  const getTopByBattles = () => {
    if (!leaderboard) return [];
    return [...leaderboard]
      .sort((a: any, b: any) => (b.totalBattlesWon || 0) - (a.totalBattlesWon || 0))
      .slice(0, 10);
  };

  const getTopByStreak = () => {
    if (!leaderboard) return [];
    return [...leaderboard]
      .sort((a: any, b: any) => (b.currentStreak || 0) - (a.currentStreak || 0))
      .slice(0, 10);
  };

  const getTopByGrowth = () => {
    if (!leaderboard) return [];
    return [...leaderboard]
      .sort((a: any, b: any) => parseFloat(b.portfolioGrowth || "0") - parseFloat(a.portfolioGrowth || "0"))
      .slice(0, 10);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0A0B] via-[#8000FF]/10 to-[#0A0A0B]">
      <Navigation />
      
      <main className="pt-20 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-[#8000FF] to-[#9933FF] bg-clip-text text-transparent">
              Global Leaderboard
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              The top Web3 users in the Aura ecosystem, ranked by Aura Points and battle prowess
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card className="bg-[#1A1A1B] border-[#8000FF]/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Total Users</p>
                    <p className="text-2xl font-bold text-[#8000FF]">
                      {stats?.totalUsers?.toLocaleString() || "0"}
                    </p>
                  </div>
                  <Users className="w-8 h-8 text-[#8000FF]" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#1A1A1B] border-[#FFD700]/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Total Aura</p>
                    <p className="text-2xl font-bold text-[#FFD700]">
                      {stats?.totalAura?.toLocaleString() || "0"}
                    </p>
                  </div>
                  <Zap className="w-8 h-8 text-[#FFD700]" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#1A1A1B] border-[#00FF88]/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Avg Aura</p>
                    <p className="text-2xl font-bold text-[#00FF88]">
                      {stats?.avgAura?.toLocaleString() || "0"}
                    </p>
                  </div>
                  <Target className="w-8 h-8 text-[#00FF88]" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#1A1A1B] border-[#9933FF]/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Total Battles</p>
                    <p className="text-2xl font-bold text-[#9933FF]">
                      {stats?.totalBattles?.toLocaleString() || "0"}
                    </p>
                  </div>
                  <Trophy className="w-8 h-8 text-[#9933FF]" />
                </div>
              </CardContent>
            </Card>
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

          {/* Leaderboard Tabs */}
          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 bg-[#1A1A1B] border border-[#8000FF]/20">
              <TabsTrigger value="all-time" className="data-[state=active]:bg-[#8000FF] data-[state=active]:text-white">
                <Trophy className="w-4 h-4 mr-2" />
                All Time
              </TabsTrigger>
              <TabsTrigger value="weekly" className="data-[state=active]:bg-[#FFD700] data-[state=active]:text-black">
                <Zap className="w-4 h-4 mr-2" />
                Weekly
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all-time" className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">All-Time Leaders</h2>
                <Badge className="bg-[#8000FF]/20 text-[#8000FF]">
                  Based on Aura Points
                </Badge>
              </div>

              {leaderboardLoading ? (
                <div className="space-y-4">
                  {[...Array(10)].map((_, i) => (
                    <div key={i} className="h-20 bg-[#1A1A1B] rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : (
                <LeaderboardTable users={leaderboard || []} showTopPodium={true} />
              )}
            </TabsContent>

            <TabsContent value="weekly" className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">Weekly Leaders</h2>
                <Badge className="bg-[#FFD700]/20 text-[#FFD700]">
                  Based on Aura Points
                </Badge>
              </div>

              {leaderboardLoading ? (
                <div className="space-y-4">
                  {[...Array(10)].map((_, i) => (
                    <div key={i} className="h-20 bg-[#1A1A1B] rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : (
                <LeaderboardTable users={leaderboard || []} showTopPodium={true} />
              )}
            </TabsContent>

            {/* Remove old battle/streak/growth tabs - keeping only all-time and weekly */}
            <TabsContent value="battles" className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">Top Battle Champions</h2>
                <Badge className="bg-[#FFD700]/20 text-[#FFD700]">
                  Combat Excellence
                </Badge>
              </div>

              <LeaderboardTable users={getTopByBattles()} showTopPodium={false} />
            </TabsContent>

            {/* Streak Leaders */}
            <TabsContent value="streak" className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">Consistency Masters</h2>
                <Badge className="bg-[#00FF88]/20 text-[#00FF88]">
                  Daily Grinders
                </Badge>
              </div>

              <LeaderboardTable users={getTopByStreak()} showTopPodium={false} />
            </TabsContent>

            {/* Portfolio Growth */}
            <TabsContent value="growth" className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">Portfolio Performers</h2>
                <Badge className="bg-[#9933FF]/20 text-[#9933FF]">
                  Investment Skills
                </Badge>
              </div>

              <LeaderboardTable users={getTopByGrowth()} showTopPodium={false} />
            </TabsContent>
          </Tabs>

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
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {auraLevels && auraLevels.length > 0 ? 
                    [...new Map(auraLevels.map((level: any) => [level.name, level])).values()]
                    .sort((a: any, b: any) => a.minDays - b.minDays)
                    .map((level: any) => (
                      <div key={level.name} className={cn(
                        "text-center p-4 rounded-lg border",
                        level.name === 'Clout Chaser' && 'border-[#9CA3AF]/40 bg-[#9CA3AF]/10',
                        level.name === 'Attention Seeker' && 'border-[#F97316]/40 bg-[#F97316]/10',
                        level.name === 'Dedicated' && 'border-[#34D399]/40 bg-[#34D399]/10',
                        level.name === 'Grinder' && 'border-[#3B82F6]/40 bg-[#3B82F6]/10',
                        level.name === 'Aura Vader' && 'border-[#8B5CF6]/40 bg-[#8B5CF6]/10'
                      )}>
                        <div className={cn(
                          "w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center",
                          level.name === 'Clout Chaser' && 'bg-[#9CA3AF]/20',
                          level.name === 'Attention Seeker' && 'bg-[#F97316]/20',
                          level.name === 'Dedicated' && 'bg-[#34D399]/20',
                          level.name === 'Grinder' && 'bg-[#3B82F6]/20',
                          level.name === 'Aura Vader' && 'bg-[#8B5CF6]/20'
                        )}>
                          <Crown className={cn(
                            "w-6 h-6",
                            level.name === 'Clout Chaser' && 'text-[#9CA3AF]',
                            level.name === 'Attention Seeker' && 'text-[#F97316]',
                            level.name === 'Dedicated' && 'text-[#34D399]',
                            level.name === 'Grinder' && 'text-[#3B82F6]',
                            level.name === 'Aura Vader' && 'text-[#8B5CF6]'
                          )} />
                        </div>
                        <h4 className={cn(
                          "font-bold mb-1",
                          level.name === 'Clout Chaser' && 'text-[#9CA3AF]',
                          level.name === 'Attention Seeker' && 'text-[#F97316]',
                          level.name === 'Dedicated' && 'text-[#34D399]',
                          level.name === 'Grinder' && 'text-[#3B82F6]',
                          level.name === 'Aura Vader' && 'text-[#8B5CF6]'
                        )}>
                          {level.name}
                        </h4>
                        <p className="text-sm text-gray-400 mb-2">
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
    </div>
  );
}
