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
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="relative">
                <img 
                  src="/attached_assets/AURA PNG (1)_1749403291114.png" 
                  alt="Aura Logo" 
                  className="w-10 h-10 sm:w-12 sm:h-12 drop-shadow-lg brightness-110 saturate-110 animate-pulse"
                />
                <div className="absolute -top-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-cyan-400 rounded-full animate-ping"></div>
              </div>
              <img 
                src="/attached_assets/FULL AURA (1)_1749403707745.png" 
                alt="Aura" 
                className="h-7 sm:h-8 w-auto drop-shadow-lg brightness-110 saturate-110"
              />
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
                  <svg className="w-7 h-7 text-purple-400 group-hover:text-purple-300" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M10.802 17.77a.703.703 0 11-.002 1.406.703.703 0 01.002-1.406m-1.267-.698a.703.703 0 11-.002 1.406.703.703 0 01.002-1.406m2.813-.698a.703.703 0 11-.002 1.406.703.703 0 01.002-1.406M15.73 15.31c.248-.007.52-.007.772 0 .252.008.513.015.756.037.243.023.477.052.693.087.216.035.427.075.622.119.195.044.375.092.54.145.165.053.32.111.462.175.142.064.277.133.402.209.125.076.244.158.354.246.11.088.215.182.31.282.095.1.184.206.261.318.077.112.147.23.209.353.062.123.119.252.167.386.048.134.09.274.124.417.034.143.063.29.085.44.022.15.04.303.052.457.012.154.02.311.023.468.003.157.002.315-.002.473-.004.158-.013.317-.026.475-.013.158-.031.316-.053.474-.022.158-.049.316-.08.473-.031.157-.067.315-.107.471-.04.156-.085.312-.133.467-.048.155-.1.31-.156.463-.056.153-.116.305-.179.456-.063.151-.13.301-.2.45-.07.149-.143.296-.219.442-.076.146-.155.291-.236.434-.081.143-.165.285-.251.425-.086.14-.174.279-.264.416-.09.137-.182.273-.276.407-.094.134-.19.267-.287.398.138-.079.29-.149.446-.208.156-.059.317-.107.48-.144.163-.037.33-.063.498-.077.168-.014.338-.016.508-.005.17.011.341.033.511.066.17.033.34.077.508.132.168.055.335.121.499.197.164.076.327.162.486.258.159.096.315.202.468.318.153.116.302.242.447.378.145.136.286.282.423.438.137.156.27.322.399.498.129.176.253.362.372.558.119.196.233.402.341.618.108.216.211.442.307.678.096.236.187.482.271.738.084.256.162.522.233.798.071.276.136.562.194.858.058.296.109.602.153.918.044.316.081.642.11.978.029.336.051.682.065 1.038.014.356.02.722.019 1.098-.001.376-.01.762-.026 1.158-.016.396-.04.802-.071 1.218-.031.416-.069.842-.114 1.278-.045.436-.097.882-.156 1.338-.059.456-.125.922-.198 1.398-.073.476-.153.962-.239 1.458-.086.496-.179.002-.279 1.518-.1.516-.207 1.042-.321 1.578-.114.536-.235 1.082-.363 1.638-.128.556-.263 1.122-.405 1.698-.142.576-.291 1.162-.447 1.758-.156.596-.319 1.202-.489 1.818-.17.616-.347 1.242-.531 1.878-.184.636-.375 1.282-.573 1.938-.198.656-.403 1.322-.615 1.998-.212.676-.431 1.362-.657 2.058-.226.696-.459 1.402-.699 2.118-.24.716-.487 1.442-.741 2.178-.254.736-.515 1.482-.783 2.238-.268.756-.543 1.522-.825 2.298-.282.776-.571 1.562-.867 2.358-.296.796-.599 1.602-.909 2.418-.31.816-.627 1.642-.951 2.478-.324.836-.655 1.682-.993 2.538-.338.856-.683 1.722-1.035 2.598-.352.876-.711 1.762-1.077 2.658-.366.896-.739 1.802-1.119 2.718-.38.916-.767 1.842-1.161 2.778-.394.936-.795 1.882-1.203 2.838-.408.956-.823 1.922-1.245 2.898-.422.976-.851 1.962-1.287 2.958-.436.996-.879 2.002-1.329 3.018-.45 1.016-.907 2.042-1.371 3.078-.464 1.036-.935 2.082-1.413 3.138-.478 1.056-.963 2.122-1.455 3.198-.492 1.076-.991 2.162-1.497 3.258-.506 1.096-1.019 2.202-1.539 3.318-.52 1.116-1.047 2.242-1.581 3.378-.534 1.136-1.075 2.282-1.623 3.438-.548 1.156-1.103 2.322-1.665 3.498-.562 1.176-1.131 2.362-1.707 3.558-.576 1.196-1.159 2.402-1.749 3.618-.59 1.216-1.187 2.442-1.791 3.678-.604 1.236-1.215 2.482-1.833 3.738-.618 1.256-1.243 2.522-1.875 3.798-.632 1.276-1.271 2.562-1.917 3.858-.646 1.296-1.299 2.602-1.959 3.918-.66 1.316-1.327 2.642-2.001 3.978-.674 1.336-1.355 2.682-2.043 4.038-.688 1.356-1.383 2.722-2.085 4.098-.702 1.376-1.411 2.762-2.127 4.158-.716 1.396-1.439 2.802-2.169 4.218-.73 1.416-1.467 2.842-2.211 4.278-.744 1.436-1.495 2.882-2.253 4.338-.758 1.456-1.523 2.922-2.295 4.398-.772 1.476-1.551 2.962-2.337 4.458-.786 1.496-1.579 3.002-2.379 4.518-.8 1.516-1.607 3.042-2.421 4.578-.814 1.536-1.635 3.082-2.463 4.638-.828 1.556-1.663 3.122-2.505 4.698-.842 1.576-1.691 3.162-2.547 4.758-.856 1.596-1.719 3.202-2.589 4.818-.87 1.616-1.747 3.242-2.631 4.878-.884 1.636-1.775 3.282-2.673 4.938-.898 1.656-1.803 3.322-2.715 4.998-.912 1.676-1.831 3.362-2.757 5.058-.926 1.696-1.859 3.402-2.799 5.118-.94 1.716-1.887 3.442-2.841 5.178-.954 1.736-1.915 3.482-2.883 5.238-.968 1.756-1.943 3.522-2.925 5.298-.982 1.776-1.971 3.562-2.967 5.358-.996 1.796-1.999 3.602-3.009 5.418-1.01 1.816-2.027 3.642-3.051 5.478-1.024 1.836-2.055 3.682-3.093 5.538-1.038 1.856-2.083 3.722-3.135 5.598-1.052 1.876-2.111 3.762-3.177 5.658-1.066 1.896-2.139 3.802-3.219 5.718-1.08 1.916-2.167 3.842-3.261 5.778-1.094 1.936-2.195 3.882-3.303 5.838-1.108 1.956-2.223 3.922-3.345 5.898-1.122 1.976-2.251 3.962-3.387 5.958-1.136 1.996-2.279 4.002-3.429 6.018-1.15 2.016-2.307 4.042-3.471 6.078-1.164 2.036-2.335 4.082-3.513 6.138-1.178 2.056-2.363 4.122-3.555 6.198-1.192 2.076-2.391 4.162-3.597 6.258-1.206 2.096-2.419 4.202-3.639 6.318-1.22 2.116-2.447 4.242-3.681 6.378-1.234 2.136-2.475 4.282-3.723 6.438-1.248 2.156-2.503 4.322-3.765 6.498-1.262 2.176-2.531 4.362-3.807 6.558-1.276 2.196-2.559 4.402-3.849 6.618-1.29 2.216-2.587 4.442-3.891 6.678-1.304 2.236-2.615 4.482-3.933 6.738-1.318 2.256-2.643 4.522-3.975 6.798-1.332 2.276-2.671 4.562-4.017 6.858-1.346 2.296-2.699 4.602-4.059 6.918-1.36 2.316-2.727 4.642-4.101 6.978-1.374 2.336-2.755 4.682-4.143 7.038-1.388 2.356-2.783 4.722-4.185 8.098-1.402 2.376-2.811 4.762-4.227 7.158-1.416 2.396-2.839 4.802-4.269 7.218-1.43 2.416-2.867 4.842-4.311 7.278-1.444 2.436-2.895 4.882-4.353 7.338-1.458 2.456-2.923 4.922-4.395 7.398-1.472 2.476-2.951 4.962-4.437 7.458-1.486 2.496-2.979 5.002-4.479 7.518-1.5 2.516-3.007 5.042-4.521 7.578-1.514 2.536-3.035 5.082-4.563 7.638-1.528 2.556-3.063 5.122-4.605 7.698-1.542 2.576-3.091 5.162-4.647 7.758-1.556 2.596-3.119 5.202-4.689 7.818-1.57 2.616-3.147 5.242-4.731 7.878-1.584 2.636-3.175 5.282-4.773 7.938-1.598 2.656-3.203 5.322-4.815 7.998-1.612 2.676-3.231 5.362-4.857 8.058-1.626 2.696-3.259 5.402-4.899 8.118-1.64 2.716-3.287 5.442-4.941 8.178-1.654 2.736-3.315 5.482-4.983 8.238-1.668 2.756-3.343 5.522-5.025 8.298-1.682 2.776-3.371 5.562-5.067 8.358-1.696 2.796-3.399 5.602-5.109 8.418-1.71 2.816-3.427 5.642-5.151 8.478-1.724 2.836-3.455 5.682-5.193 8.538-1.738 2.856-3.483 5.722-5.235 8.598-1.752 2.876-3.511 5.762-5.277 8.658-1.766 2.896-3.539 5.802-5.319 8.718-1.78 2.916-3.567 5.842-5.361 8.778-1.794 2.936-3.595 5.882-5.403 8.838-1.808 2.956-3.623 5.922-5.445 8.898-1.822 2.976-3.651 5.962-5.487 8.958-1.836 2.996-3.679 6.002-5.529 9.018-1.85 3.016-3.707 6.042-5.571 9.078-1.864 3.036-3.735 6.082-5.613 9.138-1.878 3.056-3.763 6.122-5.655 9.198-1.892 3.076-3.791 6.162-5.697 9.258-1.906 3.096-3.819 6.202-5.739 9.318-1.92 3.116-3.847 6.242-5.781 9.378-1.934 3.136-3.875 6.282-5.823 9.438-1.948 3.156-3.903 6.322-5.865 9.498-1.962 3.176-3.931 6.362-5.907 9.558-1.976 3.196-3.959 6.402-5.949 9.618-1.99 3.216-3.987 6.442-5.991 9.678-2.004 3.236-4.015 6.482-6.033 9.738-2.018 3.256-4.043 6.522-6.075 9.798-2.032 3.276-4.071 6.562-6.117 9.858-2.046 3.296-4.099 6.602-6.159 9.918-2.06 3.316-4.127 6.642-6.201 9.978-2.074 3.336-.149 6.682-2.245 10.038-2.096 3.356-4.199 6.722-6.309 10.098-2.11 3.376-4.227 6.762-6.351 10.158-2.124 3.396-4.255 6.802-6.393 10.218-2.138 3.416-4.283 6.842-6.435 10.278-2.152 3.436-4.311 6.882-6.477 10.338-2.166 3.456-4.339 6.922-6.519 10.398-2.18 3.476-4.367 6.962-6.561 10.458-2.194 3.496-4.395 7.002-6.603 10.518-2.208 3.516-4.423 7.042-6.645 10.578-2.222 3.536-4.451 7.082-6.687 10.638-2.236 3.556-4.479 7.122-6.729 10.698-2.25 3.576-4.507 7.162-6.771 10.758-2.264 3.596-4.535 7.202-6.813 10.818-2.278 3.616-4.563 7.242-6.855 10.878-2.292 3.636-4.591 7.282-.897 10.938-2.306 3.656-4.619 7.322-6.939 10.998-2.32 3.676-4.647 7.362-6.981 11.058-2.334 3.696-4.675 7.402-7.023 11.118-2.348 3.716-4.703 7.442-7.065 11.178-2.362 3.736-4.731 7.482-7.107 11.238-2.376 3.756-4.759 7.522-7.149 11.298-2.39 3.776-4.787 7.562-7.191 11.358-2.404 3.796-4.815 7.602-7.233 11.418-2.418 3.816-4.843 7.642-7.275 11.478-2.432 3.836-4.871 7.682-7.317 11.538-2.446 3.856-4.899 7.722-7.359 11.598-2.46 3.876-4.927 7.762-7.401 11.658-2.474 3.896-4.955 7.802-7.443 11.718-2.488 3.916-4.983 7.842-7.485 11.778-2.502 3.936-5.011 7.882-7.527 11.838-2.516 3.956-5.039 7.922-7.569 11.898-2.53 3.976-5.067 7.962-7.611 11.958-2.544 3.996-5.095 8.042-7.653 12.098-2.558 4.056-5.123 8.122-7.695 12.198-2.572 4.076-5.151 8.162-7.737 12.258-2.586 4.096-5.179 8.202-7.779 12.318-2.6 4.116-5.207 8.242-7.821 12.378-2.614 4.136-5.235 8.282-7.863 12.438-2.628 4.156-5.263 8.322-7.905 12.498-2.642 4.176-5.291 8.362-7.947 12.558-2.656 4.196-5.319 8.442-7.989 12.698-2.67 4.256-5.347 8.522-8.031 12.798-2.684 4.276-5.375 8.562-8.073 12.858-2.698 4.296-5.403 8.642-8.115 12.998-2.712 4.356-5.431 8.722-8.157 13.098-2.726 4.376-5.459 8.762-8.199 13.158-2.74 4.396-5.487 8.842-8.241 13.298-2.754 4.456-5.515 8.922-8.283 13.398-2.768 4.476-5.543 8.962-8.325 13.458-2.782 4.496-5.571 9.042-8.367 13.598-2.796 4.556-5.599 9.082-8.409 13.618-2.81 4.536-5.627 9.102-8.451 13.678-2.824 4.576-5.655 9.162-8.493 13.758-2.838 4.596-5.683 9.202-8.535 13.818-2.852 4.616-5.711 9.242-8.577 13.878-2.866 4.636-5.739 9.282-8.619 13.938-2.88 4.656-5.767 9.322-8.661 13.998-2.894 4.676-5.795 9.362-8.703 14.058-2.908 4.696-5.823 9.402-8.745 14.118-2.922 4.716-5.851 9.442-8.787 14.178-2.936 4.736-5.879 9.482-8.829 14.238-2.95 4.756-5.907 9.522-8.871 14.298-2.964 4.776-5.935 9.562-8.913 14.358-2.978 4.796-5.963 9.602-8.955 14.418-2.992 4.816-5.991 9.642-8.997 14.478-3.006 4.836-6.019 9.682-9.039 14.538-3.02 4.856-6.047 9.722-9.081 14.598-3.034 4.876-6.075 9.762-9.123 14.658-3.048 4.896-6.103 9.802-9.165 14.718-3.062 4.916-6.131 9.842-9.207 14.778-3.076 4.936-6.159 9.882-9.249 14.838-3.09 4.956-6.187 9.922-9.291 14.898-3.104 4.976-6.215 10.002-9.333 15.038-3.118 5.036-6.243 10.082-9.375 15.138-3.132 5.056-6.271 10.142-9.417 15.238-3.146 5.096-6.299 10.162-9.459 15.258-3.16 5.096-6.327 10.202-9.501 15.318-3.174 5.116-6.355 10.242-9.543 15.378-3.188 5.136-6.383 10.282-9.585 15.438-3.202 5.156-6.411 10.322-9.627 15.498-3.216 5.176-6.439 10.362-9.669 15.558-3.23 5.196-6.467 10.402-9.711 15.618-3.244 5.216-6.495 10.442-9.753 15.678-3.258 5.236-6.523 10.482-9.795 15.738-3.272 5.256-6.551 10.522-9.837 15.798-3.286 5.276-6.579 10.562-9.879 15.858-3.3 5.296-6.607 10.602-9.921 15.918-3.314 5.316-6.635 10.642-9.963 15.978-3.328 5.336-6.663 10.682-10.005 16.038-3.342 5.356-6.691 10.722-10.047 16.098-3.356 5.376-6.719 10.762-10.089 16.158-3.37 5.396-6.747 10.802-10.131 16.218-3.384 5.416-6.775 10.842-10.173 16.278-3.398 5.436-6.803 10.882-10.215 16.338-3.412 5.456-6.831 10.922-10.257 16.398-3.426 5.476-6.859 10.962-10.299 16.458-3.44 5.496-6.887 11.002-10.341 16.518-3.454 5.516-6.915 11.042-10.383 16.578-3.468 5.536-6.943 11.082-10.425 16.638-3.482 5.556-6.971 11.122-10.467 16.698-3.496 5.576-6.999 11.162-10.509 16.758-3.51 5.596-7.027 11.202-10.551 16.818-3.524 5.616-7.055 11.242-10.593 16.878-3.538 5.636-7.083 11.282-10.635 16.938-3.552 5.656-7.111 11.322-10.677 16.998-3.566 5.676-7.139 11.362-10.719 17.058-3.580 5.696-7.167 11.402-10.761 17.118-3.594 5.716-7.195 11.442-10.835 17.178-3.640 5.736-7.287 11.482-10.941 17.238-3.654 5.756-7.315 11.522-10.993 17.298-3.678 5.776-7.363 11.562-11.055 17.358-3.692 5.796-7.391 11.602-11.097 17.418-3.706 5.816-7.419 11.642-11.139 17.478-3.720 5.836-7.447 11.682-11.181 17.538-3.734 5.856-7.475 11.722-11.223 17.598-3.748 5.876-7.503 11.762-11.265 17.658-3.762 5.896-7.531 11.802-11.307 17.718-3.776 5.916-7.559 11.842-11.349 17.778-3.790 5.936-7.587 11.882-11.391 17.838-3.804 5.956-7.615 11.922-11.433 17.898-3.818 5.976-7.643 12.002-11.475 18.078-3.832 6.076-7.671 12.122-11.517 18.178-3.846 6.056-7.699 12.162-11.559 18.238-3.860 6.076-7.727 12.202-11.601 18.298-3.874 6.096-7.755 12.242-11.643 18.358-3.888 6.116-7.783 12.282-11.685 18.418-3.902 6.136-7.811 12.322-11.727 18.478-3.916 6.156-7.839 12.362-11.769 18.538-3.930 6.176-7.867 12.402-11.811 18.598-3.944 6.196-7.895 12.442-11.853 18.658-3.958 6.216-7.923 12.482-11.895 18.718-3.972 6.236-7.951 12.522-11.937 18.778-3.986 6.256-7.979 12.562-11.979 18.838-4.000 6.276-8.007 12.602-12.021 18.898-4.014 6.296-8.035 12.642-12.063 18.958-4.028 6.316-8.063 12.682-12.105 19.018-4.042 6.336-8.091 12.722-12.147 19.078-4.056 6.356-8.119 12.762-12.189 19.138-4.070 6.376-8.147 12.802-12.231 19.198-4.084 6.396-8.175 12.842-12.273 19.258-4.098 6.416-8.203 12.882-12.315 19.318-4.112 6.436-8.231 12.922-12.357 19.378-4.126 6.456-8.259 12.962-12.399 19.438-4.140 6.476-8.287 13.002-12.441 19.498-4.154 6.496-8.315 13.042-12.483 19.558Z"/>
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
