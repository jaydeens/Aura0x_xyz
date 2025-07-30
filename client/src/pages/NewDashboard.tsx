import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Trophy, 
  Flame, 
  Target, 
  BookOpen, 
  Swords, 
  Users, 
  TrendingUp,
  Award,
  Zap,
  ArrowRight,
  Clock,
  Star
} from "lucide-react";

export default function NewDashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      window.location.href = "/";
    }
  }, [isAuthenticated, isLoading]);

  // Fetch daily lessons
  const { data: dailyLessons, isLoading: lessonsLoading } = useQuery({
    queryKey: ["/api/lessons/daily"],
    enabled: isAuthenticated,
  });

  // Fetch leaderboard data
  const { data: leaderboard = [] } = useQuery({
    queryKey: ["/api/leaderboard"],
    enabled: isAuthenticated,
  });

  // Fetch battles data
  const { data: battles = [] } = useQuery({
    queryKey: ["/api/battles"],
    enabled: isAuthenticated,
  });

  // Fetch stats
  const { data: stats } = useQuery({
    queryKey: ["/api/stats"],
    enabled: isAuthenticated,
  });

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

  // Not authenticated
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Modern Navigation */}
      <nav className="border-b border-gray-800 bg-black/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center space-x-8">
              <Link href="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Aura
                </span>
              </Link>

              {/* Navigation Links */}
              <div className="hidden md:flex items-center space-x-1">
                <Link href="/">
                  <Button variant="ghost" size="sm" className="text-gray-300 hover:text-white hover:bg-gray-800">
                    Discover
                  </Button>
                </Link>
                <Link href="/battles">
                  <Button variant="ghost" size="sm" className="text-gray-300 hover:text-white hover:bg-gray-800">
                    Battles
                  </Button>
                </Link>
                <Link href="/leaderboard">
                  <Button variant="ghost" size="sm" className="text-gray-300 hover:text-white hover:bg-gray-800">
                    Leaderboard
                  </Button>
                </Link>
              </div>
            </div>

            {/* User Actions */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 px-3 py-1.5 bg-gray-900 rounded-lg">
                <Flame className="w-4 h-4 text-orange-400" />
                <span className="text-sm font-medium text-white">{(user as any)?.auraPoints || 0}</span>
              </div>
              <Link href="/profile">
                <Button variant="ghost" size="sm" className="w-8 h-8 p-0">
                  <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                    <Users className="w-3 h-3 text-white" />
                  </div>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <h1 className="text-3xl font-bold text-white">Welcome back</h1>
            <Badge variant="secondary" className="bg-purple-500/10 text-purple-400 border-purple-500/20">
              Level {Math.floor(((user as any)?.auraPoints || 0) / 100) + 1}
            </Badge>
          </div>
          <p className="text-gray-400">Build your aura through battles, lessons, and community engagement</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gray-900/50 border-gray-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Total Aura</p>
                  <p className="text-2xl font-bold text-white">{(user as any)?.auraPoints || 0}</p>
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
                  <p className="text-sm text-gray-400">Battles Won</p>
                  <p className="text-2xl font-bold text-white">{(user as any)?.totalBattlesWon || 0}</p>
                </div>
                <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900/50 border-gray-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Current Streak</p>
                  <p className="text-2xl font-bold text-white">{(user as any)?.currentStreak || 0}</p>
                </div>
                <div className="w-10 h-10 bg-orange-500/10 rounded-lg flex items-center justify-center">
                  <Target className="w-5 h-5 text-orange-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900/50 border-gray-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Community Rank</p>
                  <p className="text-2xl font-bold text-white">
                    #{Array.isArray(leaderboard) ? leaderboard.findIndex((u: any) => u.id === (user as any)?.id) + 1 || '-' : '-'}
                  </p>
                </div>
                <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Daily Lessons */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Today's Lessons</h2>
              <Link href="/lessons">
                <Button variant="ghost" size="sm" className="text-purple-400 hover:text-purple-300">
                  View all <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
            
            <div className="space-y-4">
              {lessonsLoading ? (
                <Card className="bg-gray-900/50 border-gray-800">
                  <CardContent className="p-6">
                    <div className="animate-pulse">
                      <div className="h-4 bg-gray-800 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-800 rounded w-1/2"></div>
                    </div>
                  </CardContent>
                </Card>
              ) : dailyLessons && Array.isArray(dailyLessons) && dailyLessons.length > 0 ? (
                dailyLessons.slice(0, 3).map((lesson: any) => (
                  <Card key={lesson.id} className="bg-gray-900/50 border-gray-800 hover:border-gray-700 transition-colors">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <div className="w-6 h-6 bg-purple-500/10 rounded flex items-center justify-center">
                              <BookOpen className="w-3 h-3 text-purple-400" />
                            </div>
                            <Badge variant="outline" className="text-xs text-gray-400 border-gray-700">
                              {lesson.category || 'Web3 Basics'}
                            </Badge>
                          </div>
                          <h3 className="text-lg font-semibold text-white mb-2">{lesson.title}</h3>
                          <p className="text-gray-400 text-sm leading-relaxed">{lesson.content?.substring(0, 120)}...</p>
                          <div className="flex items-center space-x-4 mt-4">
                            <div className="flex items-center space-x-1 text-xs text-gray-500">
                              <Clock className="w-3 h-3" />
                              <span>5 min read</span>
                            </div>
                            <div className="flex items-center space-x-1 text-xs text-purple-400">
                              <Star className="w-3 h-3" />
                              <span>+{lesson.auraReward || 10} Aura</span>
                            </div>
                          </div>
                        </div>
                        <Link href={`/lessons/${lesson.id}`}>
                          <Button size="sm" className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
                            Start
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card className="bg-gray-900/50 border-gray-800">
                  <CardContent className="p-6 text-center">
                    <BookOpen className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-white mb-2">No lessons available</h3>
                    <p className="text-gray-400">Check back later for new learning content</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Active Battles */}
            <Card className="bg-gray-900/50 border-gray-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-white flex items-center">
                  <Swords className="w-5 h-5 mr-2 text-red-400" />
                  Active Battles
                </CardTitle>
              </CardHeader>
              <CardContent>
                {Array.isArray(battles) && battles.length > 0 ? (
                  <div className="space-y-3">
                    {battles.slice(0, 3).map((battle: any) => (
                      <div key={battle.id} className="p-3 bg-gray-800/50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-white">{battle.title}</span>
                          <Badge variant="outline" className="text-xs text-orange-400 border-orange-400/30">
                            Live
                          </Badge>
                        </div>
                        <div className="text-xs text-gray-400">
                          {battle.participants} participants
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <Swords className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">No active battles</p>
                  </div>
                )}
                <Link href="/battles">
                  <Button variant="outline" size="sm" className="w-full mt-3 border-gray-700 text-gray-300 hover:bg-gray-800">
                    View All Battles
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Top Performers */}
            <Card className="bg-gray-900/50 border-gray-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-white flex items-center">
                  <Award className="w-5 h-5 mr-2 text-yellow-400" />
                  Top Performers
                </CardTitle>
              </CardHeader>
              <CardContent>
                {Array.isArray(leaderboard) && leaderboard.length > 0 ? (
                  <div className="space-y-3">
                    {leaderboard.slice(0, 5).map((user: any, index: number) => (
                      <div key={user.id} className="flex items-center space-x-3">
                        <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-xs font-bold text-white">
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">
                            {user.username || user.twitterDisplayName || `User ${user.id.slice(-4)}`}
                          </p>
                          <p className="text-xs text-gray-400">{user.auraPoints} Aura</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <Award className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">Loading leaderboard...</p>
                  </div>
                )}
                <Link href="/leaderboard">
                  <Button variant="outline" size="sm" className="w-full mt-3 border-gray-700 text-gray-300 hover:bg-gray-800">
                    View Full Leaderboard
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}