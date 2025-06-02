import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { isUnauthorizedError } from "@/lib/authUtils";
import Navigation from "@/components/Navigation";
import LessonCard from "@/components/LessonCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Zap, Flame, Clock, Trophy, Coins, Target, BookOpen, HandHeart, Swords, Info } from "lucide-react";

export default function Dashboard() {
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

  const { data: dailyLessons, isLoading: lessonsLoading } = useQuery({
    queryKey: ["/api/lessons/daily", new Date().toDateString()],
    retry: false,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    staleTime: 0, // Always consider data stale to force refresh
    cacheTime: 0, // Don't cache at all
  });

  const { data: auraLevels } = useQuery({
    queryKey: ["/api/aura-levels"],
    retry: false,
  });

  const { data: activeBattles } = useQuery({
    queryKey: ["/api/battles", "active"],
    retry: false,
  });

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const getCurrentLevel = () => {
    if (!auraLevels || !user) return null;
    
    const streak = user.currentStreak || 0;
    return auraLevels.find(level => 
      streak >= level.minDays && (!level.maxDays || streak <= level.maxDays)
    );
  };

  const getNextLevel = () => {
    if (!auraLevels || !user) return null;
    
    const streak = user.currentStreak || 0;
    return auraLevels.find(level => level.minDays > streak);
  };

  const currentLevel = getCurrentLevel();
  const nextLevel = getNextLevel();
  const progressToNext = nextLevel ? 
    ((user?.currentStreak || 0) / nextLevel.minDays) * 100 : 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-10 left-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/4 right-20 w-48 h-48 bg-primary/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 left-1/4 w-40 h-40 bg-primary/8 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 right-10 w-56 h-56 bg-primary/3 rounded-full blur-3xl"></div>
      </div>

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: `radial-gradient(circle at 1px 1px, rgb(147,51,255) 1px, transparent 0)`,
        backgroundSize: '50px 50px'
      }}></div>

      <Navigation />
      
      <main className="relative pt-20 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Welcome Header */}
          <div className="mb-12 text-center">
            <div className="relative inline-block">
              <h1 className="text-5xl font-bold bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent mb-4">
                Welcome back, {user?.firstName || user?.username || "Aura Warrior"}! 
              </h1>
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-primary to-primary/50 rounded-full"></div>
            </div>
            <p className="text-muted-foreground text-xl mt-6 max-w-2xl mx-auto">
              Continue building your Aura and dominate the leaderboard in this epic Web3 battle arena
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            <Card className="bg-gradient-to-br from-card/80 to-primary/5 backdrop-blur-sm border-primary/30 hover:border-primary/60 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/20 hover:-translate-y-2 group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardContent className="p-8 relative z-10">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm font-medium mb-3 uppercase tracking-wide">Aura Points</p>
                    <p className="text-4xl font-bold text-primary group-hover:scale-110 transition-transform duration-300">
                      {user?.auraPoints?.toLocaleString() || "0"}
                    </p>
                  </div>
                  <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/10 rounded-3xl flex items-center justify-center group-hover:from-primary/30 group-hover:to-primary/20 transition-all duration-300 group-hover:rotate-12">
                    <Coins className="w-8 h-8 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-card/80 to-muted/10 backdrop-blur-sm border-border hover:border-primary/40 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-2 group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardContent className="p-8 relative z-10">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm font-medium mb-3 uppercase tracking-wide">Current Streak</p>
                    <p className="text-4xl font-bold text-foreground group-hover:scale-110 transition-transform duration-300">
                      {user?.currentStreak || 0} <span className="text-xl text-muted-foreground">days</span>
                    </p>
                  </div>
                  <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-orange-50 dark:from-orange-900/30 dark:to-orange-900/20 rounded-3xl flex items-center justify-center group-hover:from-orange-200 dark:group-hover:from-orange-900/50 transition-all duration-300 group-hover:rotate-12">
                    <Flame className="w-8 h-8 text-orange-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-card/80 to-muted/10 backdrop-blur-sm border-border hover:border-primary/40 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-2 group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardContent className="p-8 relative z-10">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm font-medium mb-3 uppercase tracking-wide">Battles Won</p>
                    <p className="text-4xl font-bold text-foreground group-hover:scale-110 transition-transform duration-300">
                      {user?.totalBattlesWon || 0}
                    </p>
                  </div>
                  <div className="w-16 h-16 bg-gradient-to-br from-yellow-100 to-yellow-50 dark:from-yellow-900/30 dark:to-yellow-900/20 rounded-3xl flex items-center justify-center group-hover:from-yellow-200 dark:group-hover:from-yellow-900/50 transition-all duration-300 group-hover:rotate-12">
                    <Trophy className="w-8 h-8 text-yellow-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-card/80 to-muted/10 backdrop-blur-sm border-border hover:border-primary/40 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-2 group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardContent className="p-8 relative z-10">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm font-medium mb-3 uppercase tracking-wide">USDT Earned</p>
                    <p className="text-4xl font-bold text-foreground group-hover:scale-110 transition-transform duration-300">
                      ${parseFloat(user?.totalUsdtEarned || "0").toFixed(2)}
                    </p>
                  </div>
                  <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-green-50 dark:from-green-900/30 dark:to-green-900/20 rounded-3xl flex items-center justify-center group-hover:from-green-200 dark:group-hover:from-green-900/50 transition-all duration-300 group-hover:rotate-12">
                    <Coins className="w-8 h-8 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Aura Points Breakdown */}
          <div className="mb-8">
            <Card className="bg-gradient-to-br from-card to-muted/20 border-border/50 shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="text-2xl font-bold text-foreground flex items-center">
                  <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center mr-3">
                    <Zap className="w-5 h-5 text-primary" />
                  </div>
                  Aura Points Breakdown
                </CardTitle>
                <p className="text-muted-foreground text-base">Track where your Aura Points come from</p>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {/* Daily Lessons */}
                  <div className="text-center group hover:scale-105 transition-transform duration-300">
                    <div className="w-20 h-20 bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                      <BookOpen className="w-10 h-10 text-primary-foreground" />
                    </div>
                    <div className="text-3xl font-bold text-primary mb-2">
                      {user?.auraFromLessons?.toLocaleString() || "100"}
                    </div>
                    <div className="text-muted-foreground text-sm font-medium mb-1">From Daily Lessons</div>
                    <div className="text-xs text-muted-foreground px-3 py-1 bg-primary/10 rounded-full inline-block">
                      {user?.auraPoints ? Math.round(((user?.auraFromLessons || 100) / user.auraPoints) * 100) : 50}% of total
                    </div>
                  </div>

                  {/* Vouching */}
                  <div className="text-center group hover:scale-105 transition-transform duration-300">
                    <div className="w-20 h-20 bg-gradient-to-br from-muted to-muted/60 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                      <HandHeart className="w-10 h-10 text-primary" />
                    </div>
                    <div className="text-3xl font-bold text-foreground mb-2">
                      {user?.auraFromVouching?.toLocaleString() || "0"}
                    </div>
                    <div className="text-muted-foreground text-sm font-medium mb-1">From Vouching</div>
                    <div className="text-xs text-muted-foreground px-3 py-1 bg-muted/50 rounded-full inline-block">
                      {user?.auraPoints ? Math.round(((user?.auraFromVouching || 0) / user.auraPoints) * 100) : 0}% of total
                    </div>
                  </div>

                  {/* Battles */}
                  <div className="text-center group hover:scale-105 transition-transform duration-300">
                    <div className="w-20 h-20 bg-gradient-to-br from-muted to-muted/60 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                      <Swords className="w-10 h-10 text-primary" />
                    </div>
                    <div className="text-3xl font-bold text-foreground mb-2">
                      {user?.auraFromBattles?.toLocaleString() || "0"}
                    </div>
                    <div className="text-muted-foreground text-sm font-medium mb-1">From Battles</div>
                    <div className="text-xs text-muted-foreground px-3 py-1 bg-muted/50 rounded-full inline-block">
                      {user?.auraPoints ? Math.round(((user?.auraFromBattles || 0) / user.auraPoints) * 100) : 0}% of total
                    </div>
                  </div>
                </div>

                {/* Token Information */}
                <div className="mt-8 p-6 bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20 rounded-2xl">
                  <div className="flex items-center text-base text-foreground mb-4">
                    <div className="w-6 h-6 bg-primary/20 rounded-lg flex items-center justify-center mr-3">
                      <Info className="w-4 h-4 text-primary" />
                    </div>
                    <span className="font-semibold">Token System</span>
                  </div>
                  <div className="space-y-3 text-sm text-muted-foreground">
                    <div className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                      <div>
                        <strong className="text-primary">Aura Points:</strong> Main ranking token for leaderboard position
                      </div>
                    </div>
                    <div>
                      <strong className="text-[#9933FF]">Vouching:</strong> 1 USDT = 10 Aura Points (base) • Streak multipliers apply
                    </div>
                    <div>
                      <strong className="text-[#00FF88]">Battle Support:</strong> Purchase Steeze tokens (1 Steeze = 0.01 USDT) to help friends win battles
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Daily Lessons */}
            <div className="lg:col-span-2">
              <Card className="bg-[#1A1A1B] border-[#8000FF]/20">
                <CardHeader>
                  <div>
                    <CardTitle className="text-2xl font-bold text-white flex items-center">
                      <Zap className="w-6 h-6 mr-2 text-[#8000FF]" />
                      Today's Lessons
                    </CardTitle>
                    <p className="text-gray-400">
                      Complete your daily lessons to maintain your streak and earn Aura Points
                    </p>
                  </div>
                </CardHeader>
                <CardContent>
                  {lessonsLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="animate-pulse">
                          <div className="h-32 bg-[#0A0A0B] rounded-lg"></div>
                        </div>
                      ))}
                    </div>
                  ) : dailyLessons && dailyLessons.length > 0 ? (
                    <div className="space-y-4">
                      {dailyLessons.map((lesson: any) => (
                        <LessonCard key={lesson.id} lesson={lesson} />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Clock className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-gray-300 mb-2">
                        No lessons available yet
                      </h3>
                      <p className="text-gray-500">
                        New lessons are generated daily. Check back soon!
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Streak Progress */}
              <Card className="bg-[#1A1A1B] border-[#FFD700]/20">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-white flex items-center">
                    <Flame className="w-5 h-5 mr-2 text-[#FFD700]" />
                    Streak Progress
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center mb-6">
                    <div className="text-4xl font-bold text-[#FFD700] mb-2">
                      {user?.currentStreak || 0}
                    </div>
                    <div className="text-gray-400">days in a row</div>
                    {currentLevel && (
                      <Badge 
                        className="mt-2"
                        style={{ 
                          backgroundColor: `${currentLevel.color}20`,
                          color: currentLevel.color,
                          borderColor: `${currentLevel.color}40`
                        }}
                      >
                        {currentLevel.name}
                      </Badge>
                    )}
                  </div>
                  
                  {nextLevel && (
                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-400">Progress to {nextLevel.name}</span>
                        <span className="text-[#8000FF] font-bold">
                          {user?.currentStreak || 0}/{nextLevel.minDays}
                        </span>
                      </div>
                      <Progress 
                        value={progressToNext} 
                        className="h-2 bg-gray-700"
                      />
                    </div>
                  )}

                  <div className="text-sm text-gray-400 text-center">
                    {nextLevel ? (
                      <>
                        <span className="text-[#00FF88] font-bold">
                          {nextLevel.minDays - (user?.currentStreak || 0)} days
                        </span>{" "}
                        to {nextLevel.name} status
                      </>
                    ) : (
                      "You've reached the highest level!"
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Active Battles */}
              <Card className="bg-[#1A1A1B] border-[#FF8800]/20">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-white flex items-center">
                    <Trophy className="w-5 h-5 mr-2 text-[#FF8800]" />
                    Active Battles
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {activeBattles && activeBattles.length > 0 ? (
                    <div className="space-y-3">
                      {activeBattles.slice(0, 3).map((battle: any) => (
                        <div key={battle.id} className="bg-[#0A0A0B] rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-sm">
                              Battle #{battle.id.slice(0, 8)}
                            </span>
                            <Badge variant="secondary" className="bg-red-500/20 text-red-400">
                              Live
                            </Badge>
                          </div>
                          <div className="text-xs text-gray-400">
                            Stakes: {battle.challengerStake + battle.opponentStake} Aura
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <Trophy className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                      <p className="text-gray-500 text-sm">No active battles</p>
                    </div>
                  )}
                  
                  <Button 
                    className="w-full mt-4 bg-gradient-to-r from-[#FF8800] to-[#FFD700] hover:from-[#FF8800]/80 hover:to-[#FFD700]/80 text-black font-semibold"
                    onClick={() => window.location.href = "/battles"}
                  >
                    View All Battles
                  </Button>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="bg-[#1A1A1B] border-[#9933FF]/20">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-white">
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    variant="outline" 
                    className="w-full border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                    onClick={() => window.location.href = "/steeze-stack"}
                  >
                    <Coins className="w-4 h-4 mr-2" />
                    Steeze Stack
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                    onClick={() => window.location.href = "/leaderboard"}
                  >
                    <Trophy className="w-4 h-4 mr-2" />
                    View Leaderboard
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                    onClick={() => window.location.href = `/profile/${user?.id}`}
                  >
                    <Target className="w-4 h-4 mr-2" />
                    My Profile
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
