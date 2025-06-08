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
      <main className="pt-24 pb-8">
        <div className="max-w-full mx-auto px-8">
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

          {/* Stats Overview - Expanded Horizontal Layout */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-12">
            {/* Fame Points Card - Larger */}
            <div className="md:col-span-2 bg-gray-800 rounded-2xl p-8 border border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-bold">🔥 Fame Score</h3>
                <Coins className="w-6 h-6 text-purple-400" />
              </div>
              <div className="text-3xl font-black text-white mb-1">{user?.auraPoints?.toLocaleString() || "0"}</div>
              <div className="text-gray-400 text-sm">viral points</div>
            </div>

            {/* Streak Card */}
            <div className="bg-gray-800 rounded-2xl p-8 border border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-bold">🔥 Streak</h3>
                <Flame className="w-6 h-6 text-orange-400" />
              </div>
              <div className="text-2xl font-black text-white mb-1">{user?.currentStreak || 0}</div>
              <div className="text-gray-400 text-sm">days</div>
            </div>

            {/* Earnings Card */}
            <div className="bg-gray-800 rounded-2xl p-8 border border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-bold">💰 Earnings</h3>
                <Target className="w-6 h-6 text-green-400" />
              </div>
              <div className="text-2xl font-black text-white mb-1">${user?.totalUsdtEarned || "0.00"}</div>
              <div className="text-gray-400 text-sm">USDT</div>
            </div>

            {/* Battle Wins Card */}
            <div className="bg-gray-800 rounded-2xl p-8 border border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-bold">🏆 Wins</h3>
                <Trophy className="w-6 h-6 text-yellow-400" />
              </div>
              <div className="text-2xl font-black text-white mb-1">{user?.totalBattlesWon || 0}</div>
              <div className="text-gray-400 text-sm">battles</div>
            </div>
          </div>

          {/* Main Content Sections - Wide Layout */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* Today's Learning Section - Takes 2/3 width */}
            <section className="xl:col-span-2">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-3xl font-black text-white mb-2">📚 Level Up Today</h2>
                  <p className="text-gray-400">Complete daily lessons to maintain your viral streak and earn fame points</p>
                </div>
                <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-full px-4 py-2">
                  <span className="text-white font-bold text-sm">🔥 {user?.currentStreak || 0} day streak</span>
                </div>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
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
                  <div className="md:col-span-2">
                    <div className="bg-gray-800 rounded-2xl p-8 border border-gray-700 text-center">
                      <div className="bg-gray-700 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
                        <BookOpen className="w-8 h-8 text-gray-400" />
                      </div>
                      <h3 className="text-xl font-bold text-white mb-3">Level Up Today</h3>
                      <p className="text-gray-400 mb-6">New lessons drop daily to help you master the viral game</p>
                      <div className="space-y-3">
                        <div className="bg-gray-700/50 rounded-lg p-4 text-left">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="text-white font-semibold">Today's Lesson</h4>
                              <p className="text-gray-400 text-sm">Check back soon for new content</p>
                            </div>
                            <Clock className="w-5 h-5 text-gray-400" />
                          </div>
                        </div>
                        <div className="text-gray-500 text-sm">
                          Lessons reset daily at midnight
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* Right Sidebar - Visual Elements & Motivation */}
            <aside className="xl:col-span-1 space-y-6">
              {/* Achievement Visualization */}
              <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 rounded-2xl p-6 border border-purple-500/20 backdrop-blur-sm">
                <div className="text-center mb-6">
                  <div className="relative mx-auto w-24 h-24 mb-4">
                    {/* Circular Progress Ring */}
                    <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="transparent"
                        className="text-gray-700"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="transparent"
                        strokeDasharray={`${(user?.currentStreak || 0) * 10} 251.2`}
                        className="text-gradient-to-r from-purple-400 to-pink-400"
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-2xl">🚀</span>
                    </div>
                  </div>
                  <h3 className="text-white font-bold text-lg">Streak Power</h3>
                  <p className="text-gray-400 text-sm">Keep going to unlock bonuses</p>
                </div>
              </div>

              {/* Quick Stats Visualization */}
              <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
                <h3 className="text-white font-bold mb-4 flex items-center">
                  <Target className="w-5 h-5 mr-2 text-yellow-400" />
                  Goals Progress
                </h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-400">Daily Learning</span>
                      <span className="text-white">1/1</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div className="bg-gradient-to-r from-green-400 to-blue-500 h-2 rounded-full w-full"></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-400">Weekly Battles</span>
                      <span className="text-white">2/5</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div className="bg-gradient-to-r from-purple-400 to-pink-500 h-2 rounded-full w-2/5"></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-400">Social Connections</span>
                      <span className="text-white">7/10</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div className="bg-gradient-to-r from-yellow-400 to-orange-500 h-2 rounded-full w-3/4"></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Motivational Card */}
              <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 border border-gray-700 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10"></div>
                <div className="relative z-10">
                  <div className="text-center mb-4">
                    <div className="text-4xl mb-2">⭐</div>
                    <h3 className="text-white font-bold">Level Up Tip</h3>
                  </div>
                  <p className="text-gray-300 text-sm text-center leading-relaxed">
                    "Consistency beats intensity. Complete daily lessons to build unstoppable momentum and unlock exclusive rewards."
                  </p>
                  <div className="flex justify-center mt-4">
                    <div className="flex space-x-1">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className={`w-2 h-2 rounded-full ${i < 3 ? 'bg-yellow-400' : 'bg-gray-600'}`}></div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Achievement Badges */}
              <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
                <h3 className="text-white font-bold mb-4 flex items-center">
                  <Trophy className="w-5 h-5 mr-2 text-yellow-400" />
                  Recent Achievements
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 rounded-lg p-3 text-center border border-purple-500/30">
                    <div className="text-2xl mb-1">🔥</div>
                    <div className="text-white text-xs font-semibold">Streak Master</div>
                  </div>
                  <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-lg p-3 text-center border border-blue-500/30">
                    <div className="text-2xl mb-1">🎯</div>
                    <div className="text-white text-xs font-semibold">Goal Crusher</div>
                  </div>
                  <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-lg p-3 text-center border border-green-500/30">
                    <div className="text-2xl mb-1">💰</div>
                    <div className="text-white text-xs font-semibold">Earner</div>
                  </div>
                  <div className="bg-gradient-to-br from-pink-500/20 to-pink-600/20 rounded-lg p-3 text-center border border-pink-500/30">
                    <div className="text-2xl mb-1">⚡</div>
                    <div className="text-white text-xs font-semibold">Rising Star</div>
                  </div>
                </div>
              </div>
            </aside>

          </div>

          {/* Bottom Section - Live Battles */}
          <div className="mt-16">

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
          </div>
        </div>
      </main>
    </div>
  );
}