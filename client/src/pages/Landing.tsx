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
            
            <div className="hidden lg:flex items-center space-x-8">
              <a href="#viral" className="text-gray-300 hover:text-pink-400 transition-colors font-bold text-sm uppercase tracking-wide">Viral Content</a>
              <a href="#battles" className="text-gray-300 hover:text-purple-400 transition-colors font-bold text-sm uppercase tracking-wide">Live Battles</a>
              <a href="#trending" className="text-gray-300 hover:text-cyan-400 transition-colors font-bold text-sm uppercase tracking-wide">Trending Now</a>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-4">
              <Badge className="hidden sm:flex bg-gradient-to-r from-pink-500 to-purple-600 text-white font-black text-xs px-2 sm:px-3 py-1 animate-bounce">
                🔥 TRENDING
              </Badge>
              <Button onClick={handleLogin} className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-black px-3 sm:px-6 py-2 text-sm sm:text-base rounded-full shadow-lg hover:shadow-pink-500/25 transform hover:scale-105 transition-all">
                GET VIRAL
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
              <span className="block text-white">GO VIRAL</span>
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
                GET FAMOUS NOW
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
                  VIRAL
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
      {/* Viral Content Section */}
      <section id="viral" className="py-24 bg-gradient-to-br from-pink-50 via-purple-50 to-cyan-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full px-6 py-3 mb-6 animate-pulse">
              <div className="w-3 h-3 bg-white rounded-full animate-ping"></div>
              <span className="text-white font-black text-sm tracking-wider">VIRAL FEATURES</span>
            </div>
            <h2 className="text-5xl md:text-6xl font-black mb-6 text-gray-900">
              GET READY TO
              <span className="block bg-gradient-to-r from-pink-500 via-purple-600 to-cyan-500 bg-clip-text text-transparent">
                BREAK THE INTERNET
              </span>
            </h2>
            <p className="text-xl text-gray-700 max-w-3xl mx-auto font-medium">
              Features that make you famous 🔥 Build your brand, go viral, and become the legend everyone follows
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Daily Challenges */}
            <Card className="relative bg-gradient-to-br from-white to-pink-50 border-2 border-pink-200 hover:shadow-2xl hover:shadow-pink-500/20 transition-all duration-500 hover:-translate-y-2 group overflow-hidden">
              <div className="absolute top-0 right-0 bg-gradient-to-br from-pink-500 to-purple-600 text-white px-4 py-2 text-xs font-black animate-pulse">
                🔥 HOT
              </div>
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-600 rounded-3xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300 animate-pulse">
                  <Target className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-black mb-4 text-gray-900">Daily Viral Challenges</h3>
                <p className="text-gray-700 mb-6 font-medium">Complete trending challenges that everyone's talking about. Get featured, gain followers, and build your reputation.</p>
                
                <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-2xl p-4 border border-pink-200">
                  <div className="text-xs text-pink-700 font-black mb-2 uppercase tracking-wide">VIRAL REWARDS</div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-700 font-bold">Fame Points</span>
                      <span className="text-pink-600 font-black">+1,000 FP</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700 font-bold">Viral Streak</span>
                      <span className="text-purple-600 font-black">+1 Day</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Analytics Dashboard */}
            <Card className="relative bg-gradient-to-br from-white to-purple-50 border-2 border-purple-200 hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-500 hover:-translate-y-2 group overflow-hidden">
              <div className="absolute top-0 right-0 bg-gradient-to-br from-purple-600 to-indigo-600 text-white px-4 py-2 text-xs font-black animate-bounce">
                💎 PREMIUM
              </div>
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-3xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <TrendingUp className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-black mb-4 text-gray-900">Viral Analytics</h3>
                <p className="text-gray-700 mb-6 font-medium">Track your viral moments in real-time. See your influence grow and monitor your legendary status across all platforms.</p>
                
                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl p-4 border border-purple-200">
                  <div className="text-xs text-purple-700 font-black mb-2 uppercase tracking-wide">INFLUENCER METRICS</div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-700 font-bold">Viral Score</span>
                      <span className="text-purple-600 font-black">Live</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700 font-bold">Legend Badges</span>
                      <span className="text-indigo-600 font-black">Collectible</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Creator Community */}
            <Card className="relative bg-gradient-to-br from-white to-cyan-50 border-2 border-cyan-200 hover:shadow-2xl hover:shadow-cyan-500/20 transition-all duration-500 hover:-translate-y-2 group overflow-hidden">
              <div className="absolute top-0 right-0 bg-gradient-to-br from-cyan-500 to-blue-600 text-white px-4 py-2 text-xs font-black">
                👑 VIP
              </div>
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-3xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300 animate-pulse">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-black mb-4 text-gray-900">Creator Circle</h3>
                <p className="text-gray-700 mb-6 font-medium">Join the most exclusive creator community. Collaborate with top influencers and build your empire together.</p>
                
                <div className="space-y-3 text-sm">
                  <div className="flex items-center text-gray-700">
                    <CheckCircle className="w-4 h-4 mr-3 text-cyan-600" />
                    <span className="font-bold">Private creator groups</span>
                  </div>
                  <div className="flex items-center text-gray-700">
                    <CheckCircle className="w-4 h-4 mr-3 text-cyan-600" />
                    <span className="font-bold">Brand collaboration deals</span>
                  </div>
                  <div className="flex items-center text-gray-700">
                    <CheckCircle className="w-4 h-4 mr-3 text-cyan-600" />
                    <span className="font-bold">Verified influencer status</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
      {/* Live Battles - TikTok Style */}
      <section id="battles" className="py-24 bg-gradient-to-br from-black via-purple-900 to-pink-900 text-white relative overflow-hidden">
        {/* TikTok Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-96 h-96 bg-gradient-to-br from-pink-500/30 to-purple-500/30 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-80 h-80 bg-gradient-to-br from-cyan-400/20 to-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-purple-600/10 to-pink-600/10 rounded-full blur-3xl animate-ping"></div>
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-red-500 to-pink-600 rounded-full px-6 py-3 mb-6 animate-bounce">
              <div className="w-3 h-3 bg-white rounded-full animate-ping"></div>
              <span className="text-white font-black text-sm tracking-wider">LIVE BATTLES</span>
            </div>
            <h2 className="text-5xl md:text-6xl font-black mb-6">
              EPIC
              <span className="block bg-gradient-to-r from-pink-400 via-purple-500 to-cyan-400 bg-clip-text text-transparent animate-pulse">
                SHOWDOWNS
              </span>
              <span className="block text-white">GOING VIRAL</span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto font-medium">
              Real battles, real drama, real fame 🔥 Watch legends clash live and see who becomes the next viral sensation
            </p>
          </div>

          {/* Active Battles Display */}
          <Card className="bg-gradient-to-br from-black/80 to-purple-900/80 border-2 border-pink-500/30 max-w-5xl mx-auto shadow-2xl backdrop-blur-sm">
            <CardContent className="p-10">
              {activeBattles && Array.isArray(activeBattles) && activeBattles.length > 0 ? (
                <div className="space-y-8">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-3xl font-black text-white">LIVE NOW 🔴</h3>
                    <Badge className="bg-gradient-to-r from-red-500 to-pink-600 text-white px-6 py-3 text-lg font-black animate-pulse">
                      <div className="w-3 h-3 bg-white rounded-full mr-2 animate-ping"></div>
                      {activeBattles.length} VIRAL BATTLES
                    </Badge>
                  </div>
                  {activeBattles.slice(0, 3).map((battle: any) => (
                    <div key={battle.id} className="bg-gradient-to-r from-purple-800/50 to-pink-800/50 rounded-3xl p-8 border border-pink-500/30 hover:border-pink-500/60 transition-all duration-300 hover:scale-105">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-8">
                          <div className="text-2xl font-black text-pink-400">{battle.challengerName || 'Viral Star'}</div>
                          <div className="text-center">
                            <div className="text-white font-black text-2xl animate-bounce">⚡ VS ⚡</div>
                            <div className="text-xs text-gray-400 font-black uppercase tracking-wide">VIRAL CLASH</div>
                          </div>
                          <div className="text-2xl font-black text-cyan-400">{battle.opponentName || 'Rising Legend'}</div>
                        </div>
                        <Badge className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-8 py-4 text-xl font-black rounded-2xl animate-pulse">
                          🏆 {battle.stakeAmount || 0} FAME
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="w-32 h-32 mx-auto mb-8 bg-gradient-to-br from-pink-500/20 to-purple-500/20 rounded-full flex items-center justify-center animate-pulse">
                    <Trophy className="w-16 h-16 text-pink-400" />
                  </div>
                  <h3 className="text-4xl font-black mb-6 text-white">NO BATTLES RIGHT NOW</h3>
                  <p className="text-xl text-gray-300 mb-8 max-w-md mx-auto font-medium">The stage is empty... Will you be the first to start the next viral battle that breaks the internet?</p>
                  <Button 
                    onClick={handleLogin}
                    className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-black text-2xl px-16 py-6 rounded-3xl shadow-2xl hover:shadow-pink-500/25 transform hover:scale-110 transition-all duration-300 animate-pulse"
                  >
                    <Trophy className="w-8 h-8 mr-4" />
                    START VIRAL BATTLE
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
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
              <span className="block text-gray-900">GOING VIRAL</span>
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
                    <h3 className="text-3xl font-black mb-3 text-gray-900">VIRAL RANKINGS 🔥</h3>
                    <p className="text-gray-700 text-lg font-medium">Ranked by viral moments, fan engagement, and legendary status achieved</p>
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
                            <div className="font-black text-2xl text-gray-900">{user.username || 'Viral Creator'}</div>
                            <div className="text-gray-700 font-bold text-lg">{user.totalBattlesWon || 0} viral moments</div>
                          </div>
                          {isTopThree && (
                            <Badge className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-3 font-black text-lg animate-bounce">
                              VIRAL
                            </Badge>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="font-black text-3xl bg-gradient-to-r from-cyan-500 to-purple-600 bg-clip-text text-transparent">{user.auraPoints || 0}</div>
                          <div className="text-gray-500 font-black text-sm uppercase tracking-wide">FAME POINTS</div>
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
                  <h3 className="text-4xl font-black mb-6 text-gray-900">BE THE FIRST TO GO VIRAL</h3>
                  <p className="text-xl text-gray-700 mb-8 max-w-md mx-auto font-medium">No viral creators yet... Will you be the first to break the internet and start the trend?</p>
                  <Button 
                    onClick={handleLogin}
                    className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white font-black text-2xl px-16 py-6 rounded-3xl shadow-2xl hover:shadow-cyan-500/25 transform hover:scale-110 transition-all duration-300 animate-pulse"
                  >
                    <Trophy className="w-8 h-8 mr-4" />
                    START YOUR VIRAL JOURNEY
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
              <p className="text-gray-300 font-bold leading-relaxed text-lg">The viral app that's breaking the internet. Build your brand, go viral, and become legendary.</p>
              <div className="flex space-x-4">
                <a href="#" className="w-14 h-14 bg-gradient-to-br from-pink-500/20 to-purple-500/20 hover:from-pink-500/30 hover:to-purple-500/30 rounded-2xl flex items-center justify-center transition-all group hover:scale-110">
                  <svg className="w-7 h-7 text-pink-400 group-hover:text-pink-300" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </a>
                <a href="#" className="w-14 h-14 bg-gradient-to-br from-purple-500/20 to-cyan-500/20 hover:from-purple-500/30 hover:to-cyan-500/30 rounded-2xl flex items-center justify-center transition-all group hover:scale-110">
                  <svg className="w-7 h-7 text-purple-400 group-hover:text-purple-300" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>
                <a href="#" className="w-14 h-14 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/30 hover:to-blue-500/30 rounded-2xl flex items-center justify-center transition-all group hover:scale-110">
                  <svg className="w-7 h-7 text-cyan-400 group-hover:text-cyan-300" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.89 2.718.099.118.112.222.085.343-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.750-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24.009 12.017 24.009c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641.001 12.017.001z"/>
                  </svg>
                </a>
              </div>
            </div>

            <div>
              <h4 className="font-black mb-6 text-pink-400 text-xl uppercase tracking-wide">VIRAL FEATURES</h4>
              <ul className="space-y-4 text-gray-300">
                <li><a href="#" className="hover:text-pink-400 transition-colors font-bold text-lg">Creator Dashboard</a></li>
                <li><a href="#" className="hover:text-pink-400 transition-colors font-bold text-lg">Viral Challenges</a></li>
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
                <li><a href="#" className="hover:text-purple-400 transition-colors font-bold text-lg">Fame FAQ</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-black mb-6 text-cyan-400 text-xl uppercase tracking-wide">GO VIRAL</h4>
              <ul className="space-y-4 text-gray-300">
                <li><a href="#" className="hover:text-cyan-400 transition-colors font-bold text-lg">Viral Guide</a></li>
                <li><a href="#" className="hover:text-cyan-400 transition-colors font-bold text-lg">Success Stories</a></li>
                <li><a href="#" className="hover:text-cyan-400 transition-colors font-bold text-lg">Creator Tips</a></li>
                <li><a href="#" className="hover:text-cyan-400 transition-colors font-bold text-lg">Terms</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-pink-500/30 mt-16 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-gray-400 font-bold text-lg">&copy; 2024 AURA. All rights reserved. Where legends go viral.</p>
              <Badge className="bg-gradient-to-r from-pink-500 to-purple-600 text-white border-0 px-8 py-3 font-black text-lg mt-6 md:mt-0 animate-pulse">
                🔥 TRENDING APP
              </Badge>
            </div>
          </div>
        </div>
      </footer>
      {/* Auth Modal */}
      <AuthModal open={showAuthModal} onOpenChange={setShowAuthModal} />
    </div>
  );
}
