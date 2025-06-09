import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Clock, Star, Users, BookOpen, Play, CheckCircle, TrendingUp, Award, Target } from "lucide-react";
import AuthModal from "@/components/AuthModal";

export default function Landing() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Fetch real-time platform statistics
  const { data: stats } = useQuery({
    queryKey: ['/api/stats'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: leaderboard } = useQuery({
    queryKey: ['/api/leaderboard'],
    refetchInterval: 60000, // Refresh every minute
  });

  const { data: activeBattles } = useQuery({
    queryKey: ['/api/battles'],
    refetchInterval: 15000, // Refresh every 15 seconds
  });

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // User is on landing page, this is expected
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse">
          <div className="w-16 h-16 bg-primary rounded-lg flex items-center justify-center">
            <BookOpen className="w-8 h-8 text-primary-foreground" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Mobile-Optimized Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-black/80 backdrop-blur-xl border-b border-purple-500/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="relative">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg animate-pulse">
                  <Trophy className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-cyan-400 rounded-full animate-ping"></div>
              </div>
              <span className="text-xl sm:text-2xl font-black bg-gradient-to-r from-pink-400 to-purple-500 bg-clip-text text-transparent">
                AURA
              </span>
            </div>
            


            <div className="flex items-center space-x-2 sm:space-x-4">
              <Badge className="hidden sm:flex bg-gradient-to-r from-pink-500 to-purple-600 text-white font-black text-xs px-2 sm:px-3 py-1 animate-bounce">
                🔥 TRENDING
              </Badge>
              <Button onClick={handleLogin} className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-black px-3 sm:px-6 py-2 text-sm sm:text-base rounded-full shadow-lg hover:shadow-pink-500/25 transform hover:scale-105 transition-all">
                GET AURA
              </Button>
            </div>
          </div>
        </div>
      </nav>
      {/* TikTok-Style Hero */}
      <section className="relative min-h-screen bg-gradient-to-br from-black via-gray-900 to-purple-900 overflow-hidden">
        {/* TikTok Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute top-32 left-1/4 w-64 h-64 bg-gradient-to-br from-pink-500/30 to-purple-500/30 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-32 right-1/4 w-80 h-80 bg-gradient-to-br from-cyan-400/20 to-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-purple-600/10 to-pink-600/10 rounded-full blur-3xl animate-ping"></div>
        </div>
        
        <div className="relative z-10 min-h-screen flex items-center justify-center px-4 sm:px-6 pt-16 sm:pt-0">
          <div className="text-center max-w-4xl mx-auto">
            {/* Mobile-Optimized Badge */}
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full px-4 sm:px-6 py-2 sm:py-3 mb-6 sm:mb-8 animate-bounce">
              <div className="w-2 h-2 sm:w-3 sm:h-3 bg-white rounded-full animate-ping"></div>
              <span className="text-white font-black text-xs sm:text-sm tracking-wider">GROW YOUR AURA</span>
            </div>
            
            {/* Mobile-Optimized Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-8xl xl:text-9xl font-black leading-none mb-4 sm:mb-6">
              <span className="block text-white">BUILD YOUR</span>
              <span className="block bg-gradient-to-r from-pink-400 via-purple-500 to-cyan-400 bg-clip-text text-transparent animate-pulse">
                AURA
              </span>
              <span className="block text-white">GO AURA</span>
            </h1>
            
            {/* Mobile-Optimized Description */}
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-300 mb-8 sm:mb-12 max-w-2xl mx-auto font-medium px-4">
              The app that's breaking the internet 🔥 Complete challenges, flex your wins, 
              and build legendary status that everyone talks about
            </p>

            {/* Mobile-Optimized Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center mb-12 sm:mb-16 px-4">
              <Button 
                onClick={handleLogin}
                size="lg"
                className="w-full sm:w-auto bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-black text-lg sm:text-xl px-8 sm:px-12 py-4 sm:py-6 rounded-2xl shadow-2xl hover:shadow-pink-500/25 transform hover:scale-105 transition-all duration-300 animate-pulse"
              >
                <Trophy className="w-5 h-5 sm:w-7 sm:h-7 mr-2 sm:mr-3" />
                GET AURA NOW
              </Button>
              <Button 
                variant="outline" 
                onClick={handleWatchDemo}
                size="lg"
                className="w-full sm:w-auto border-3 border-cyan-400 text-cyan-400 hover:bg-cyan-400/10 font-black text-lg sm:text-xl px-6 sm:px-10 py-4 sm:py-6 rounded-2xl backdrop-blur-sm"
              >
                <Play className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3" />
                SEE THE HYPE
              </Button>
            </div>

            {/* Viral stats */}
            <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto">
              <div className="text-center">
                <div className="text-4xl font-black bg-gradient-to-r from-pink-400 to-purple-500 bg-clip-text text-transparent mb-2">
                  {(stats as any)?.totalUsers || 0}
                </div>
                <div className="text-sm text-gray-400 font-bold uppercase tracking-wide">LEGENDS</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-black bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent mb-2">
                  AURA
                </div>
                <div className="text-sm text-gray-400 font-bold uppercase tracking-wide">STATUS</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-black bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent mb-2">
                  {(stats as any)?.activeBattles || 0}
                </div>
                <div className="text-sm text-gray-400 font-bold uppercase tracking-wide">LIVE NOW</div>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* Trending Creators */}
      <section id="trending" className="py-24 bg-gradient-to-br from-cyan-50 via-blue-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full px-6 py-3 mb-6 animate-pulse">
              <div className="w-3 h-3 bg-white rounded-full animate-ping"></div>
              <span className="text-white font-black text-sm tracking-wider">TRENDING NOW</span>
            </div>
            <h2 className="text-5xl md:text-6xl font-black mb-6 text-gray-900">
              TOP
              <span className="block bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 bg-clip-text text-transparent animate-pulse">
                CREATORS
              </span>
              <span className="block text-gray-900">FARMING AURA</span>
            </h2>
            <p className="text-xl text-gray-700 max-w-3xl mx-auto font-medium">
              The hottest creators breaking the internet right now 🔥 See who's trending and climb the ranks to join them
            </p>
          </div>

          <Card className="bg-white border-2 border-cyan-200 max-w-5xl mx-auto shadow-2xl">
            <CardContent className="p-10">
              {leaderboard && Array.isArray(leaderboard) && leaderboard.length > 0 ? (
                <div className="space-y-6">
                  <div className="text-center mb-10">
                    <h3 className="text-3xl font-black mb-3 text-gray-900">AURA RANKINGS 🔥</h3>
                    <p className="text-gray-700 text-lg font-medium">Ranked by aura moments, fan engagement, and legendary status achieved</p>
                  </div>
                  {leaderboard.slice(0, 5).map((user: any, index: number) => {
                    const isTopThree = index < 3;
                    const rankColors = ['from-pink-500 to-purple-600', 'from-cyan-400 to-blue-500', 'from-orange-500 to-red-500'];
                    const rankIcons = ['🔥', '⭐', '💎'];
                    
                    return (
                      <div key={user.id} className={`flex items-center justify-between p-8 rounded-3xl border-2 transition-all duration-300 hover:scale-105 ${
                        isTopThree 
                          ? 'bg-gradient-to-r from-cyan-50 to-purple-50 border-cyan-300 shadow-xl' 
                          : 'bg-gray-50 border-gray-200'
                      }`}>
                        <div className="flex items-center space-x-6">
                          <div className={`flex items-center justify-center w-20 h-20 rounded-3xl font-black text-white text-2xl shadow-xl animate-pulse ${
                            isTopThree 
                              ? `bg-gradient-to-br ${rankColors[index]}` 
                              : 'bg-gradient-to-br from-gray-500 to-gray-600'
                          }`}>
                            {isTopThree ? rankIcons[index] : index + 1}
                          </div>
                          <div>
                            <div className="font-black text-2xl text-gray-900">{user.username || 'Aura Creator'}</div>
                            <div className="text-gray-700 font-bold text-lg">{user.totalBattlesWon || 0} aura moments</div>
                          </div>
                          {isTopThree && (
                            <Badge className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-3 font-black text-lg animate-bounce">
                              AURA
                            </Badge>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="font-black text-3xl bg-gradient-to-r from-cyan-500 to-purple-600 bg-clip-text text-transparent">{user.auraPoints || 0}</div>
                          <div className="text-gray-500 font-black text-sm uppercase tracking-wide">AURA POINTS</div>
                          <div className="text-pink-600 font-black text-lg">{user.currentStreak || 0} day streak</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="w-32 h-32 mx-auto mb-8 bg-gradient-to-br from-cyan-400/20 to-purple-500/20 rounded-full flex items-center justify-center animate-pulse">
                    <Trophy className="w-16 h-16 text-cyan-500" />
                  </div>
                  <h3 className="text-4xl font-black mb-6 text-gray-900">BE THE FIRST TO GO AURA</h3>
                  <p className="text-xl text-gray-700 mb-8 max-w-md mx-auto font-medium">No aura creators yet... Will you be the first to break the internet and start the trend?</p>
                  <Button 
                    onClick={handleLogin}
                    className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white font-black text-2xl px-16 py-6 rounded-3xl shadow-2xl hover:shadow-cyan-500/25 transform hover:scale-110 transition-all duration-300 animate-pulse"
                  >
                    <Trophy className="w-8 h-8 mr-4" />
                    START YOUR AURA JOURNEY
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
      {/* TikTok-Style Footer */}
      <footer className="bg-gradient-to-br from-black via-purple-900 to-pink-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-12">
            <div className="space-y-6">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-xl animate-pulse">
                    <Trophy className="w-8 h-8 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-cyan-400 rounded-full animate-ping"></div>
                </div>
                <span className="text-4xl font-black bg-gradient-to-r from-pink-400 via-purple-500 to-cyan-400 bg-clip-text text-transparent">
                  AURA
                </span>
              </div>
              <p className="text-gray-300 font-bold leading-relaxed text-lg">The aura app that's breaking the internet. Build your brand, go aura, and become legendary.</p>
              <div className="flex space-x-4">
                <a href="https://x.com/Aura_0x" target="_blank" rel="noopener noreferrer" className="w-14 h-14 bg-gradient-to-br from-pink-500/20 to-purple-500/20 hover:from-pink-500/30 hover:to-purple-500/30 rounded-2xl flex items-center justify-center transition-all group hover:scale-110">
                  <svg className="w-7 h-7 text-pink-400 group-hover:text-pink-300" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </a>
              </div>
            </div>

            <div>
              <h4 className="font-black mb-6 text-pink-400 text-xl uppercase tracking-wide">AURA FEATURES</h4>
              <ul className="space-y-4 text-gray-300">
                <li><a href="#" className="hover:text-pink-400 transition-colors font-bold text-lg">Creator Dashboard</a></li>
                <li><a href="#" className="hover:text-pink-400 transition-colors font-bold text-lg">Aura Challenges</a></li>
                <li><a href="#" className="hover:text-pink-400 transition-colors font-bold text-lg">Live Battles</a></li>
                <li><a href="#" className="hover:text-pink-400 transition-colors font-bold text-lg">Trending Page</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-black mb-6 text-purple-400 text-xl uppercase tracking-wide">CREATOR CIRCLE</h4>
              <ul className="space-y-4 text-gray-300">
                <li><a href="#" className="hover:text-purple-400 transition-colors font-bold text-lg">Creator Profiles</a></li>
                <li><a href="#" className="hover:text-purple-400 transition-colors font-bold text-lg">Brand Deals</a></li>
                <li><a href="#" className="hover:text-purple-400 transition-colors font-bold text-lg">Creator Support</a></li>
                <li><a href="#" className="hover:text-purple-400 transition-colors font-bold text-lg">Aura FAQ</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-black mb-6 text-cyan-400 text-xl uppercase tracking-wide">GO AURA</h4>
              <ul className="space-y-4 text-gray-300">
                <li><a href="#" className="hover:text-cyan-400 transition-colors font-bold text-lg">Aura Guide</a></li>
                <li><a href="#" className="hover:text-cyan-400 transition-colors font-bold text-lg">Success Stories</a></li>
                <li><a href="#" className="hover:text-cyan-400 transition-colors font-bold text-lg">Creator Tips</a></li>
                <li><a href="#" className="hover:text-cyan-400 transition-colors font-bold text-lg">Terms</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-pink-500/30 mt-16 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-gray-400 font-bold text-lg">&copy; 2024 AURA. All rights reserved. Where legends go aura.</p>
            </div>
          </div>
        </div>
      </footer>
      {/* Auth Modal */}
      <AuthModal open={showAuthModal} onOpenChange={setShowAuthModal} />
    </div>
  );
}
