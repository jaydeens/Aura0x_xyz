import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { isUnauthorizedError } from "@/lib/authUtils";
import Navigation from "@/components/Navigation";
import VouchForm from "@/components/VouchForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  User, 
  Crown, 
  Trophy, 
  Coins, 
  TrendingUp, 
  Calendar, 
  Wallet,
  Target,
  Flame,
  Star,
  Zap,
  Sword,
  HandHeart,
  Clock,
  ExternalLink
} from "lucide-react";

interface ProfileParams {
  id: string;
}

export default function Profile() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();
  
  // Get user ID from URL
  const urlPath = window.location.pathname;
  const userId = urlPath.split('/').pop() || '';

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

  const { data: profileData, isLoading: profileLoading } = useQuery({
    queryKey: ["/api/users", userId],
    enabled: !!userId && isAuthenticated,
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
            <User className="w-8 h-8 text-white" />
          </div>
        </div>
      </div>
    );
  }

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A0A0B] via-[#8000FF]/10 to-[#0A0A0B]">
        <Navigation />
        <main className="pt-20 pb-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="animate-pulse space-y-6">
              <div className="h-48 bg-[#1A1A1B] rounded-2xl"></div>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="h-64 bg-[#1A1A1B] rounded-2xl"></div>
                <div className="h-64 bg-[#1A1A1B] rounded-2xl"></div>
                <div className="h-64 bg-[#1A1A1B] rounded-2xl"></div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!profileData?.user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A0A0B] via-[#8000FF]/10 to-[#0A0A0B]">
        <Navigation />
        <main className="pt-20 pb-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Card className="bg-[#1A1A1B] border-[#8000FF]/20">
              <CardContent className="p-12 text-center">
                <User className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-300 mb-2">
                  User Not Found
                </h3>
                <p className="text-gray-500 mb-6">
                  The requested user profile could not be found.
                </p>
                <Button 
                  onClick={() => window.location.href = "/leaderboard"}
                  className="bg-gradient-to-r from-[#8000FF] to-[#9933FF] hover:from-[#6B00E6] hover:to-[#8000FF] text-white"
                >
                  View Leaderboard
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  const profileUser = profileData.user;
  const battleStats = profileData.battleStats;
  const vouchStats = profileData.vouchStats;
  const isOwnProfile = user?.id === profileUser.id;

  const getStreakLevel = (streak: number) => {
    if (!auraLevels) return { name: "Clout Chaser", color: "#8000FF", icon: Zap, multiplier: 1.0 };
    
    return auraLevels.find((level: any) => 
      streak >= level.minDays && (!level.maxDays || streak <= level.maxDays)
    ) || auraLevels[0];
  };

  const getUserDisplayName = () => {
    return profileUser.firstName || profileUser.username || `User ${profileUser.id.slice(0, 6)}`;
  };

  const getWinRate = () => {
    const totalBattles = battleStats.won + battleStats.lost;
    if (totalBattles === 0) return 0;
    return ((battleStats.won / totalBattles) * 100).toFixed(1);
  };

  const getPortfolioGrowthColor = () => {
    const growth = parseFloat(profileUser.portfolioGrowth || "0");
    if (growth > 0) return "text-green-400";
    if (growth < 0) return "text-red-400";
    return "text-gray-400";
  };

  const streakLevel = getStreakLevel(profileUser.currentStreak || 0);
  const StreakIcon = streakLevel.icon || Zap;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0A0B] via-[#8000FF]/10 to-[#0A0A0B]">
      <Navigation />
      
      <main className="pt-20 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Profile Header */}
          <Card className="bg-gradient-to-r from-[#1A1A1B] to-[#8000FF]/5 border-[#8000FF]/20 mb-8">
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row items-start md:items-center space-y-6 md:space-y-0 md:space-x-8">
                {/* Avatar */}
                <div className="relative">
                  <Avatar className="w-32 h-32 border-4 border-[#8000FF]">
                    <AvatarImage src={profileUser.profileImageUrl} />
                    <AvatarFallback className="bg-[#8000FF]/20 text-[#8000FF] text-3xl">
                      <User className="w-16 h-16" />
                    </AvatarFallback>
                  </Avatar>
                  {profileUser.currentStreak >= 30 && (
                    <div className="absolute -top-3 -right-3 w-12 h-12 bg-[#FFD700] rounded-full flex items-center justify-center animate-pulse">
                      <Crown className="w-6 h-6 text-black" />
                    </div>
                  )}
                </div>

                {/* Profile Info */}
                <div className="flex-1">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <h1 className="text-3xl font-bold text-white mb-2">
                        {getUserDisplayName()}
                      </h1>
                      <div className="flex items-center space-x-4 mb-4">
                        <Badge 
                          className="text-sm"
                          style={{ 
                            backgroundColor: `${streakLevel.color}20`,
                            color: streakLevel.color,
                            borderColor: `${streakLevel.color}40`
                          }}
                        >
                          <StreakIcon className="w-4 h-4 mr-1" />
                          {streakLevel.name}
                        </Badge>
                        <div className="flex items-center text-gray-400">
                          <Flame className="w-4 h-4 mr-1" />
                          {profileUser.currentStreak || 0} day streak
                        </div>
                        <div className="flex items-center text-gray-400">
                          <Calendar className="w-4 h-4 mr-1" />
                          Joined {new Date(profileUser.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      
                      {profileUser.email && (
                        <p className="text-gray-400 mb-4">{profileUser.email}</p>
                      )}
                    </div>

                    {!isOwnProfile && (
                      <div className="flex flex-col sm:flex-row gap-3">
                        <Button 
                          className="bg-gradient-to-r from-[#FFD700] to-[#FF8800] hover:from-[#FFD700]/80 hover:to-[#FF8800]/80 text-black font-semibold"
                          onClick={() => window.location.href = `/vouch?user=${profileUser.id}`}
                        >
                          <HandHeart className="w-4 h-4 mr-2" />
                          Vouch for {getUserDisplayName()}
                        </Button>
                        <Button 
                          variant="outline"
                          className="border-[#8000FF] text-[#8000FF] hover:bg-[#8000FF] hover:text-white"
                          onClick={() => {
                            toast({
                              title: "Challenge Feature",
                              description: "Battle challenges coming soon!",
                            });
                          }}
                        >
                          <Sword className="w-4 h-4 mr-2" />
                          Challenge
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card className="bg-[#1A1A1B] border-[#8000FF]/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Aura Points</p>
                    <p className="text-2xl font-bold text-[#8000FF]">
                      {profileUser.auraPoints?.toLocaleString() || "0"}
                    </p>
                  </div>
                  <Coins className="w-8 h-8 text-[#8000FF]" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#1A1A1B] border-[#00FF88]/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Win Rate</p>
                    <p className="text-2xl font-bold text-[#00FF88]">
                      {getWinRate()}%
                    </p>
                  </div>
                  <Trophy className="w-8 h-8 text-[#00FF88]" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#1A1A1B] border-[#9933FF]/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Portfolio</p>
                    <p className={`text-2xl font-bold ${getPortfolioGrowthColor()}`}>
                      {profileUser.portfolioGrowth?.startsWith('-') ? '' : '+'}
                      {profileUser.portfolioGrowth || "0"}%
                    </p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-[#9933FF]" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#1A1A1B] border-[#FFD700]/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Vouches</p>
                    <p className="text-2xl font-bold text-[#FFD700]">
                      {vouchStats?.received || 0}
                    </p>
                  </div>
                  <HandHeart className="w-8 h-8 text-[#FFD700]" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Profile Tabs */}
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 bg-[#1A1A1B] border border-[#8000FF]/20">
              <TabsTrigger value="overview" className="data-[state=active]:bg-[#8000FF] data-[state=active]:text-white">
                <User className="w-4 h-4 mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="battles" className="data-[state=active]:bg-[#FFD700] data-[state=active]:text-black">
                <Sword className="w-4 h-4 mr-2" />
                Battles
              </TabsTrigger>
              <TabsTrigger value="vouches" className="data-[state=active]:bg-[#00FF88] data-[state=active]:text-black">
                <HandHeart className="w-4 h-4 mr-2" />
                Vouches
              </TabsTrigger>
              <TabsTrigger value="wallet" className="data-[state=active]:bg-[#9933FF] data-[state=active]:text-white">
                <Wallet className="w-4 h-4 mr-2" />
                Wallet
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Battle Statistics */}
                <Card className="bg-[#1A1A1B] border-[#8000FF]/20">
                  <CardHeader>
                    <CardTitle className="text-xl font-bold text-white flex items-center">
                      <Trophy className="w-5 h-5 mr-2 text-[#FFD700]" />
                      Battle Statistics
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Total Battles</span>
                      <span className="font-semibold text-white">{battleStats?.total || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Wins</span>
                      <span className="font-semibold text-green-400">{battleStats?.won || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Losses</span>
                      <span className="font-semibold text-red-400">{battleStats?.lost || 0}</span>
                    </div>
                    <Separator className="bg-[#8000FF]/20" />
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Win Rate</span>
                      <Badge className="bg-[#00FF88]/20 text-[#00FF88]">
                        {getWinRate()}%
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                {/* Aura Level Progress */}
                <Card className="bg-[#1A1A1B] border-[#8000FF]/20">
                  <CardHeader>
                    <CardTitle className="text-xl font-bold text-white flex items-center">
                      <Crown className="w-5 h-5 mr-2 text-[#FFD700]" />
                      Aura Level Progress
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold mb-2" style={{ color: streakLevel.color }}>
                        {profileUser.currentStreak || 0}
                      </div>
                      <div className="text-gray-400 text-sm">days streak</div>
                      <Badge 
                        className="mt-2"
                        style={{ 
                          backgroundColor: `${streakLevel.color}20`,
                          color: streakLevel.color,
                          borderColor: `${streakLevel.color}40`
                        }}
                      >
                        {streakLevel.name}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Multiplier</span>
                        <span style={{ color: streakLevel.color }}>
                          {streakLevel.multiplier}x
                        </span>
                      </div>
                      {streakLevel.description && (
                        <p className="text-xs text-gray-500 text-center">
                          {streakLevel.description}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Activity */}
              <Card className="bg-[#1A1A1B] border-[#8000FF]/20">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-white flex items-center">
                    <Clock className="w-5 h-5 mr-2 text-[#9933FF]" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <Clock className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                    <p className="text-gray-500">Activity tracking coming soon</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Battles Tab */}
            <TabsContent value="battles" className="space-y-6">
              <Card className="bg-[#1A1A1B] border-[#FFD700]/20">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-white">
                    Battle History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <Sword className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-300 mb-2">
                      No Battle History
                    </h3>
                    <p className="text-gray-500 mb-6">
                      Battle history will appear here once {isOwnProfile ? 'you participate' : 'this user participates'} in battles
                    </p>
                    {isOwnProfile && (
                      <Button 
                        className="bg-gradient-to-r from-[#FFD700] to-[#FF8800] hover:from-[#FFD700]/80 hover:to-[#FF8800]/80 text-black font-semibold"
                        onClick={() => window.location.href = "/battles"}
                      >
                        <Sword className="w-4 h-4 mr-2" />
                        Start First Battle
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Vouches Tab */}
            <TabsContent value="vouches" className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <Card className="bg-[#1A1A1B] border-[#00FF88]/20">
                  <CardHeader>
                    <CardTitle className="text-lg font-bold text-white">
                      Vouches Received
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8">
                      <HandHeart className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                      <div className="text-2xl font-bold text-[#00FF88] mb-2">
                        {vouchStats?.received || 0}
                      </div>
                      <p className="text-gray-500 text-sm">Total vouches received</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-[#1A1A1B] border-[#9933FF]/20">
                  <CardHeader>
                    <CardTitle className="text-lg font-bold text-white">
                      Vouches Given
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8">
                      <HandHeart className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                      <div className="text-2xl font-bold text-[#9933FF] mb-2">
                        {vouchStats?.given || 0}
                      </div>
                      <p className="text-gray-500 text-sm">Total vouches given</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {!isOwnProfile && (
                <Card className="bg-[#1A1A1B] border-[#FFD700]/20">
                  <CardHeader>
                    <CardTitle className="text-xl font-bold text-white">
                      Vouch for {getUserDisplayName()}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <VouchForm preselectedUserId={profileUser.id} />
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Wallet Tab */}
            <TabsContent value="wallet" className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <Card className="bg-[#1A1A1B] border-[#9933FF]/20">
                  <CardHeader>
                    <CardTitle className="text-xl font-bold text-white flex items-center">
                      <Wallet className="w-5 h-5 mr-2 text-[#9933FF]" />
                      Wallet Analytics
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Wallet Age</span>
                      <span className="font-semibold text-white">
                        {profileUser.walletAge || 0} days
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Portfolio Growth</span>
                      <span className={`font-semibold ${getPortfolioGrowthColor()}`}>
                        {profileUser.portfolioGrowth?.startsWith('-') ? '' : '+'}
                        {profileUser.portfolioGrowth || "0"}%
                      </span>
                    </div>
                    {profileUser.walletAddress && (
                      <div className="pt-4 border-t border-[#9933FF]/20">
                        <span className="text-gray-400 text-sm">Wallet Address</span>
                        <div className="flex items-center justify-between mt-1">
                          <code className="text-xs text-white bg-black/30 px-2 py-1 rounded">
                            {profileUser.walletAddress.slice(0, 6)}...{profileUser.walletAddress.slice(-4)}
                          </code>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(`https://mumbai.polygonscan.com/address/${profileUser.walletAddress}`, "_blank")}
                            className="border-[#9933FF]/40 text-[#9933FF] hover:bg-[#9933FF] hover:text-white"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="bg-[#1A1A1B] border-[#8000FF]/20">
                  <CardHeader>
                    <CardTitle className="text-xl font-bold text-white flex items-center">
                      <Target className="w-5 h-5 mr-2 text-[#8000FF]" />
                      Achievements
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8">
                      <Star className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                      <p className="text-gray-500">Achievement system coming soon</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
