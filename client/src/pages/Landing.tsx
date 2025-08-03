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
  console.log("🏠 Landing component rendering...");
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
    console.log("🔄 Landing: showing loading state");
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-purple-900 to-pink-900 flex items-center justify-center">
        <div className="animate-pulse text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-600 rounded-lg flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
          <p className="text-white font-bold">Loading Aura...</p>
        </div>
      </div>
    );
  }

  console.log("🏠 Landing: showing main content");

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-purple-900 to-pink-900 text-white">
      {/* Mobile-Optimized Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-gradient-to-r from-black/90 via-purple-900/80 to-black/90 backdrop-blur-xl border-b-2 border-purple-500/50 shadow-2xl shadow-purple-500/30">
        <div className="w-full px-4 sm:px-6 lg:px-8 relative">
          {/* Subtle inner glow effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-pink-500/5 via-transparent to-cyan-500/5 rounded-lg"></div>
          <div className="flex items-center justify-between h-14 sm:h-16 w-full relative z-10">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="relative group">
                <div className="absolute -inset-2 bg-gradient-to-r from-pink-500/20 to-cyan-500/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <img 
                  src="/attached_assets/AURA PNG (1)_1749403291114.png" 
                  alt="Aura Logo" 
                  className="relative w-10 h-10 sm:w-12 sm:h-12 drop-shadow-2xl brightness-110 saturate-110 group-hover:scale-110 transition-transform"
                />
                <div className="absolute -top-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-cyan-400 rounded-full animate-ping shadow-lg shadow-cyan-400/50"></div>
              </div>
              <img 
                src="/attached_assets/FULL AURA (1)_1749403707745.png" 
                alt="Aura" 
                className="h-7 sm:h-8 w-auto drop-shadow-2xl brightness-110 saturate-110 hover:scale-105 transition-transform"
              />
            </div>
            


            <div className="flex items-center space-x-2 sm:space-x-4">
              <Badge className="hidden sm:flex bg-gradient-to-r from-pink-500 to-purple-600 text-white font-black text-xs px-2 sm:px-3 py-1 animate-bounce shadow-lg shadow-pink-500/30 hover:shadow-pink-500/50 transition-shadow">
                🔥 TRENDING
              </Badge>
              <Button onClick={handleLogin} className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-black px-3 sm:px-6 py-2 text-sm sm:text-base rounded-full shadow-xl shadow-pink-500/30 hover:shadow-pink-500/50 transform hover:scale-105 transition-all duration-300">
                GET AURA
              </Button>
            </div>
          </div>
        </div>
      </nav>
      {/* TikTok-Style Hero */}
      <section className="relative min-h-screen overflow-hidden">
        {/* Gradient Background (fallback if video fails) */}
        <div className="absolute inset-0 bg-gradient-to-br from-black via-purple-900 to-pink-900">
          {/* Optional video background */}
          <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover opacity-50"
            onError={(e) => {
              console.log("Video failed to load, using gradient background");
              e.currentTarget.style.display = 'none';
            }}
          >
            <source src="/attached_assets/Fun,_vibrant_scene_where_the_following_texts_pop_up__Challenge,_Learn,_Farm_Aura,_Earn._Using_Purple_seed2620036643_1754188951244.mp4" type="video/mp4" />
          </video>
          {/* Dark overlay for text readability */}
          <div className="absolute inset-0 bg-black/40"></div>
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
            <div className="grid grid-cols-3 gap-4 sm:gap-6 lg:gap-8 max-w-2xl mx-auto">
              <div className="text-center">
                <div className="text-2xl sm:text-3xl lg:text-4xl font-black bg-gradient-to-r from-pink-400 to-purple-500 bg-clip-text text-transparent mb-1 sm:mb-2">
                  {(stats as any)?.totalUsers || 0}
                </div>
                <div className="text-xs sm:text-sm text-gray-400 font-bold uppercase tracking-wide">LEGENDS</div>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl lg:text-4xl font-black bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent mb-1 sm:mb-2">
                  AURA
                </div>
                <div className="text-xs sm:text-sm text-gray-400 font-bold uppercase tracking-wide">STATUS</div>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl lg:text-4xl font-black bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent mb-1 sm:mb-2">
                  {(stats as any)?.activeBattles || 0}
                </div>
                <div className="text-xs sm:text-sm text-gray-400 font-bold uppercase tracking-wide">LIVE NOW</div>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* Trending Creators */}
      <section id="trending" className="py-12 sm:py-16 lg:py-24 bg-gradient-to-br from-cyan-50 via-blue-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12 lg:mb-16">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full px-4 sm:px-6 py-2 sm:py-3 mb-4 sm:mb-6 animate-pulse">
              <div className="w-2 h-2 sm:w-3 sm:h-3 bg-white rounded-full animate-ping"></div>
              <span className="text-white font-black text-xs sm:text-sm tracking-wider">TRENDING NOW</span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black mb-4 sm:mb-6 text-gray-900 leading-tight">
              <span className="block">TOP</span>
              <span className="block bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 bg-clip-text text-transparent animate-pulse">
                CREATORS
              </span>
              <span className="block text-gray-900">FARMING AURA</span>
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-gray-700 max-w-3xl mx-auto font-medium px-4">
              The hottest creators breaking the internet right now 🔥 See who's trending and climb the ranks to join them
            </p>
          </div>

          <Card className="bg-white border-2 border-cyan-200 max-w-5xl mx-auto shadow-2xl">
            <CardContent className="p-4 sm:p-6 lg:p-10">
              {leaderboard && Array.isArray(leaderboard) && leaderboard.length > 0 ? (
                <div className="space-y-4 sm:space-y-6">
                  <div className="text-center mb-6 sm:mb-10">
                    <h3 className="text-xl sm:text-2xl lg:text-3xl font-black mb-2 sm:mb-3 text-gray-900">AURA RANKINGS 🔥</h3>
                    <p className="text-gray-700 text-sm sm:text-base lg:text-lg font-medium px-2">Ranked by aura moments, fan engagement, and legendary status achieved</p>
                  </div>
                  {leaderboard.slice(0, 5).map((user: any, index: number) => {
                    const isTopThree = index < 3;
                    const rankColors = ['from-pink-500 to-purple-600', 'from-cyan-400 to-blue-500', 'from-orange-500 to-red-500'];
                    const rankIcons = ['🔥', '⭐', '💎'];
                    
                    return (
                      <div key={user.id} className={`flex flex-col sm:flex-row items-center justify-between p-4 sm:p-6 lg:p-8 rounded-2xl sm:rounded-3xl border-2 transition-all duration-300 hover:scale-105 ${
                        isTopThree 
                          ? 'bg-gradient-to-r from-cyan-50 to-purple-50 border-cyan-300 shadow-xl' 
                          : 'bg-gray-50 border-gray-200'
                      }`}>
                        <div className="flex items-center space-x-3 sm:space-x-4 lg:space-x-6 w-full sm:w-auto">
                          <div className={`flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 rounded-2xl sm:rounded-3xl font-black text-white text-lg sm:text-xl lg:text-2xl shadow-xl animate-pulse ${
                            isTopThree 
                              ? `bg-gradient-to-br ${rankColors[index]}` 
                              : 'bg-gradient-to-br from-gray-500 to-gray-600'
                          }`}>
                            {isTopThree ? rankIcons[index] : index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-black text-lg sm:text-xl lg:text-2xl text-gray-900 truncate">{user.username || 'Aura Creator'}</div>
                            <div className="text-gray-700 font-bold text-sm sm:text-base lg:text-lg">{user.totalBattlesWon || 0} aura moments</div>
                          </div>
                          {isTopThree && (
                            <Badge className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-3 py-1 sm:px-4 sm:py-2 lg:px-6 lg:py-3 font-black text-sm sm:text-base lg:text-lg animate-bounce">
                              AURA
                            </Badge>
                          )}
                        </div>
                        <div className="text-center sm:text-right mt-4 sm:mt-0 w-full sm:w-auto">
                          <div className="font-black text-2xl sm:text-3xl bg-gradient-to-r from-cyan-500 to-purple-600 bg-clip-text text-transparent">{user.auraPoints || 0}</div>
                          <div className="text-gray-500 font-black text-xs sm:text-sm uppercase tracking-wide">AURA POINTS</div>
                          <div className="text-pink-600 font-black text-sm sm:text-base lg:text-lg">{user.currentStreak || 0} day streak</div>
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
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <img 
                    src="/attached_assets/AURA PNG (1)_1749403291114.png" 
                    alt="Aura Logo" 
                    className="w-16 h-16 drop-shadow-2xl brightness-110 saturate-110 animate-pulse"
                  />
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-cyan-400 rounded-full animate-ping"></div>
                </div>
                <img 
                  src="/attached_assets/FULL AURA (1)_1749403707745.png" 
                  alt="Aura" 
                  className="h-12 w-auto drop-shadow-2xl brightness-110 saturate-110"
                />
              </div>
              <p className="text-gray-300 font-bold leading-relaxed text-lg">The aura app that's breaking the internet. Build your brand, go aura, and become legendary.</p>
              <div className="flex space-x-4">
                <a href="https://x.com/Aura_0x" target="_blank" rel="noopener noreferrer" className="w-14 h-14 bg-gradient-to-br from-pink-500/20 to-purple-500/20 hover:from-pink-500/30 hover:to-purple-500/30 rounded-2xl flex items-center justify-center transition-all group hover:scale-110">
                  <svg className="w-7 h-7 text-pink-400 group-hover:text-pink-300" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </a>
                <a href="https://aura-13.gitbook.io/aura/" target="_blank" rel="noopener noreferrer" className="w-14 h-14 bg-gradient-to-br from-purple-500/20 to-cyan-500/20 hover:from-purple-500/30 hover:to-cyan-500/30 rounded-2xl flex items-center justify-center transition-all group hover:scale-110">
                  <svg className="w-7 h-7 text-purple-400 group-hover:text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
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
