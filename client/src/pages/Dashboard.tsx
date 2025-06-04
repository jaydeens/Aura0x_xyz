import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Link } from "wouter";
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
      window.location.href = "/";
    }
  }, [isAuthenticated, isLoading]);

  // Fetch daily lessons
  const { data: dailyLessons, isLoading: lessonsLoading } = useQuery({
    queryKey: ["/api/lessons/daily"],
    enabled: isAuthenticated,
    onError: (error: any) => {
      if (isUnauthorizedError(error)) {
        window.location.href = "/";
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load lessons",
        });
      }
    },
  });

  // Fetch recent battles
  const { data: recentBattles, isLoading: battlesLoading } = useQuery({
    queryKey: ["/api/battles"],
    enabled: isAuthenticated,
  });

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <p className="text-white text-lg font-bold">Loading your fame dashboard...</p>
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
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-7xl font-black text-white mb-4 bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 bg-clip-text text-transparent">
              Your Fame Feed
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Welcome back, {user?.firstName || user?.username || 'Creator'}! 
              Ready to build your viral empire and climb the fame ladder?
            </p>
          </div>

          {/* Stats Overview - TikTok Style */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-16">
            {/* Fame Points Card */}
            <div className="lg:col-span-2 bg-gradient-to-br from-pink-500 to-purple-600 rounded-3xl p-8 text-white relative overflow-hidden group hover:scale-105 transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-black uppercase tracking-wider">🔥 Fame Score</h3>
                  <Coins className="w-8 h-8 text-white/80" />
                </div>
                <div className="text-5xl font-black mb-2">{user?.auraPoints?.toLocaleString() || "0"}</div>
                <div className="text-white/80 font-medium">Going Viral!</div>
              </div>
            </div>

            {/* Streak Card */}
            <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-3xl p-6 text-white group hover:scale-105 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-black uppercase tracking-wider">🔥 Streak</h3>
                <Flame className="w-6 h-6 text-white/80" />
              </div>
              <div className="text-3xl font-black mb-1">{user?.currentStreak || 0}</div>
              <div className="text-white/80 text-sm">days hot</div>
            </div>

            {/* Wins Card */}
            <div className="bg-gradient-to-br from-cyan-500 to-blue-500 rounded-3xl p-6 text-white group hover:scale-105 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-black uppercase tracking-wider">🏆 Wins</h3>
                <Trophy className="w-6 h-6 text-white/80" />
              </div>
              <div className="text-3xl font-black mb-1">{user?.totalBattlesWon || 0}</div>
              <div className="text-white/80 text-sm">showdowns</div>
            </div>

            {/* USDT Earnings Card */}
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl p-6 text-white group hover:scale-105 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-black uppercase tracking-wider">💰 Earnings</h3>
                <Target className="w-6 h-6 text-white/80" />
              </div>
              <div className="text-3xl font-black mb-1">${user?.totalUsdtEarned || "0.00"}</div>
              <div className="text-white/80 text-sm">USDT earned</div>
            </div>
          </div>

          {/* Main Content Sections */}
          <div className="space-y-16">
            {/* Today's Learning Section */}
            <section>
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-3xl font-black text-white mb-2">📚 Level Up Today</h2>
                  <p className="text-gray-400">Complete daily lessons to maintain your viral streak and earn fame points</p>
                </div>
                <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-full px-4 py-2">
                  <span className="text-white font-bold text-sm">🔥 {user?.currentStreak || 0} day streak</span>
                </div>
              </div>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {lessonsLoading ? (
                  [...Array(3)].map((_, i) => (
                    <div key={i} className="bg-gray-800/50 rounded-3xl p-6 animate-pulse">
                      <div className="h-32 bg-gray-700 rounded-2xl mb-4"></div>
                      <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-700 rounded w-1/2"></div>
                    </div>
                  ))
                ) : dailyLessons && dailyLessons.length > 0 ? (
                  dailyLessons.map((lesson: any) => (
                    <LessonCard key={lesson.id} lesson={lesson} />
                  ))
                ) : (
                  <div className="md:col-span-2 lg:col-span-3 text-center py-16">
                    <Clock className="w-20 h-20 text-gray-500 mx-auto mb-6" />
                    <h3 className="text-2xl font-bold text-gray-300 mb-4">No Lessons Yet</h3>
                    <p className="text-gray-500 text-lg">New viral content drops daily. Check back soon!</p>
                  </div>
                )}
              </div>
            </section>

            {/* Live Battles Section */}
            <section>
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-3xl font-black text-white mb-2">🥊 Live Showdowns</h2>
                  <p className="text-gray-400">Join the action and vote on viral battles happening right now</p>
                </div>
                <Link href="/battles">
                  <div className="bg-gradient-to-r from-pink-500 to-purple-600 rounded-full px-6 py-3 hover:scale-105 transition-transform cursor-pointer">
                    <span className="text-white font-bold">View All Battles</span>
                  </div>
                </Link>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                {battlesLoading ? (
                  [...Array(2)].map((_, i) => (
                    <div key={i} className="bg-gray-800/50 rounded-3xl p-6 animate-pulse">
                      <div className="h-40 bg-gray-700 rounded-2xl mb-4"></div>
                      <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-700 rounded w-1/2"></div>
                    </div>
                  ))
                ) : recentBattles && recentBattles.length > 0 ? (
                  recentBattles.slice(0, 2).map((battle: any) => (
                    <div key={battle.id} className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-6 border border-gray-700 hover:border-pink-500/50 transition-all duration-300">
                      <div className="flex items-center justify-between mb-4">
                        <Badge className="bg-pink-500/20 text-pink-400">
                          {battle.status === 'active' ? 'LIVE' : 'COMPLETED'}
                        </Badge>
                        <Trophy className="w-6 h-6 text-gray-400" />
                      </div>
                      <h3 className="text-white font-bold text-lg mb-2">{battle.topic}</h3>
                      <p className="text-gray-400 text-sm">Join the battle and vote for your favorite</p>
                    </div>
                  ))
                ) : (
                  <div className="md:col-span-2 text-center py-16">
                    <Trophy className="w-20 h-20 text-gray-500 mx-auto mb-6" />
                    <h3 className="text-2xl font-bold text-gray-300 mb-4">No Active Battles</h3>
                    <p className="text-gray-500 text-lg">Be the first to start a viral showdown!</p>
                  </div>
                )}
              </div>
            </section>

            {/* Analytics Section */}
            <section>
              <div className="text-center mb-8">
                <h2 className="text-3xl font-black text-white mb-2">📊 Your Performance</h2>
                <p className="text-gray-400">Detailed breakdown of your viral journey and achievements</p>
              </div>
              
              <div className="grid md:grid-cols-3 gap-6 mb-8">
                {/* Learning Progress */}
                <div className="bg-gradient-to-br from-blue-900/50 to-indigo-900/50 rounded-3xl p-6 border border-blue-500/30">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-white font-bold">📚 Learning Stats</h3>
                    <BookOpen className="w-6 h-6 text-blue-400" />
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Lessons from Learning:</span>
                      <span className="text-blue-400 font-semibold">{user?.auraFromLessons || 0} fame</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Learning Percentage:</span>
                      <span className="text-blue-400 font-semibold">
                        {user?.auraPoints ? Math.round(((user?.auraFromLessons || 0) / user?.auraPoints) * 100) : 0}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Social Stats */}
                <div className="bg-gradient-to-br from-pink-900/50 to-purple-900/50 rounded-3xl p-6 border border-pink-500/30">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-white font-bold">💝 Social Stats</h3>
                    <HandHeart className="w-6 h-6 text-pink-400" />
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Fame from Vouching:</span>
                      <span className="text-pink-400 font-semibold">{user?.auraFromVouching || 0} fame</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Social Percentage:</span>
                      <span className="text-pink-400 font-semibold">
                        {user?.auraPoints ? Math.round(((user?.auraFromVouching || 0) / user?.auraPoints) * 100) : 0}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Battle Stats */}
                <div className="bg-gradient-to-br from-orange-900/50 to-red-900/50 rounded-3xl p-6 border border-orange-500/30">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-white font-bold">⚔️ Battle Stats</h3>
                    <Swords className="w-6 h-6 text-orange-400" />
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Fame from Battles:</span>
                      <span className="text-orange-400 font-semibold">{user?.auraFromBattles || 0} fame</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Battle Percentage:</span>
                      <span className="text-orange-400 font-semibold">
                        {user?.auraPoints ? Math.round(((user?.auraFromBattles || 0) / user?.auraPoints) * 100) : 0}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Quick Actions */}
            <section>
              <div className="text-center mb-8">
                <h2 className="text-3xl font-black text-white mb-2">⚡ Quick Actions</h2>
                <p className="text-gray-400">Jump into the action with these popular features</p>
              </div>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Link href="/lessons">
                  <div className="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-3xl p-6 text-white hover:scale-105 transition-transform cursor-pointer">
                    <BookOpen className="w-8 h-8 mb-4" />
                    <h3 className="font-bold mb-2">Start Learning</h3>
                    <p className="text-sm text-white/80">Complete daily lessons</p>
                  </div>
                </Link>
                
                <Link href="/battles">
                  <div className="bg-gradient-to-br from-red-500 to-pink-500 rounded-3xl p-6 text-white hover:scale-105 transition-transform cursor-pointer">
                    <Swords className="w-8 h-8 mb-4" />
                    <h3 className="font-bold mb-2">Join Battle</h3>
                    <p className="text-sm text-white/80">Vote in live showdowns</p>
                  </div>
                </Link>
                
                <Link href="/leaderboard">
                  <div className="bg-gradient-to-br from-yellow-500 to-orange-500 rounded-3xl p-6 text-white hover:scale-105 transition-transform cursor-pointer">
                    <Trophy className="w-8 h-8 mb-4" />
                    <h3 className="font-bold mb-2">Leaderboard</h3>
                    <p className="text-sm text-white/80">See top creators</p>
                  </div>
                </Link>
                
                <Link href="/profile">
                  <div className="bg-gradient-to-br from-purple-500 to-indigo-500 rounded-3xl p-6 text-white hover:scale-105 transition-transform cursor-pointer">
                    <Target className="w-8 h-8 mb-4" />
                    <h3 className="font-bold mb-2">My Profile</h3>
                    <p className="text-sm text-white/80">Edit your profile</p>
                  </div>
                </Link>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}