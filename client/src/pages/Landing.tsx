import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Zap, Users, Brain, Sparkles, Play, TrendingUp, Cpu, Network } from "lucide-react";
import AuthModal from "@/components/AuthModal";

export default function Landing() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  const { data: stats } = useQuery({
    queryKey: ['/api/stats'],
    refetchInterval: 30000,
  });

  const { data: leaderboard } = useQuery({
    queryKey: ['/api/leaderboard'],
    refetchInterval: 60000,
  });

  const { data: activeBattles } = useQuery({
    queryKey: ['/api/battles'],
    refetchInterval: 15000,
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
    }
  }, [isAuthenticated, isLoading, toast]);

  const handleLogin = () => {
    setShowAuthModal(true);
  };

  const handleWatchDemo = () => {
    toast({
      title: "Demo Coming Soon",
      description: "Battle demos will be available once you join the platform!",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-pulse">
          <div className="w-16 h-16 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center">
            <Brain className="w-8 h-8 text-white" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <nav className="fixed top-0 w-full z-50 bg-gradient-to-r from-black via-blue-950/90 to-black backdrop-blur-xl border-b border-cyan-500/30 shadow-2xl shadow-cyan-500/20" data-testid="navbar-landing">
        <div className="w-full px-4 sm:px-6 lg:px-8 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-transparent to-blue-500/5 rounded-lg"></div>
          <div className="flex items-center justify-between h-14 sm:h-16 w-full relative z-10">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="flex items-center">
                <div className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-cyan-400 via-blue-500 to-cyan-400 bg-clip-text text-transparent">
                  DREAMZ
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Badge className="hidden sm:flex bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-black text-xs px-2 sm:px-3 py-1 shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 transition-shadow" data-testid="badge-trending">
                <Cpu className="w-3 h-3 mr-1 animate-pulse" />
                AI POWERED
              </Badge>
              <Button 
                onClick={handleLogin} 
                className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-black px-3 sm:px-6 py-2 text-sm sm:text-base rounded-lg shadow-xl shadow-cyan-500/30 hover:shadow-cyan-500/50 transform hover:scale-105 transition-all duration-300"
                data-testid="button-login"
              >
                CONNECT
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <section className="relative min-h-screen overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-black via-blue-950 to-black">
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500 rounded-full blur-3xl animate-pulse"></div>
              <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-600 rounded-full blur-3xl animate-pulse delay-1000"></div>
            </div>
          </div>
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgwLCAxODMsIDIzNSwgMC4xKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-30"></div>
        </div>
        
        <div className="relative z-10 min-h-screen flex items-center justify-center px-4 sm:px-6 pt-16 sm:pt-0">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 rounded-full px-4 sm:px-6 py-2 sm:py-3 mb-6 sm:mb-8" data-testid="badge-ai-crypto">
              <Network className="w-4 h-4 text-cyan-400 animate-pulse" />
              <span className="text-cyan-400 font-black text-xs sm:text-sm tracking-wider">AI × CRYPTO REPUTATION</span>
            </div>
            
            <h1 className="text-4xl xs:text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-black leading-none mb-4 sm:mb-6" data-testid="heading-main">
              <span className="block text-white">BUILD YOUR</span>
              <span className="block bg-gradient-to-r from-cyan-400 via-blue-500 to-cyan-400 bg-clip-text text-transparent animate-pulse">
                DREAMZ
              </span>
              <span className="block text-white">STACK POTIONS</span>
            </h1>
            
            <p className="text-sm xs:text-base sm:text-lg md:text-xl lg:text-2xl text-gray-400 mb-6 xs:mb-8 sm:mb-12 max-w-2xl mx-auto font-medium px-2 xs:px-4 leading-relaxed" data-testid="text-description">
              The AI-powered reputation protocol 🚀 Complete challenges, prove your worth, 
              and build unstoppable on-chain credibility
            </p>

            <div className="flex flex-col sm:flex-row gap-3 xs:gap-4 sm:gap-6 justify-center items-center mb-8 xs:mb-12 sm:mb-16 px-2 xs:px-4">
              <Button 
                onClick={handleLogin}
                size="lg"
                className="w-full max-w-xs sm:w-auto bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-black text-base xs:text-lg sm:text-xl px-6 xs:px-8 sm:px-12 py-3 xs:py-4 sm:py-6 rounded-xl shadow-2xl hover:shadow-cyan-500/25 transform hover:scale-105 transition-all duration-300"
                data-testid="button-connect-wallet"
              >
                <Zap className="w-4 h-4 xs:w-5 xs:h-5 sm:w-7 sm:h-7 mr-1 xs:mr-2 sm:mr-3" />
                CONNECT WALLET
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-2 xs:gap-4 sm:gap-6 lg:gap-8 max-w-2xl mx-auto px-2">
              <div className="text-center" data-testid="stat-users">
                <div className="text-xl xs:text-2xl sm:text-3xl lg:text-4xl font-black bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent mb-1 sm:mb-2">
                  {(stats as any)?.totalUsers || 0}
                </div>
                <div className="text-xs xs:text-xs sm:text-sm text-gray-500 font-bold uppercase tracking-wide">BUILDERS</div>
              </div>
              <div className="text-center" data-testid="stat-protocol">
                <div className="text-xl xs:text-2xl sm:text-3xl lg:text-4xl font-black bg-gradient-to-r from-blue-400 to-cyan-500 bg-clip-text text-transparent mb-1 sm:mb-2">
                  DREAMZ
                </div>
                <div className="text-xs xs:text-xs sm:text-sm text-gray-500 font-bold uppercase tracking-wide">PROTOCOL</div>
              </div>
              <div className="text-center" data-testid="stat-battles">
                <div className="text-xl xs:text-2xl sm:text-3xl lg:text-4xl font-black bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent mb-1 sm:mb-2">
                  {(stats as any)?.activeBattles || 0}
                </div>
                <div className="text-xs xs:text-xs sm:text-sm text-gray-500 font-bold uppercase tracking-wide">LIVE BATTLES</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="trending" className="py-12 sm:py-16 lg:py-24 bg-gradient-to-br from-black via-blue-950 to-black relative">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgwLCAxODMsIDIzNSwgMC4xKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-20"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-8 sm:mb-12 lg:mb-16">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 rounded-full px-4 sm:px-6 py-2 sm:py-3 mb-4 sm:mb-6" data-testid="badge-leaderboard">
              <Cpu className="w-3 h-3 text-cyan-400 animate-pulse" />
              <span className="text-cyan-400 font-black text-xs sm:text-sm tracking-wider">REPUTATION RANKINGS</span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black mb-4 sm:mb-6 text-white leading-tight" data-testid="heading-leaderboard">
              <span className="block">TOP</span>
              <span className="block bg-gradient-to-r from-cyan-400 via-blue-500 to-cyan-400 bg-clip-text text-transparent">
                BUILDERS
              </span>
              <span className="block text-white">STACKING DREAMZ</span>
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-gray-400 max-w-3xl mx-auto font-medium px-4" data-testid="text-leaderboard-description">
              The highest-reputation builders in the protocol 🚀 Compete, prove, and climb the ranks
            </p>
          </div>

          <Card className="bg-gradient-to-br from-gray-900 to-blue-950 border border-cyan-500/30 max-w-5xl mx-auto shadow-2xl shadow-cyan-500/10" data-testid="card-leaderboard">
            <CardContent className="p-4 sm:p-6 lg:p-10">
              {leaderboard && Array.isArray(leaderboard) && leaderboard.length > 0 ? (
                <div className="space-y-4 sm:space-y-6">
                  <div className="text-center mb-6 sm:mb-10">
                    <h3 className="text-xl sm:text-2xl lg:text-3xl font-black mb-2 sm:mb-3 text-white flex items-center justify-center gap-2" data-testid="heading-dreamz-rankings">
                      <Trophy className="w-6 h-6 text-cyan-400" />
                      DREAMZ RANKINGS
                    </h3>
                    <p className="text-gray-400 text-sm sm:text-base lg:text-lg font-medium px-2">Ranked by battles won, reputation earned, and on-chain credibility</p>
                  </div>
                  {leaderboard.slice(0, 5).map((user: any, index: number) => {
                    const isTopThree = index < 3;
                    const rankColors = ['from-cyan-500 to-blue-600', 'from-blue-400 to-cyan-500', 'from-cyan-600 to-blue-500'];
                    const rankIcons = ['🥇', '🥈', '🥉'];
                    
                    return (
                      <div 
                        key={user.id} 
                        className={`flex flex-col sm:flex-row items-center justify-between p-4 sm:p-6 lg:p-8 rounded-2xl border transition-all duration-300 hover:scale-105 ${
                          isTopThree 
                            ? 'bg-gradient-to-r from-cyan-500/10 to-blue-600/10 border-cyan-500/30 shadow-xl shadow-cyan-500/10' 
                            : 'bg-gray-900/50 border-gray-700'
                        }`}
                        data-testid={`leaderboard-rank-${index + 1}`}
                      >
                        <div className="flex items-center space-x-3 sm:space-x-4 lg:space-x-6 w-full sm:w-auto">
                          <div className={`flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 rounded-2xl font-black text-white text-lg sm:text-xl lg:text-2xl shadow-xl ${
                            isTopThree 
                              ? `bg-gradient-to-br ${rankColors[index]}` 
                              : 'bg-gradient-to-br from-gray-700 to-gray-800'
                          }`}>
                            {isTopThree ? rankIcons[index] : index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-black text-lg sm:text-xl lg:text-2xl text-white truncate" data-testid={`text-username-${index + 1}`}>{user.username || 'Anonymous Builder'}</div>
                            <div className="text-gray-400 font-bold text-sm sm:text-base lg:text-lg" data-testid={`text-battles-${index + 1}`}>{user.totalBattlesWon || 0} battles won</div>
                          </div>
                          {isTopThree && (
                            <Badge className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-3 py-1 sm:px-4 sm:py-2 lg:px-6 lg:py-3 font-black text-sm sm:text-base lg:text-lg" data-testid={`badge-top-${index + 1}`}>
                              <Sparkles className="w-4 h-4 mr-1" />
                              TOP
                            </Badge>
                          )}
                        </div>
                        <div className="text-center sm:text-right mt-4 sm:mt-0 w-full sm:w-auto">
                          <div className="font-black text-2xl sm:text-3xl bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent" data-testid={`text-dreamz-${index + 1}`}>{user.dreamzPoints || 0}</div>
                          <div className="text-gray-500 font-black text-xs sm:text-sm uppercase tracking-wide">DREAMZ POINTS</div>
                          <div className="text-cyan-400 font-black text-sm sm:text-base lg:text-lg flex items-center justify-center sm:justify-end gap-1" data-testid={`text-streak-${index + 1}`}>
                            <Zap className="w-4 h-4" />
                            {user.currentStreak || 0} day streak
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="w-32 h-32 mx-auto mb-8 bg-gradient-to-br from-cyan-400/20 to-blue-500/20 rounded-full flex items-center justify-center" data-testid="icon-empty-leaderboard">
                    <Trophy className="w-16 h-16 text-cyan-400 animate-pulse" />
                  </div>
                  <h3 className="text-4xl font-black mb-6 text-white" data-testid="heading-empty-leaderboard">BE THE FIRST BUILDER</h3>
                  <p className="text-xl text-gray-400 mb-8 max-w-md mx-auto font-medium">No builders yet... Will you be the first to build your dreamz and start the protocol?</p>
                  <Button 
                    onClick={handleLogin}
                    className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-black text-2xl px-16 py-6 rounded-2xl shadow-2xl hover:shadow-cyan-500/25 transform hover:scale-110 transition-all duration-300"
                    data-testid="button-start-journey"
                  >
                    <Zap className="w-8 h-8 mr-4" />
                    START YOUR JOURNEY
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      <footer className="bg-gradient-to-br from-black via-blue-950 to-black text-white py-20 border-t border-cyan-500/30" data-testid="footer-landing">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-12">
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <div className="text-3xl font-black bg-gradient-to-r from-cyan-400 via-blue-500 to-cyan-400 bg-clip-text text-transparent">
                  DREAMZ
                </div>
              </div>
              <p className="text-gray-400 font-medium leading-relaxed text-base">The AI-powered reputation protocol. Build your credibility, stack potions, and become legendary on-chain.</p>
              <div className="flex space-x-4">
                <a href="https://x.com/Dreamz_Protocol" target="_blank" rel="noopener noreferrer" className="w-12 h-12 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/30 hover:to-blue-500/30 border border-cyan-500/30 rounded-xl flex items-center justify-center transition-all group hover:scale-110" data-testid="link-twitter">
                  <svg className="w-6 h-6 text-cyan-400 group-hover:text-cyan-300" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </a>
                <a href="#" target="_blank" rel="noopener noreferrer" className="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 hover:from-blue-500/30 hover:to-cyan-500/30 border border-cyan-500/30 rounded-xl flex items-center justify-center transition-all group hover:scale-110" data-testid="link-docs">
                  <Brain className="w-6 h-6 text-blue-400 group-hover:text-blue-300" />
                </a>
              </div>
            </div>

            <div>
              <h4 className="font-black mb-6 text-cyan-400 text-lg uppercase tracking-wide">PROTOCOL</h4>
              <ul className="space-y-3 text-gray-400">
                <li><a href="#" className="hover:text-cyan-400 transition-colors font-medium text-base">Dashboard</a></li>
                <li><a href="#" className="hover:text-cyan-400 transition-colors font-medium text-base">Battles</a></li>
                <li><a href="#" className="hover:text-cyan-400 transition-colors font-medium text-base">Leaderboard</a></li>
                <li><a href="#" className="hover:text-cyan-400 transition-colors font-medium text-base">Lessons</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-black mb-6 text-blue-400 text-lg uppercase tracking-wide">REPUTATION</h4>
              <ul className="space-y-3 text-gray-400">
                <li><a href="#" className="hover:text-blue-400 transition-colors font-medium text-base">Build Profile</a></li>
                <li><a href="#" className="hover:text-blue-400 transition-colors font-medium text-base">Earn Dreamz</a></li>
                <li><a href="#" className="hover:text-blue-400 transition-colors font-medium text-base">Stack Potions</a></li>
                <li><a href="#" className="hover:text-blue-400 transition-colors font-medium text-base">FAQ</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-black mb-6 text-cyan-400 text-lg uppercase tracking-wide">RESOURCES</h4>
              <ul className="space-y-3 text-gray-400">
                <li><a href="#" className="hover:text-cyan-400 transition-colors font-medium text-base">Documentation</a></li>
                <li><a href="#" className="hover:text-cyan-400 transition-colors font-medium text-base">Developer Guide</a></li>
                <li><a href="#" className="hover:text-cyan-400 transition-colors font-medium text-base">Success Stories</a></li>
                <li><a href="#" className="hover:text-cyan-400 transition-colors font-medium text-base">Terms</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-cyan-500/30 mt-16 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-gray-500 font-medium text-base">&copy; 2025 DREAMZ Protocol. All rights reserved. Build your reputation on-chain.</p>
            </div>
          </div>
        </div>
      </footer>

      <AuthModal open={showAuthModal} onOpenChange={setShowAuthModal} />
    </div>
  );
}
