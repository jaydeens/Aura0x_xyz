import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Link } from "wouter";
import Navigation from "@/components/Navigation";
import LessonCard from "@/components/LessonCard";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Zap, Flame, Clock, Trophy, Coins, Target, BookOpen, HandHeart, Swords, Info, Wallet, Brain, Cpu, Network, Sparkles } from "lucide-react";

export default function Dashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      window.location.href = "/";
    }
  }, [isAuthenticated, isLoading]);

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

  const { data: potionsBalance } = useQuery({
    queryKey: ["/api/potions/balance"],
    enabled: isAuthenticated,
    onError: (error: any) => {
      if (isUnauthorizedError(error)) {
        window.location.href = "/";
      }
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center" data-testid="loading-dashboard">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Brain className="w-8 h-8 text-white" />
          </div>
          <p className="text-white text-lg font-bold">Loading your Dreamz dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-blue-950 to-black relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-96 h-96 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-80 h-80 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-cyan-600/10 to-blue-600/10 rounded-full blur-3xl animate-ping"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgwLCAxODMsIDIzNSwgMC4xKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-20"></div>
      </div>
      <Navigation />
      <main className="relative z-10 pt-16 sm:pt-20 pb-8">
        <div className="max-w-full mx-auto px-3 sm:px-4 lg:px-8">
          <div className="text-center mb-8 sm:mb-12 lg:mb-16">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-black text-white mb-2 sm:mb-4 bg-gradient-to-r from-cyan-400 via-blue-500 to-cyan-400 bg-clip-text text-transparent leading-tight" data-testid="heading-dashboard">
              Your Dreamz Dashboard
            </h1>
            <p className="text-sm sm:text-lg lg:text-xl text-gray-400 max-w-2xl mx-auto px-4" data-testid="text-welcome">
              Welcome back, {user?.firstName || user?.username || 'Builder'}! 
              Ready to stack more potions and climb the reputation ladder?
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-12">
            <div className="sm:col-span-2 lg:col-span-1 bg-gradient-to-br from-cyan-900/50 to-blue-900/50 backdrop-blur-sm rounded-2xl p-4 sm:p-6 lg:p-8 border border-cyan-500/30" data-testid="card-dreamz-points">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h3 className="text-white font-bold text-sm sm:text-base flex items-center gap-2">
                  <Brain className="w-4 h-4 text-cyan-400" />
                  Dreamz Points
                </h3>
                <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-white mb-1" data-testid="text-dreamz-points">{user?.dreamzPoints?.toLocaleString() || "0"}</div>
              <div className="text-cyan-200 text-xs sm:text-sm">DP</div>
            </div>

            <div className="bg-gradient-to-br from-cyan-900/50 to-blue-900/50 backdrop-blur-sm rounded-2xl p-4 sm:p-6 lg:p-8 border border-cyan-500/30" data-testid="card-streak">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h3 className="text-white font-bold text-sm sm:text-base flex items-center gap-2">
                  <Zap className="w-4 h-4 text-blue-400" />
                  Streak
                </h3>
                <Flame className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-white mb-1" data-testid="text-streak">{user?.currentStreak || 0}</div>
              <div className="text-cyan-200 text-xs sm:text-sm">days</div>
            </div>

            <div className="bg-gradient-to-br from-cyan-900/50 to-blue-900/50 backdrop-blur-sm rounded-2xl p-4 sm:p-6 lg:p-8 border border-cyan-500/30" data-testid="card-earnings">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h3 className="text-white font-bold text-sm sm:text-base flex items-center gap-2">
                  <Coins className="w-4 h-4 text-cyan-400" />
                  Earnings
                </h3>
                <Target className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-400" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-white mb-1" data-testid="text-earnings">{Number((user as any)?.totalUsdtEarned || 0).toFixed(2)} USDC</div>
              <div className="text-cyan-200 text-xs sm:text-sm">earned from vouches</div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-8 sm:mb-12">
            <div className="bg-gradient-to-br from-cyan-800/50 to-blue-800/50 backdrop-blur-sm rounded-2xl p-4 sm:p-6 lg:p-8 border border-cyan-500/30" data-testid="card-battle-potions">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h3 className="text-white font-bold text-sm sm:text-base flex items-center gap-2">
                  <Swords className="w-4 h-4 text-cyan-400" />
                  Battle Potions
                </h3>
                <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-white mb-1" data-testid="text-battle-potions">{(potionsBalance?.battleEarnedSteeze || 0).toLocaleString()}</div>
              <div className="text-cyan-200 text-xs sm:text-sm">earned from battles</div>
            </div>

            <div className="bg-gradient-to-br from-blue-800/50 to-cyan-800/50 backdrop-blur-sm rounded-2xl p-4 sm:p-6 lg:p-8 border border-blue-500/30" data-testid="card-purchased-potions">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h3 className="text-white font-bold text-sm sm:text-base flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-blue-400" />
                  Purchased Potions
                </h3>
                <Coins className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-white mb-1" data-testid="text-purchased-potions">{(potionsBalance?.purchasedSteeze || 0).toLocaleString()}</div>
              <div className="text-blue-200 text-xs sm:text-sm">bought with USDC</div>
            </div>
          </div>

          <div>
            <section>
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-3xl font-black text-white mb-2 flex items-center gap-2" data-testid="heading-lessons">
                    <BookOpen className="w-8 h-8 text-cyan-400" />
                    Level Up Today
                  </h2>
                  <p className="text-cyan-200">Complete daily lessons to maintain your streak and earn Dreamz points</p>
                </div>
                <div className="bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full px-4 py-2" data-testid="badge-streak-indicator">
                  <span className="text-white font-bold text-sm flex items-center gap-1">
                    <Zap className="w-4 h-4" />
                    {user?.currentStreak || 0} day streak
                  </span>
                </div>
              </div>
              
              <div className="grid md:grid-cols-12 gap-6">
                {lessonsLoading ? (
                  [...Array(3)].map((_, i) => (
                    <div key={i} className="md:col-span-8 bg-gradient-to-br from-cyan-900/30 to-blue-900/30 backdrop-blur-sm rounded-3xl p-6 animate-pulse border border-cyan-500/20">
                      <div className="h-32 bg-cyan-700/50 rounded-2xl mb-4"></div>
                      <div className="h-4 bg-cyan-700/50 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-cyan-700/50 rounded w-1/2"></div>
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
                    <div className="bg-gradient-to-br from-cyan-900/50 to-blue-900/50 backdrop-blur-sm rounded-2xl p-8 border border-cyan-500/30 text-center" data-testid="card-no-lessons">
                      <div className="bg-cyan-700/50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
                        <BookOpen className="w-8 h-8 text-cyan-200" />
                      </div>
                      <h3 className="text-xl font-bold text-white mb-3">Level Up Today</h3>
                      <p className="text-cyan-200 mb-6">New lessons drop daily to help you master the protocol</p>
                      <div className="space-y-3">
                        <div className="bg-cyan-700/30 rounded-lg p-4 text-left">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="text-white font-semibold">Today's Lesson</h4>
                              <p className="text-cyan-200 text-sm">Check back soon for new content</p>
                            </div>
                            <Clock className="w-5 h-5 text-cyan-200" />
                          </div>
                        </div>
                        <div className="text-cyan-300 text-sm">
                          Lessons reset daily at midnight
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
