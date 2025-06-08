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



  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-pink-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-pink-400 mx-auto mb-4"></div>
          <p className="text-white text-lg font-bold">Loading your Aura dashboard...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-pink-800">
      <Navigation />
      <main className="pt-24 pb-8">
        <div className="max-w-full mx-auto px-8">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-7xl font-black text-white mb-4 bg-gradient-to-r from-pink-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">Your Aura Dashboard</h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Welcome back, {user?.firstName || user?.username || 'Creator'}! 
              Ready to build your viral empire and climb the Aura ladder?
            </p>
          </div>

          {/* Stats Overview - Expanded Horizontal Layout */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
            {/* Aura Points Card - Larger */}
            <div className="md:col-span-2 bg-gradient-to-br from-purple-800/50 to-pink-800/50 backdrop-blur-sm rounded-2xl p-8 border border-purple-500/30">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-bold">🔥 Aura Points</h3>
                <Coins className="w-6 h-6 text-pink-400" />
              </div>
              <div className="text-3xl font-black text-white mb-1">{user?.auraPoints?.toLocaleString() || "0"}</div>
              <div className="text-purple-200 text-sm">APs</div>
            </div>

            {/* Streak Card */}
            <div className="bg-gradient-to-br from-purple-800/50 to-pink-800/50 backdrop-blur-sm rounded-2xl p-8 border border-purple-500/30">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-bold">🔥 Streak</h3>
                <Flame className="w-6 h-6 text-orange-400" />
              </div>
              <div className="text-2xl font-black text-white mb-1">{user?.currentStreak || 0}</div>
              <div className="text-purple-200 text-sm">days</div>
            </div>

            {/* Earnings Card */}
            <div className="bg-gradient-to-br from-purple-800/50 to-pink-800/50 backdrop-blur-sm rounded-2xl p-8 border border-purple-500/30">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-bold">💰 Earnings</h3>
                <Target className="w-6 h-6 text-green-400" />
              </div>
              <div className="text-2xl font-black text-white mb-1">${user?.totalUsdtEarned || "0.00"}</div>
              <div className="text-purple-200 text-sm">USDT</div>
            </div>
          </div>

          {/* Main Content Sections - Full Width Layout */}
          <div>
            {/* Today's Learning Section - Full Width */}
            <section>
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-3xl font-black text-white mb-2">📚 Level Up Today</h2>
                  <p className="text-purple-200">Complete daily lessons to maintain your viral streak and earn Aura points</p>
                </div>
                <div className="bg-gradient-to-r from-pink-500 to-purple-600 rounded-full px-4 py-2">
                  <span className="text-white font-bold text-sm">🔥 {user?.currentStreak || 0} day streak</span>
                </div>
              </div>
              
              <div className="grid md:grid-cols-12 gap-6">
                {lessonsLoading ? (
                  [...Array(3)].map((_, i) => (
                    <div key={i} className="md:col-span-8 bg-gradient-to-br from-purple-800/30 to-pink-800/30 backdrop-blur-sm rounded-3xl p-6 animate-pulse border border-purple-500/20">
                      <div className="h-32 bg-purple-700/50 rounded-2xl mb-4"></div>
                      <div className="h-4 bg-purple-700/50 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-purple-700/50 rounded w-1/2"></div>
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
                    <div className="bg-gradient-to-br from-purple-800/50 to-pink-800/50 backdrop-blur-sm rounded-2xl p-8 border border-purple-500/30 text-center">
                      <div className="bg-purple-700/50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
                        <BookOpen className="w-8 h-8 text-purple-200" />
                      </div>
                      <h3 className="text-xl font-bold text-white mb-3">Level Up Today</h3>
                      <p className="text-purple-200 mb-6">New lessons drop daily to help you master the crypto space</p>
                      <div className="space-y-3">
                        <div className="bg-purple-700/30 rounded-lg p-4 text-left">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="text-white font-semibold">Today's Lesson</h4>
                              <p className="text-purple-200 text-sm">Check back soon for new content</p>
                            </div>
                            <Clock className="w-5 h-5 text-purple-200" />
                          </div>
                        </div>
                        <div className="text-purple-300 text-sm">
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
    </div>
  );
}