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
  const urlUserId = urlPath.split('/').pop() || '';
  const currentUser = user as any;
  
  // Check if viewing own profile
  const viewingOwnProfile = !urlUserId || urlUserId === currentUser?.id;
  const targetUserId = viewingOwnProfile ? currentUser?.id : urlUserId;

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

  // Fetch profile data only if viewing another user's profile
  const { data: profileData, isLoading: profileLoading } = useQuery({
    queryKey: ["/api/users", targetUserId],
    enabled: !!targetUserId && isAuthenticated && !viewingOwnProfile,
    retry: false,
  });

  // Use current user data for own profile, or fetched data for others
  const userData = viewingOwnProfile ? currentUser : (profileData as any)?.user;

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

  if (!userData) {
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
                <Button asChild>
                  <a href="/leaderboard">View Leaderboard</a>
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  const profileUser = userData;
  const battleStats = viewingOwnProfile ? { total: 0, won: 0, lost: 0 } : (profileData as any)?.battleStats || { total: 0, won: 0, lost: 0 };
  const vouchStats = viewingOwnProfile ? { received: 0, given: 0 } : (profileData as any)?.vouchStats || { received: 0, given: 0 };

  const getStreakLevel = (streak: number) => {
    if (!auraLevels) return { name: "Clout Chaser", color: "#8000FF", icon: Zap, multiplier: 1.0 };
    
    return (auraLevels as any[]).find((level: any) => 
      streak >= level.minDays && (!level.maxDays || streak <= level.maxDays)
    ) || (auraLevels as any[])[0];
  };

  const getUserDisplayName = () => {
    return profileUser.firstName || profileUser.username || `User ${profileUser.id?.slice(0, 6)}`;
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
              <div className="flex flex-col lg:flex-row lg:items-center lg:space-x-8">
                {/* Avatar */}
                <div className="flex-shrink-0 mb-6 lg:mb-0">
                  <Avatar className="w-32 h-32 border-4 border-[#8000FF]/30">
                    <AvatarImage
                      src={profileUser.profileImageUrl || ""}
                      alt={getUserDisplayName()}
                    />
                    <AvatarFallback className="bg-gradient-to-br from-[#8000FF] to-[#9933FF] text-white text-2xl">
                      {(profileUser.firstName?.[0] || profileUser.username?.[0] || "U").toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
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
                          Joined {new Date(profileUser.createdAt || Date.now()).toLocaleDateString()}
                        </div>
                      </div>
                      
                      {profileUser.email && (
                        <p className="text-gray-400 mb-4">{profileUser.email}</p>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-3">
                      {!viewingOwnProfile && (
                        <Button className="bg-gradient-to-r from-[#8000FF] to-[#9933FF] hover:from-[#8000FF]/80 hover:to-[#9933FF]/80">
                          <HandHeart className="w-4 h-4 mr-2" />
                          Vouch
                        </Button>
                      )}
                      {profileUser.walletAddress && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => window.open(`https://polygonscan.com/address/${profileUser.walletAddress}`, '_blank')}
                          className="border-[#8000FF]/30 text-[#8000FF] hover:bg-[#8000FF]/10"
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          View Wallet
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Aura Points */}
            <Card className="bg-[#1A1A1B] border-[#8000FF]/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Total Aura</p>
                    <p className="text-2xl font-bold text-white">
                      {profileUser.auraPoints?.toLocaleString() || "0"}
                    </p>
                  </div>
                  <Zap className="w-8 h-8 text-[#8000FF]" />
                </div>
              </CardContent>
            </Card>

            {/* Win Rate */}
            <Card className="bg-[#1A1A1B] border-[#FFD700]/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Win Rate</p>
                    <p className="text-2xl font-bold text-white">
                      {getWinRate()}%
                    </p>
                  </div>
                  <Trophy className="w-8 h-8 text-[#FFD700]" />
                </div>
              </CardContent>
            </Card>

            {/* Portfolio Growth */}
            <Card className="bg-[#1A1A1B] border-[#00FF88]/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Portfolio Growth</p>
                    <p className={`text-2xl font-bold ${getPortfolioGrowthColor()}`}>
                      {parseFloat(profileUser.portfolioGrowth || "0") > 0 ? "+" : ""}{profileUser.portfolioGrowth || "0"}%
                    </p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-[#00FF88]" />
                </div>
              </CardContent>
            </Card>

            {/* Total Vouches */}
            <Card className="bg-[#1A1A1B] border-[#9933FF]/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Vouches Received</p>
                    <p className="text-2xl font-bold text-white">
                      ${parseFloat(profileUser.totalVouchesReceived || "0").toLocaleString()}
                    </p>
                  </div>
                  <Coins className="w-8 h-8 text-[#9933FF]" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Profile Tabs */}
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 bg-[#1A1A1B] border border-[#8000FF]/20">
              <TabsTrigger value="overview" className="data-[state=active]:bg-[#8000FF] data-[state=active]:text-white">
                Overview
              </TabsTrigger>
              <TabsTrigger value="battles" className="data-[state=active]:bg-[#8000FF] data-[state=active]:text-white">
                Battles
              </TabsTrigger>
              <TabsTrigger value="vouches" className="data-[state=active]:bg-[#8000FF] data-[state=active]:text-white">
                Vouches
              </TabsTrigger>
              {!viewingOwnProfile && (
                <TabsTrigger value="vouch-user" className="data-[state=active]:bg-[#8000FF] data-[state=active]:text-white">
                  Vouch User
                </TabsTrigger>
              )}
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Battle History Summary */}
                <Card className="bg-[#1A1A1B] border-[#8000FF]/20">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center">
                      <Sword className="w-5 h-5 mr-2 text-[#FFD700]" />
                      Battle Statistics
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Total Battles:</span>
                      <span className="text-white font-medium">{battleStats.total}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Battles Won:</span>
                      <span className="text-green-400 font-medium">{battleStats.won}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Battles Lost:</span>
                      <span className="text-red-400 font-medium">{battleStats.lost}</span>
                    </div>
                    <Separator className="bg-[#8000FF]/20" />
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Win Rate:</span>
                      <Badge className="bg-[#FFD700]/20 text-[#FFD700]">
                        {getWinRate()}%
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                {/* Vouch Statistics */}
                <Card className="bg-[#1A1A1B] border-[#8000FF]/20">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center">
                      <HandHeart className="w-5 h-5 mr-2 text-[#9933FF]" />
                      Vouch Activity
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Vouches Received:</span>
                      <span className="text-white font-medium">{vouchStats.received}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Vouches Given:</span>
                      <span className="text-white font-medium">{vouchStats.given}</span>
                    </div>
                    <Separator className="bg-[#8000FF]/20" />
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Total Value:</span>
                      <Badge className="bg-[#9933FF]/20 text-[#9933FF]">
                        ${parseFloat(profileUser.totalVouchesReceived || "0").toLocaleString()}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Vouch User Tab */}
            {!viewingOwnProfile && (
              <TabsContent value="vouch-user" className="space-y-6">
                <Card className="bg-[#1A1A1B] border-[#8000FF]/20">
                  <CardHeader>
                    <CardTitle className="text-white">
                      Vouch {getUserDisplayName()}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <VouchForm preselectedUserId={profileUser.id} />
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </Tabs>
        </div>
      </main>
    </div>
  );
}