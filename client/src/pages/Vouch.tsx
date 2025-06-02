import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { isUnauthorizedError } from "@/lib/authUtils";
import Navigation from "@/components/Navigation";
import VouchForm from "@/components/VouchForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { 
  HandHeart, 
  Coins, 
  TrendingUp, 
  Users, 
  Zap, 
  Crown, 
  Trophy, 
  Star,
  Calculator,
  DollarSign,
  User,
  Target,
  ExternalLink
} from "lucide-react";

export default function Vouch() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();
  const [preselectedUserId, setPreselectedUserId] = useState<string>("");

  // Get preselected user from URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get('user');
    if (userId) {
      setPreselectedUserId(userId);
    }
  }, []);

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

  const { data: leaderboard } = useQuery({
    queryKey: ["/api/leaderboard"],
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
            <HandHeart className="w-8 h-8 text-white" />
          </div>
        </div>
      </div>
    );
  }

  const getStreakLevel = (streak: number) => {
    if (!auraLevels) return { name: "Clout Chaser", color: "#8000FF", icon: Zap, multiplier: 1.0 };
    
    return auraLevels.find((level: any) => 
      streak >= level.minDays && (!level.maxDays || streak <= level.maxDays)
    ) || auraLevels[0];
  };

  const userStreakLevel = getStreakLevel(user?.currentStreak || 0);
  const UserLevelIcon = userStreakLevel.icon || Zap;

  const getVouchStats = () => {
    if (!leaderboard) return { totalVouches: 0, totalValue: 0, avgVouch: 0 };
    
    // These would come from actual vouch data in a real implementation
    const totalVouches = leaderboard.length * 12; // Mock calculation
    const totalValue = totalVouches * 25; // Mock average of $25 per vouch
    const avgVouch = totalValue / totalVouches;
    
    return { totalVouches, totalValue, avgVouch };
  };

  const stats = getVouchStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0A0B] via-[#8000FF]/10 to-[#0A0A0B]">
      <Navigation />
      
      <main className="pt-20 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-[#8000FF] to-[#9933FF] bg-clip-text text-transparent">
              Vouch with USDT
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Support your favorite users by vouching with USDT. Your vouches convert to Aura Points with streak multipliers.
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card className="bg-[#1A1A1B] border-[#FFD700]/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Total Vouches</p>
                    <p className="text-2xl font-bold text-[#FFD700]">
                      {stats.totalVouches.toLocaleString()}
                    </p>
                  </div>
                  <HandHeart className="w-8 h-8 text-[#FFD700]" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#1A1A1B] border-[#00FF88]/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Total Value</p>
                    <p className="text-2xl font-bold text-[#00FF88]">
                      ${stats.totalValue.toLocaleString()}
                    </p>
                  </div>
                  <DollarSign className="w-8 h-8 text-[#00FF88]" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#1A1A1B] border-[#9933FF]/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Avg Vouch</p>
                    <p className="text-2xl font-bold text-[#9933FF]">
                      ${stats.avgVouch.toFixed(0)}
                    </p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-[#9933FF]" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#1A1A1B] border-[#8000FF]/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Your Multiplier</p>
                    <p className="text-2xl font-bold text-[#8000FF]">
                      {userStreakLevel.multiplier}x
                    </p>
                  </div>
                  <UserLevelIcon className="w-8 h-8 text-[#8000FF]" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Vouch Form */}
            <div className="lg:col-span-2">
              <VouchForm preselectedUserId={preselectedUserId} />
            </div>

            {/* Sidebar Info */}
            <div className="space-y-6">
              {/* How Vouching Works */}
              <Card className="bg-[#1A1A1B] border-[#8000FF]/20">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-white flex items-center">
                    <Calculator className="w-5 h-5 mr-2 text-[#8000FF]" />
                    How It Works
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-[#8000FF]/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-[#8000FF] font-bold text-sm">1</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-white">Base Conversion</h4>
                      <p className="text-sm text-gray-400">1 USDT = 10 Aura Points base rate</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-[#9933FF]/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-[#9933FF] font-bold text-sm">2</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-white">Streak Multiplier</h4>
                      <p className="text-sm text-gray-400">Your streak level applies a multiplier bonus</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-[#FFD700]/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-[#FFD700] font-bold text-sm">3</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-white">Split Distribution</h4>
                      <p className="text-sm text-gray-400">60% to KOL, 40% to platform</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Your Streak Level */}
              <Card className="bg-[#1A1A1B] border-[#FFD700]/20">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-white flex items-center">
                    <Crown className="w-5 h-5 mr-2 text-[#FFD700]" />
                    Your Streak Level
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-3 rounded-full flex items-center justify-center"
                         style={{ backgroundColor: `${userStreakLevel.color}20` }}>
                      <UserLevelIcon className="w-8 h-8" style={{ color: userStreakLevel.color }} />
                    </div>
                    <h3 className="font-bold text-lg" style={{ color: userStreakLevel.color }}>
                      {userStreakLevel.name}
                    </h3>
                    <p className="text-sm text-gray-400 mb-3">
                      {user?.currentStreak || 0} day streak
                    </p>
                    <Badge 
                      className="text-lg px-4 py-1"
                      style={{ 
                        backgroundColor: `${userStreakLevel.color}20`,
                        color: userStreakLevel.color,
                        borderColor: `${userStreakLevel.color}40`
                      }}
                    >
                      {userStreakLevel.multiplier}x Multiplier
                    </Badge>
                  </div>
                  
                  {userStreakLevel.description && (
                    <p className="text-xs text-gray-500 text-center">
                      {userStreakLevel.description}
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Streak Level Reference */}
              {auraLevels && auraLevels.length > 0 && (
                <Card className="bg-[#1A1A1B] border-[#9933FF]/20">
                  <CardHeader>
                    <CardTitle className="text-lg font-bold text-white">
                      All Streak Levels
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {auraLevels.map((level: any) => {
                      const LevelIcon = level.name === "Aura Vader" ? Crown : 
                                       level.name === "Grinder" ? Trophy :
                                       level.name === "Attention Seeker" ? Star : Zap;
                      
                      return (
                        <div key={level.id} className="flex items-center justify-between p-3 rounded-lg border"
                             style={{ borderColor: `${level.color}40`, backgroundColor: `${level.color}05` }}>
                          <div className="flex items-center space-x-3">
                            <LevelIcon className="w-4 h-4" style={{ color: level.color }} />
                            <div>
                              <div className="font-medium text-white text-sm">{level.name}</div>
                              <div className="text-xs text-gray-400">
                                {level.minDays}{level.maxDays ? `-${level.maxDays}` : '+'} days
                              </div>
                            </div>
                          </div>
                          <Badge 
                            variant="outline" 
                            className="text-xs"
                            style={{ 
                              color: level.color, 
                              borderColor: `${level.color}40`,
                              backgroundColor: `${level.color}20`
                            }}
                          >
                            {level.multiplier}x
                          </Badge>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              )}

              {/* Top Users to Vouch */}
              <Card className="bg-[#1A1A1B] border-[#00FF88]/20">
                <CardHeader>
                  <CardTitle className="text-lg font-bold text-white flex items-center">
                    <Users className="w-5 h-5 mr-2 text-[#00FF88]" />
                    Popular Users
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {leaderboard && leaderboard.length > 0 ? (
                    <div className="space-y-3">
                      {leaderboard.slice(0, 5).map((user: any, index: number) => (
                        <div key={user.id} className="flex items-center justify-between p-3 bg-[#0A0A0B] rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="text-sm font-bold text-gray-400">#{index + 1}</div>
                            <Avatar className="w-8 h-8 border border-[#8000FF]/20">
                              <AvatarImage src={user.profileImageUrl} />
                              <AvatarFallback className="bg-[#8000FF]/20 text-[#8000FF] text-xs">
                                <User className="w-4 h-4" />
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium text-white text-sm">
                                {user.firstName || user.username || `User ${user.id.slice(0, 6)}`}
                              </div>
                              <div className="text-xs text-gray-400">
                                {user.auraPoints?.toLocaleString()} Aura
                              </div>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            className="bg-[#00FF88]/20 text-[#00FF88] hover:bg-[#00FF88] hover:text-black text-xs"
                            onClick={() => {
                              setPreselectedUserId(user.id);
                              // Scroll to form
                              document.querySelector('.max-w-2xl')?.scrollIntoView({ behavior: 'smooth' });
                            }}
                          >
                            Vouch
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <Users className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                      <p className="text-gray-500 text-sm">Loading users...</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="bg-[#1A1A1B] border-[#8000FF]/20">
                <CardHeader>
                  <CardTitle className="text-lg font-bold text-white">
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
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
                    onClick={() => window.location.href = "/battles"}
                  >
                    <Target className="w-4 h-4 mr-2" />
                    View Battles
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                    onClick={() => window.open("https://mumbai.polygonscan.com/", "_blank")}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Polygon Scanner
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Bottom CTA */}
          <Card className="bg-gradient-to-r from-[#8000FF]/20 to-[#9933FF]/20 border-[#8000FF]/30 mt-12">
            <CardContent className="p-8 text-center">
              <h3 className="text-2xl font-bold text-white mb-4">
                Build the Web3 Community
              </h3>
              <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
                Every vouch you make helps build a stronger, more supportive Web3 community. Support KOLs who share valuable knowledge and insights.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  className="bg-gradient-to-r from-[#8000FF] to-[#9933FF] hover:from-[#6B00E6] hover:to-[#8000FF] text-white"
                  onClick={() => {
                    // Scroll to form
                    document.querySelector('.max-w-2xl')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  <HandHeart className="w-4 h-4 mr-2" />
                  Start Vouching
                </Button>
                <Button 
                  variant="outline" 
                  className="border-[#FFD700] text-[#FFD700] hover:bg-[#FFD700] hover:text-black"
                  onClick={() => window.location.href = "/"}
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Earn More Aura
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
