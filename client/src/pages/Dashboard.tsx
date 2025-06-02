import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Coins, DollarSign, TrendingUp, Calendar, Award, Users, BookOpen, Zap } from "lucide-react";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";

interface AuraStats {
  source: string;
  total: number;
  count: number;
}

interface AuraHistoryEntry {
  id: number;
  amount: number;
  source: string;
  description: string | null;
  createdAt: string;
}

interface DashboardStats {
  auraStats: AuraStats[];
  totalUsdtEarned: string;
  recentHistory: AuraHistoryEntry[];
}

export default function Dashboard() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();

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

  const { data: dashboardStats, isLoading: statsLoading, error } = useQuery({
    queryKey: ["/api/dashboard/stats"],
    enabled: isAuthenticated,
    retry: false,
  });

  // Handle unauthorized errors
  useEffect(() => {
    if (error && isUnauthorizedError(error as Error)) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [error, toast]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-background p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const stats = dashboardStats as DashboardStats;
  const sourceIcons = {
    lesson: BookOpen,
    vouching: Users,
    battle_win: Award,
    battle_stake: Zap,
  };

  const sourceLabels = {
    lesson: "Daily Lessons",
    vouching: "Vouching",
    battle_win: "Battle Wins",
    battle_stake: "Battle Stakes",
  };

  const sourceColors = {
    lesson: "bg-blue-500",
    vouching: "bg-green-500", 
    battle_win: "bg-purple-500",
    battle_stake: "bg-orange-500",
  };

  const totalAuraPoints = stats?.auraStats?.reduce((sum, stat) => sum + stat.total, 0) || 0;

  return (
    <div className="min-h-screen bg-background p-4 space-y-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
          <p className="text-gray-400">Track your Aura points and earnings</p>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-card border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Total Aura Points</CardTitle>
              <Coins className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {totalAuraPoints.toLocaleString()}
              </div>
              <p className="text-xs text-gray-400 mt-1">
                From all sources
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">USDT Earned</CardTitle>
              <DollarSign className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                ${parseFloat(stats?.totalUsdtEarned || "0").toFixed(2)}
              </div>
              <p className="text-xs text-gray-400 mt-1">
                From vouching
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Activities</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {stats?.auraStats?.reduce((sum, stat) => sum + stat.count, 0) || 0}
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Total activities
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Current Streak</CardTitle>
              <Calendar className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {user?.currentStreak || 0}
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Days streak
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Aura Points Breakdown */}
          <Card className="bg-card border-primary/20">
            <CardHeader>
              <CardTitle className="text-white">Aura Points by Source</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {statsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-4 bg-gray-700 rounded mb-2"></div>
                      <div className="h-2 bg-gray-700 rounded"></div>
                    </div>
                  ))}
                </div>
              ) : stats?.auraStats && stats.auraStats.length > 0 ? (
                stats.auraStats.map((stat) => {
                  const IconComponent = sourceIcons[stat.source as keyof typeof sourceIcons] || Coins;
                  const percentage = totalAuraPoints > 0 ? (stat.total / totalAuraPoints) * 100 : 0;
                  
                  return (
                    <div key={stat.source} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <IconComponent className="h-4 w-4 text-primary" />
                          <span className="text-sm text-white">
                            {sourceLabels[stat.source as keyof typeof sourceLabels] || stat.source}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="secondary" className="text-xs">
                            {stat.count} activities
                          </Badge>
                          <span className="text-sm font-medium text-white">
                            {stat.total.toLocaleString()} AP
                          </span>
                        </div>
                      </div>
                      <Progress 
                        value={percentage} 
                        className="h-2"
                      />
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8">
                  <Coins className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-400">No Aura points earned yet</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Complete lessons, participate in battles, or receive vouches to start earning!
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="bg-card border-primary/20">
            <CardHeader>
              <CardTitle className="text-white">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="animate-pulse flex items-center space-x-3">
                      <div className="h-8 w-8 bg-gray-700 rounded-full"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-700 rounded mb-1"></div>
                        <div className="h-3 bg-gray-700 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : stats?.recentHistory && stats.recentHistory.length > 0 ? (
                <div className="space-y-4">
                  {stats.recentHistory.map((activity) => {
                    const IconComponent = sourceIcons[activity.source as keyof typeof sourceIcons] || Coins;
                    const colorClass = sourceColors[activity.source as keyof typeof sourceColors] || "bg-gray-500";
                    
                    return (
                      <div key={activity.id} className="flex items-center space-x-3">
                        <div className={`p-2 rounded-full ${colorClass}`}>
                          <IconComponent className="h-4 w-4 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="text-sm text-white">
                              {activity.description || `${sourceLabels[activity.source as keyof typeof sourceLabels] || activity.source} activity`}
                            </p>
                            <span className="text-sm font-medium text-green-400">
                              +{activity.amount} AP
                            </span>
                          </div>
                          <p className="text-xs text-gray-400">
                            {new Date(activity.createdAt).toLocaleDateString()} at{" "}
                            {new Date(activity.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <TrendingUp className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-400">No recent activity</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Your recent Aura point activities will appear here
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Economic Info */}
        <Card className="bg-card border-primary/20 mt-6">
          <CardHeader>
            <CardTitle className="text-white">Economics Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400 mb-2">1 USD = 10 AP</div>
                <p className="text-sm text-gray-400">Exchange Rate</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400 mb-2">60% / 40%</div>
                <p className="text-sm text-gray-400">Vouch Revenue Split</p>
                <p className="text-xs text-gray-500 mt-1">Recipient / Platform</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-400 mb-2">100% AP</div>
                <p className="text-sm text-gray-400">Full Aura Points</p>
                <p className="text-xs text-gray-500 mt-1">To vouch recipient</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}