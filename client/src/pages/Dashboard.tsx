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
import { Zap, Flame, Clock, Trophy, Coins, Target } from "lucide-react";

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
    queryKey: ["/api/lessons/daily"],
    retry: false,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    staleTime: 0, // Always consider data stale to force refresh
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
      <div className="min-h-screen bg-gradient-to-br from-[#0A0A0B] via-[#8000FF]/10 to-[#0A0A0B] flex items-center justify-center">
        <div className="animate-pulse">
          <div className="w-16 h-16 bg-gradient-to-br from-[#8000FF] to-[#9933FF] rounded-2xl flex items-center justify-center">
            <Zap className="w-8 h-8 text-white" />
          </div>
        </div>
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
    <div className="min-h-screen bg-gradient-to-br from-[#0A0A0B] via-[#8000FF]/10 to-[#0A0A0B]">
      <Navigation />
      
      <main className="pt-20 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Welcome Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">
              Welcome back, {user?.firstName || user?.username || "Aura Warrior"}! 
            </h1>
            <p className="text-gray-400 text-lg">
              Continue building your Aura and dominate the leaderboard
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="bg-[#1A1A1B] border-[#8000FF]/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Aura Points</p>
                    <p className="text-2xl font-bold text-[#8000FF]">
                      {user?.auraPoints?.toLocaleString() || "0"}
                    </p>
                  </div>
                  <Coins className="w-8 h-8 text-[#8000FF]" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#1A1A1B] border-[#FFD700]/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Current Streak</p>
                    <p className="text-2xl font-bold text-[#FFD700]">
                      {user?.currentStreak || 0} days
                    </p>
                  </div>
                  <Flame className="w-8 h-8 text-[#FFD700]" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#1A1A1B] border-[#00FF88]/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Battles Won</p>
                    <p className="text-2xl font-bold text-[#00FF88]">
                      {user?.totalBattlesWon || 0}
                    </p>
                  </div>
                  <Trophy className="w-8 h-8 text-[#00FF88]" />
                </div>
              </CardContent>
            </Card>


          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Daily Lessons */}
            <div className="lg:col-span-2">
              <Card className="bg-[#1A1A1B] border-[#8000FF]/20">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold text-white flex items-center">
                    <Zap className="w-6 h-6 mr-2 text-[#8000FF]" />
                    Today's Lessons
                  </CardTitle>
                  <p className="text-gray-400">
                    Complete your daily lessons to maintain your streak and earn Aura Points
                  </p>
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
                    className="w-full border-[#8000FF] text-[#8000FF] hover:bg-[#8000FF] hover:text-white"
                    onClick={() => window.location.href = "/vouch"}
                  >
                    <Coins className="w-4 h-4 mr-2" />
                    Vouch for Friend
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full border-[#FFD700] text-[#FFD700] hover:bg-[#FFD700] hover:text-black"
                    onClick={() => window.location.href = "/leaderboard"}
                  >
                    <Trophy className="w-4 h-4 mr-2" />
                    View Leaderboard
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full border-[#00FF88] text-[#00FF88] hover:bg-[#00FF88] hover:text-black"
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
