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
import { Zap, Flame, Clock, Trophy, Coins, Target, BookOpen, HandHeart, Swords, Info, Wallet, Brain, Cpu, Network, Sparkles, Database, Activity, Shield, Blocks, GitBranch, Hexagon } from "lucide-react";

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
          <p className="text-white text-lg font-bold">Initializing neural interface...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-cyan-500/10 via-blue-600/10 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-blue-500/10 via-cyan-500/10 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute top-1/3 left-1/3 w-[400px] h-[400px] bg-gradient-to-br from-cyan-600/5 to-blue-600/5 rounded-full blur-3xl animate-pulse"></div>
        
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImhleGFnb24iIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTTMwIDEwIEw1MCAyMiBMNTAgNDIgTDMwIDU0IEwxMCA0MiBMMTAgMjIgWiIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDAsIDE4MywgMjM1LCAwLjA1KSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2hleGFnb24pIi8+PC9zdmc+')] opacity-30"></div>
        
        <svg className="absolute top-10 right-10 w-32 h-32 opacity-10" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="40" fill="none" stroke="url(#gradient)" strokeWidth="1">
            <animateTransform attributeName="transform" type="rotate" from="0 50 50" to="360 50 50" dur="20s" repeatCount="indefinite"/>
          </circle>
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00b7eb" />
              <stop offset="100%" stopColor="#0066ff" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      
      <Navigation />
      
      <main className="relative z-10 pt-20 sm:pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-10 sm:mb-14">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex-1 min-w-[280px]">
                <div className="flex items-center gap-3 mb-3">
                  <div className="relative">
                    <Hexagon className="w-10 h-10 sm:w-12 sm:h-12 text-cyan-400 animate-pulse" />
                    <Network className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                  </div>
                  <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-transparent bg-gradient-to-r from-cyan-300 via-blue-400 to-cyan-300 bg-clip-text" data-testid="heading-dashboard">
                    Neural Command Center
                  </h1>
                </div>
                <p className="text-sm sm:text-base text-gray-400 pl-1" data-testid="text-welcome">
                  Operator {user?.firstName || user?.username || 'Anonymous'} // Network Status: ACTIVE // Protocol v2.0
                </p>
              </div>
              
              <div className="flex items-center gap-3 bg-gradient-to-r from-cyan-500/20 to-blue-600/20 backdrop-blur-sm border border-cyan-500/30 rounded-xl px-4 py-3" data-testid="badge-streak-indicator">
                <Activity className="w-5 h-5 text-cyan-400" />
                <div>
                  <div className="text-xs text-gray-400 uppercase tracking-wider">Consensus Chain</div>
                  <div className="text-white font-black text-lg">{user?.currentStreak || 0} Blocks</div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6 mb-6">
            <div className="md:col-span-5 bg-gradient-to-br from-cyan-900/40 via-blue-900/40 to-cyan-900/40 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-cyan-500/20 relative overflow-hidden" data-testid="card-dreamz-points">
              <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-cyan-500/10 to-transparent rounded-full blur-2xl"></div>
              <div className="relative">
                <div className="flex items-center gap-2 mb-6">
                  <div className="p-2 bg-cyan-500/20 rounded-lg">
                    <Database className="w-5 h-5 text-cyan-400" />
                  </div>
                  <span className="text-cyan-300 font-mono text-sm uppercase tracking-wider">Neural Credits</span>
                </div>
                <div className="mb-4">
                  <div className="text-5xl sm:text-6xl font-black text-white mb-2 font-mono" data-testid="text-dreamz-points">
                    {user?.dreamzPoints?.toLocaleString() || "0"}
                  </div>
                  <div className="text-cyan-400 text-sm font-mono">NC // AI Consensus Points</div>
                </div>
                <div className="flex items-center gap-2 text-cyan-300 text-xs">
                  <Cpu className="w-4 h-4" />
                  <span className="font-mono">Primary Protocol Currency</span>
                </div>
              </div>
            </div>

            <div className="md:col-span-7 grid grid-cols-2 gap-4 sm:gap-6">
              <div className="bg-gradient-to-br from-blue-900/30 to-cyan-900/30 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-blue-500/20 relative overflow-hidden" data-testid="card-streak">
                <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-blue-500/10 rounded-full blur-xl"></div>
                <div className="relative">
                  <div className="flex items-center gap-2 mb-3">
                    <GitBranch className="w-4 h-4 text-blue-400" />
                    <span className="text-gray-400 text-xs font-mono uppercase">Uptime</span>
                  </div>
                  <div className="text-3xl sm:text-4xl font-black text-white mb-1" data-testid="text-streak">{user?.currentStreak || 0}</div>
                  <div className="text-blue-300 text-xs font-mono">consecutive days</div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-cyan-900/30 to-blue-900/30 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-cyan-500/20 relative overflow-hidden" data-testid="card-earnings">
                <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-cyan-500/10 rounded-full blur-xl"></div>
                <div className="relative">
                  <div className="flex items-center gap-2 mb-3">
                    <Trophy className="w-4 h-4 text-cyan-400" />
                    <span className="text-gray-400 text-xs font-mono uppercase">Yield</span>
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-white mb-1" data-testid="text-earnings">{Number((user as any)?.totalUsdtEarned || 0).toFixed(2)}</div>
                  <div className="text-cyan-300 text-xs font-mono">USDC harvested</div>
                </div>
              </div>

              <div className="col-span-2 bg-gradient-to-r from-blue-900/40 to-cyan-900/40 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-blue-500/20 relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjEiIGZpbGw9InJnYmEoMCwgMTgzLCAyMzUsIDAuMSkiLz48L3N2Zz4=')] opacity-50"></div>
                <div className="relative flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Blocks className="w-4 h-4 text-cyan-400" />
                      <span className="text-gray-400 text-xs font-mono uppercase">Token Reserves</span>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                      <div data-testid="card-battle-potions">
                        <div className="text-xl sm:text-2xl font-black text-white mb-1" data-testid="text-battle-potions">{(potionsBalance?.battleEarnedSteeze || 0).toLocaleString()}</div>
                        <div className="text-cyan-300 text-xs font-mono">Combat Rewards</div>
                      </div>
                      <div data-testid="card-purchased-potions">
                        <div className="text-xl sm:text-2xl font-black text-white mb-1" data-testid="text-purchased-potions">{(potionsBalance?.purchasedSteeze || 0).toLocaleString()}</div>
                        <div className="text-blue-300 text-xs font-mono">Staked Assets</div>
                      </div>
                    </div>
                  </div>
                  <div className="hidden sm:flex items-center justify-center">
                    <div className="relative w-16 h-16">
                      <Hexagon className="w-16 h-16 text-cyan-500/30 absolute" />
                      <Coins className="w-8 h-8 text-cyan-400 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6 pb-4 border-b border-cyan-500/20">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-lg">
                    <Brain className="w-6 h-6 text-cyan-400" />
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black text-white" data-testid="heading-lessons">
                    Protocol Training
                  </h2>
                </div>
                <p className="text-gray-400 text-sm font-mono pl-14">
                  Daily AI modules // Maintain consensus streak // Earn neural credits
                </p>
              </div>
              
              <div className="flex items-center gap-2 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-lg px-4 py-2">
                <Shield className="w-4 h-4 text-cyan-400" />
                <span className="text-cyan-300 font-mono text-sm">
                  Network: <span className="text-white font-bold">SYNCED</span>
                </span>
              </div>
            </div>

            {lessonsLoading ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="bg-gradient-to-br from-cyan-900/20 to-blue-900/20 backdrop-blur-sm rounded-2xl p-6 animate-pulse border border-cyan-500/10">
                    <div className="h-40 bg-cyan-700/20 rounded-xl mb-4"></div>
                    <div className="h-4 bg-cyan-700/20 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-cyan-700/20 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : dailyLessons && dailyLessons.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                {dailyLessons.map((lesson: any) => (
                  <div key={lesson.id} className="col-span-1">
                    <LessonCard lesson={lesson} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-gradient-to-br from-cyan-900/30 via-blue-900/30 to-cyan-900/30 backdrop-blur-md rounded-3xl p-8 sm:p-12 border border-cyan-500/20 relative overflow-hidden" data-testid="card-no-lessons">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGxpbmUgeDE9IjAiIHkxPSIyMCIgeDI9IjQwIiB5Mj0iMjAiIHN0cm9rZT0icmdiYSgwLCAxODMsIDIzNSwgMC4wNSkiIHN0cm9rZS13aWR0aD0iMSIvPjxsaW5lIHgxPSIyMCIgeTE9IjAiIHgyPSIyMCIgeTI9IjQwIiBzdHJva2U9InJnYmEoMCwgMTgzLCAyMzUsIDAuMDUpIiBzdHJva2Utd2lkdGg9IjEiLz48L3N2Zz4=')] opacity-50"></div>
                <div className="relative">
                  <div className="flex items-center justify-center mb-6">
                    <div className="relative">
                      <div className="absolute inset-0 bg-cyan-500/20 rounded-2xl blur-xl animate-pulse"></div>
                      <div className="relative p-4 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-2xl border border-cyan-500/30">
                        <Brain className="w-12 h-12 text-cyan-400" />
                      </div>
                    </div>
                  </div>
                  <h3 className="text-2xl font-black text-white mb-3 text-center">Neural Training Queue</h3>
                  <p className="text-cyan-200 mb-8 text-center font-mono text-sm">
                    Daily AI modules deployed at 00:00 UTC // Check back for protocol updates
                  </p>
                  <div className="max-w-md mx-auto space-y-3">
                    <div className="bg-cyan-900/30 backdrop-blur-sm rounded-xl p-5 border border-cyan-500/20">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-cyan-500/20 rounded-lg">
                            <Clock className="w-5 h-5 text-cyan-400" />
                          </div>
                          <div>
                            <h4 className="text-white font-bold font-mono">Next Training Module</h4>
                            <p className="text-cyan-300 text-sm font-mono">Awaiting deployment...</p>
                          </div>
                        </div>
                        <Activity className="w-5 h-5 text-cyan-400 animate-pulse" />
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="inline-flex items-center gap-2 text-cyan-400 text-xs font-mono bg-cyan-500/10 px-4 py-2 rounded-lg border border-cyan-500/20">
                        <Sparkles className="w-4 h-4" />
                        <span>Training modules reset daily at 00:00 UTC</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
