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
            <h1 className="text-5xl md:text-7xl font-black text-white mb-4 bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 bg-clip-text text-transparent">Your Aura Dashboard</h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Welcome back, {user?.firstName || user?.username || 'Creator'}! 
              Ready to build your viral empire and climb the Aura ladder?
            </p>
          </div>

          {/* Stats Overview - Expanded Horizontal Layout */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-12">
            {/* Fame Points Card - Larger */}
            <div className="md:col-span-2 bg-gray-800 rounded-2xl p-8 border border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-bold">🔥 Aura Points</h3>
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

          {/* Main Content Sections - Full Width Layout */}
          <div>
            {/* Today's Learning Section - Full Width */}
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
              
              <div className="grid md:grid-cols-12 gap-6">
                {lessonsLoading ? (
                  [...Array(3)].map((_, i) => (
                    <div key={i} className="md:col-span-8 bg-gray-800/50 rounded-3xl p-6 animate-pulse">
                      <div className="h-32 bg-gray-700 rounded-2xl mb-4"></div>
                      <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-700 rounded w-1/2"></div>
                    </div>
                  ))
                ) : dailyLessons && dailyLessons.length > 0 ? (
                  dailyLessons.map((lesson: any) => (
                    <div key={lesson.id} className="md:col-span-8">
                      <LessonCard lesson={lesson} />
                    </div>
                  ))
                ) : (
                  <div className="md:col-span-12">
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
              
              <div className="grid md:grid-cols-12 gap-6">
                {battlesLoading ? (
                  [...Array(4)].map((_, i) => (
                    <div key={i} className="md:col-span-6 bg-gray-800/50 rounded-3xl p-6 animate-pulse">
                      <div className="h-40 bg-gray-700 rounded-2xl mb-4"></div>
                      <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-700 rounded w-1/2"></div>
                    </div>
                  ))
                ) : recentBattles && recentBattles.length > 0 ? (
                  recentBattles.slice(0, 2).map((battle: any) => (
                    <div key={battle.id} className="md:col-span-6">
                      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-6 border border-gray-700 hover:border-pink-500/50 transition-all duration-300">
                      <div className="flex items-center justify-between mb-4">
                        <Badge className="bg-pink-500/20 text-pink-400">
                          {battle.status === 'active' ? 'LIVE' : 'COMPLETED'}
                        </Badge>
                        <Trophy className="w-6 h-6 text-gray-400" />
                      </div>
                      <h3 className="text-white font-bold text-lg mb-2">{battle.topic}</h3>
                      <p className="text-gray-400 text-sm">Join the battle and vote for your favorite</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="md:col-span-12 text-center py-16">
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